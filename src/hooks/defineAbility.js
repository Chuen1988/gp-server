const { defineAbility } = require('@casl/ability');
const constant = require('../constant');
const utils = require('../utils');

module.exports = function defineAbilityFor(user) {
  return defineAbility((can, cannot) => {

    //Any one (Anonymous)
    can('create', ['users', 'authManagement', 'messages', 'rooms']);

    //Make it anonymous for rooms, messages and company-contacts due to reactjs socket not able to pass in deviceid,companyid,roomid in socket header
    //Any One (Anonymous) for rooms
    //can(['get', 'find'], ['rooms']);
    //can(['update', 'patch'], ['rooms']);

    //Any One (Anonymous) for messages
    //can(['get', 'find'], ['messages']);
    //can(['update', 'patch'], ['messages']);
    /********************************/


    if (user) {
      //Only User status active, emergency allowed to performed
      if (user.status === constant.userStatusActive ||
        user.status === constant.userStatusEmergency) {

        /* Main Control */
        if (user.role === constant.roleMCAdmin ||
          user.role === constant.roleMCManager ||
          user.role === constant.roleMCCS) {

          //All models services  
          can(['create', 'get', 'find', 'update', 'patch', 'remove'], ['users', 'companies', 'messages', 'rooms']);
        }

        /* BO */
        else if (user.role === constant.roleBOAdmin ||
          user.role === constant.roleBOStaff ||
          user.role === constant.roleBOAgent ||
          user.role === constant.roleBOCS ||
          user.role === constant.roleBOKounter ||
          user.role === constant.roleBOHelper) {

          //users
          can(['get', 'find', 'update', 'patch', 'remove'], ['users'], { company: user.company._id });
          //companies
          can(['get', 'find', 'update', 'patch', 'remove'], ['companies'], { _id: user.company._id });
          //rooms
          can(['create'], ['rooms']);
          //messages, rooms
          can(['get', 'find', 'update', 'patch', 'remove'], ['messages', 'rooms'], { company: user.company._id });

        }

        /* Member */
        else if (user.role === constant.roleMember) {

          //users
          can(['get', 'find', 'update', 'patch', 'remove'], ['users'], { _id: user._id });
          //companies
          can(['get', 'find'], ['companies'], { _id: user.company._id });

          //messages
          let roomsId = [];
          if (user.rooms) {
            for (let room of user.rooms) {
              roomsId.push(utils.getObjectId(room));
            }
          }

          //messages
          can(['get', 'find'], ['messages'], { company: user.company._id, room: { $in: roomsId } });
          can(['update', 'patch', 'remove'], ['messages'], { company: user.company._id, room: { $in: roomsId }, user: user._id, });
          //rooms
          can(['get', 'find', 'update', 'patch'], ['rooms'], { company: user.company._id, _id: { $in: roomsId } });
        }
      }
      else {
        can(['get', 'find'], ['users'], { _id: user._id });
      }
    }
  });
};