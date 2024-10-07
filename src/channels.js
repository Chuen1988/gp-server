const constant = require('./constant');
const logger = require('./logger');
const utils = require('./utils');

function isPublishSocket(hook) {
  let allowPublishSocket = true;

  if (hook?.params?.connection?.provider) {
    if (hook.params.connection.provider === constant.connectionProviderServer) {
      allowPublishSocket = false;
    } else {
      allowPublishSocket = true;
    }
  }
  //params null could be server
  else {
    allowPublishSocket = true;
  }

  return allowPublishSocket;
}

module.exports = function (app) {
  const rooms = app.service('rooms');

  if (typeof app.channel !== 'function') {
    // If no real-time functionality has been configured just return
    return;
  }

  //Socket connected
  app.on('connection', async connection => {

    //Check connection
    if (connection) {
      // On a new real-time connection, add it to the anonymous channel
      app.channel('anonymous').join(connection);

      //Added log for socket connection
      //Get ip address from Client with x-forwarded-for due to HAProxy
      if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
        logger.custom.info(`[channels.js] anonymous is connected with socket details: origin - ${connection?.handshake?.headers?.origin} user-agent - ${connection?.handshake?.headers['user-agent']} socket unique id - ${utils.getSocketUniqueId(connection?.handshake)} address - ${connection?.handshake?.headers['x-forwarded-for']}`);
      }
      else {
        logger.custom.info(`[channels.js] anonymous is connected with socket details: origin - ${connection?.handshake?.headers?.origin} user-agent - ${connection?.handshake?.headers['user-agent']} socket unique id - ${utils.getSocketUniqueId(connection?.handshake)} address - ${connection?.handshake?.address}`);
      }
    }
    else {
      logger.custom.info('[channels.js] connection - missing connection');
    }
  });

  //Disconnect (browser close, leave socket)
  app.on('disconnect', async connection => {
    //Check connection
    if (connection) {
      //Disconnect will automatically leave all the channels

      const user = connection.user;

      //Logs
      if (user) {
        //Added log for socket connection
        //Get ip address from Client with x-forwarded-for due to HAProxy
        if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
          logger.custom.info(`[channels.js] GP user socket disconnected details: origin - ${connection?.handshake?.headers?.origin} user-agent - ${connection?.handshake?.headers['user-agent']} socket unique id - ${utils.getSocketUniqueId(connection?.handshake)} address - ${connection?.handshake?.headers['x-forwarded-for']}`);
        }
        else {
          logger.custom.info(`[channels.js] GP user socket disconnected details: origin - ${connection?.handshake?.headers?.origin} user-agent - ${connection?.handshake?.headers['user-agent']} socket unique id - ${utils.getSocketUniqueId(connection?.handshake)} address - ${connection?.handshake?.address}`);
        }

        //MC
        if (user.userName)
          logger.custom.info(`[channels.js] user userName: ${user.userName} - _id: ${user._id} is disconnected`);

        //BO
        if (user.userNameBO)
          logger.custom.info(`[channels.js] user userNameBO: ${user.userNameBO} - _id: ${user._id} is disconnected`);

        //Member
        if (user.contactNumber)
          logger.custom.info(`[channels.js] user contactNumber: ${user.contactNumber} - _id: ${user._id} is disconnected`);
      }
      //anonymous
      else {
        //Added log for socket connection
        //Get ip address from Client with x-forwarded-for due to HAProxy
        if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
          logger.custom.info(`[channels.js] anonymous socket disconnected details: origin - ${connection?.handshake?.headers?.origin} user-agent - ${connection?.handshake?.headers['user-agent']} socket unique id - ${utils.getSocketUniqueId(connection?.handshake)} address - ${connection?.handshake?.headers['x-forwarded-for']}`);
        }
        else {
          logger.custom.info(`[channels.js] anonymous socket disconnected details: origin - ${connection?.handshake?.headers?.origin} user-agent - ${connection?.handshake?.headers['user-agent']} socket unique id - ${utils.getSocketUniqueId(connection?.handshake)} address - ${connection?.handshake?.address}`);
        }
      }
    }
    else {
      logger.custom.info('[channels.js] disconnect - missing connection');
    }
  });

  //Login
  app.on('login', async (authResult, { connection }) => {
    // connection can be undefined if there is no
    // real-time connection, e.g. when logging in via REST
    //Check connection
    if (connection) {
      // The connection is no longer anonymous, remove it
      app.channel('anonymous').leave(connection);

      // Obtain the logged in user from the connection socket
      const user = connection.user;

      //When user status is active, emergency only allowed to join channels
      if (user?.status === constant.userStatusActive ||
        user?.status === constant.userStatusEmergency) {

        /* role */

        // Main Control	
        // 1.	Admin
        // 2.	Manager
        // 3.	Customer Service

        // Back Office	
        // 1.	BO Admin
        // 2.	BO Staff
        // 3.	BO Agent
        // 4.	BO CS
        // 5.	BO Kounter
        // 6.	BO Helper (Only available for Main Control)

        // Member Site	
        // 1.	Member

        /***** Main Control ******/
        if (user.role === constant.roleMCAdmin ||
          user.role === constant.roleMCManager ||
          user.role === constant.roleMCCS) {

          app.channel('main-control').join(connection);

          logger.custom.info(`[channels.js] web socket Main Control - id: ${user._id} - name: ${user.userName} join the connection`);
        }

        /***** Back Office *****/
        else if (user.role === constant.roleBOAdmin ||
          user.role === constant.roleBOStaff ||
          user.role === constant.roleBOAgent ||
          user.role === constant.roleBOCS ||
          user.role === constant.roleBOKounter ||
          user.role === constant.roleBOHelper) {

          //All back-office
          app.channel('back-office').join(connection);
          //Specific back-office user
          app.channel(`back-office/${user._id}`).join(connection);

          //Back Office always have the company
          const companyId = utils.getObjectId(user.company);

          //Join back office channel
          app.channel(`back-office/${companyId}`).join(connection);

          logger.custom.info(`[channels.js] web socket Back Office company - id: ${user._id} - company: ${companyId} - userNameBO: ${user.userNameBO} join the connection`);
        }


        /***** Member *****/
        else if (user.role === constant.roleMember) {
          //All Member
          app.channel('member').join(connection);
          //Specific Member user
          app.channel(`member/${user._id}`).join(connection);

          //Member always have the company
          const companyId = utils.getObjectId(user.company);

          //Join Member channel
          app.channel(`member/${companyId}`).join(connection);

          logger.custom.info(`[channels.js] web socket Member company - id: ${user._id} - company: ${companyId} - contactNumber: ${user.contactNumber} join the connection`);

          // Check if the player user has joined the chatroom
          if (user.rooms) {

            user.rooms.forEach(async (room) => {

              const roomId = utils.getObjectId(room);

              app.channel(`rooms/${roomId}`).join(connection);

              return;
            });
          }
        }
      }
      //When user status is not active, not emergency, not suspended
      else {
        //Do nothing not allowed to join channels
      }

      // E.g. to send real-time events only to admins use
      // if(user.isAdmin) { app.channel('admins').join(connection); }
      // If the user has joined e.g. chat rooms
      // if(Array.isArray(user.rooms)) user.rooms.forEach(room => app.channel(`rooms/${room.id}`).join(connection));
      // Easily organize users by email and userid for things like messaging
      // app.channel(`emails/${user.email}`).join(connection);
      // app.channel(`userIds/${user.id}`).join(connection);
    }
    else {
      logger.custom.info('[channels.js] login - missing connection');
    }
  });

  //Logout
  app.on('logout', async (payload, { connection }) => {

    //Check connection
    if (connection) {
      //When logging out, leave all channels before joining anonymous channel
      app.channel('anonymous').join(connection);

      //Added log for socket connection
      //Get ip address from Client with x-forwarded-for due to HAProxy
      if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
        logger.custom.info(`[channels.js] anonymous socket connected details: origin - ${connection?.handshake?.headers?.origin} user-agent - ${connection?.handshake?.headers['user-agent']} socket unique id - ${utils.getSocketUniqueId(connection?.handshake)} address - ${connection?.handshake?.headers['x-forwarded-for']}`);
      }
      else {
        logger.custom.info(`[channels.js] anonymous socket connected details: origin - ${connection?.handshake?.headers?.origin} user-agent - ${connection?.handshake?.headers['user-agent']} socket unique id - ${utils.getSocketUniqueId(connection?.handshake)} address - ${connection?.handshake?.address}`);
      }
    }
    else {
      logger.custom.info('[channels.js] logout - missing connection');
    }
  });

  //Default Publishment
  // eslint-disable-next-line no-unused-vars
  app.publish((data, hook) => {
    // Here you can add event publishers to channels set up in `channels.js`
    // To publish only for a specific event use `app.publish(eventname, () => {})`

    if (isPublishSocket(hook)) {

      logger.custom.info('[channels.js] Publishing all events to all main-control users.');

      return [
        app.channel('main-control')
      ];
    } else {
      return null;
    }
  });

  //When a user is removed, make all their connections leave every channel
  app.service('users').on('removed', user => {
    app.channel(app.channels).leave(connection => {
      //Checking for connection.user._id undefined
      if (connection?.user?._id) {
        return user._id === connection.user._id;
      }
      else {
        return;
      }
    });
  });

  //users
  app.service('users').publish((data, hook) => {

    if (isPublishSocket(hook)) {

      logger.custom.info('[channels.js] Publishing users events to main-control & specific back-office & specific member user');


      let channels = [];

      //Main 
      channels.push(app.channel('main-control'));

      //BO
      //Checking for company
      if (data.company) {

        const companyId = utils.getObjectId(data.company);

        channels.push(app.channel(`back-office/${companyId}`));
      }

      //Member
      channels.push(app.channel(`member/${data._id}`));

      return channels;
    }
    else {
      return null;
    }
  });

  //companies
  app.service('companies').publish((data, hook) => {

    if (isPublishSocket(hook)) {

      logger.custom.info('[channels.js] Publishing companies events to main-control & specific back-office & specific member back-office');

      return [
        //MC
        app.channel('main-control'),
        //BO
        app.channel(`back-office/${data._id}`),
        //Member
        app.channel(`member/${data._id}`),
      ];
    } else {
      return null;
    }
  });

  //rooms
  app.service('rooms').publish((data, hook) => {

    if (isPublishSocket(hook)) {

      logger.custom.info('[channels.js] Publishing rooms events to main-control & specific back-office & specific room');

      let channels = [];

      const companyId = utils.getObjectId(data.company);

      //MC
      channels.push(app.channel('main-control'));

      //BO
      channels.push(app.channel(`back-office/${companyId}`));

      //Member (using room that have joined)
      channels.push(app.channel(`rooms/${data._id}`));

      return channels;
    } else {
      return null;
    }
  });

  //messages
  app.service('messages').publish(async (data, hook) => {

    if (isPublishSocket(hook)) {

      logger.custom.info('[channels.js] Publishing messages events to main-control & specific back-office & specific member room');

      let channels = [];

      const companyId = utils.getObjectId(data.company);
      const roomId = utils.getObjectId(data.room);

      //MC
      channels.push(app.channel('main-control'));

      //BO
      //Currently all BO roles will have all permission and access to message
      channels.push(app.channel(`back-office/${companyId}`));

      //Member room
      channels.push(app.channel(`rooms/${roomId}`));

      return channels;
    } else {
      return null;
    }
  });

  // Here you can also add service specific event publishers
  // e.g. the publish the `users` service `created` event to the `admins` channel
  // app.service('users').publish('created', () => app.channel('admins'));

  // With the userid and email organization from above you can easily select involved users
  // app.service('messages').publish(() => {
  //   return [
  //     app.channel(`userIds/${data.createdBy}`),
  //     app.channel(`emails/${data.recipientEmail}`)
  //   ];
  // });
};