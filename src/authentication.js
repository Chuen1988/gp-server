const constant = require('./constant');
const { AuthenticationService, JWTStrategy } = require('@feathersjs/authentication');
const { LocalStrategy } = require('@feathersjs/authentication-local');
const { NotAuthenticated, BadRequest } = require('@feathersjs/errors');
const customError = require('./custom-error');
const revokedTokens = {};
const logger = require('./logger');
const speakeasy = require('speakeasy');
const createIORedisClient = require('./redis-client');

class MyAuthenticationService extends AuthenticationService {

  constructor(app) {
    super(app);

    //redis (Production & Staging only due to multiple instances for sync services)
    if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
      this.redisClient = createIORedisClient(app);
    }
  }

  async getPayload(authResult, params) {
    // Call original `getPayload` first
    const payload = await super.getPayload(authResult, params);
    const { user } = authResult;

    return {
      ...payload,
      userId: user._id
    };
  }

  async revokeAccessToken(accessToken) {

    //redis (Production & Staging only due to multiple instances for sync services)
    if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
      // First make sure the access token is valid
      const verified = await this.verifyAccessToken(accessToken);
      // Calculate the remaining valid time for the token (in seconds)
      //const expiry = verified.exp - Math.floor(Date.now() / 1000);

      // Add the revoked token to Redis and set expiration
      //await this.redis.set(accessToken, true, 'EX', expiry);
      await this.redisClient.set(accessToken, true);

      return verified;
    }
    else {
      // First make sure the access token is valid
      const verified = await this.verifyAccessToken(accessToken);

      revokedTokens[accessToken] = true;

      return verified;
    }
  }

  async verifyAccessToken(accessToken) {

    //redis (Production & Staging only due to multiple instances for sync services)
    if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
      if (await this.redisClient.exists(accessToken)) {
        customError.show(customError.customErrorHeader, 'Token revoked.', customError.customErrorCode445, 'Token revoked.', {});
      }

      return super.verifyAccessToken(accessToken);
    }
    else {
      // First check if the token has been revoked
      if (revokedTokens[accessToken]) {
        customError.show(customError.customErrorHeader, 'Token revoked.', customError.customErrorCode445, 'Token revoked.', {});
      }
    }

    return super.verifyAccessToken(accessToken);
  }

  async remove(id, params) {
    const authResult = await super.remove(id, params);
    const { accessToken } = authResult;

    if (accessToken) {
      // If there is an access token, revoke it
      await this.revokeAccessToken(accessToken);
    }

    return authResult;
  }
}

class MyLocalStrategy extends LocalStrategy {
  constructor(app) {
    super();
    this.app = app;
  }

  async authenticate(authRequest, params) {

    const { strategy, otp, company } = authRequest;

    this.strategy = strategy;
    this.otp = otp;
    this.company = company;

    //Check if strategy local-member is called, company must be given from FE
    if (this.strategy === 'local-member') {

      //company is given from FE
      if (this.company) {
        //Do nothing
      }
      //company is not given from FE
      else {
        throw new BadRequest('company required.');
      }
    }

    return await super.authenticate(authRequest, params);
  }


  async findEntity(username, params) {

    const entity = await super.findEntity(username, params);
    return entity;
  }

  async getEntity(entity, params) {

    /** Role checking **/
    //Member
    if (entity?.role === constant.roleMember) {
      //1. Check Member verify thru otp or not
      //Member is verified, skip
      if (entity.isVerified === true) {
        //Do nothing
      }
      //Member is not verified (OTP verification required)
      else {

        //Check company sms credits
        if (entity.company.smsCheckCredits) {

          if (entity.company.smsCredits <= 0) {
            logger.custom.info(`[authentication.js] Company - id: ${entity.company._id} - name: ${entity.company.name}, insufficient SMS Credits - ${entity.company.smsCredits}`);
            throw new NotAuthenticated('Please contact Customer Service.');
          }

        }

        //Call authManagement resendVerifySignup
        const authManagement = this.app.service('authManagement');

        //Call and get new OTP
        await authManagement.create({
          action: 'resendVerifySignup',
          //Ensure the value in authManagement ws json in string format using ``
          value: {
            user: `${entity._id}`,
            contactNumber: `${entity.contactNumber}`,
            company: `${entity.company._id}`
          }
        });

        //smsResendLimit
        let smsResendLimit = entity.company.smsResendLimit - entity.verifyResend;
        if (smsResendLimit > 0) {
          //Do nothing
        }
        else {
          smsResendLimit = 0;
        }

        customError.show(customError.customErrorHeader, 'Member is not verified.', customError.customErrorCode448, 'Member is not verified.', { userId: entity._id, contactNumber: entity.contactNumber, companyId: entity.company._id, smsResendLimit: smsResendLimit });

      }
    }
    //Other roles
    else {
      //Check if user enable Google Multi Factor Authentication
      if (entity.googleMFA === true) {
        //check if otp given from FE
        if (this.otp) {
          let verified = speakeasy.totp.verify({
            secret: entity.googleMFASecretKey,
            encoding: ['base32'],
            token: this.otp,
          });

          if (verified) {
            //Verification successful
          }
          else {
            //Verification failed
            throw new NotAuthenticated('Verfication failed.');
          }
        }
        else {
          customError.show(customError.customErrorHeader, 'Google Multi Factor Authentication is enabled.', customError.customErrorCode447, 'Google Multi Factor Authentication is enabled.', {});
        }
      }
    }
    /******/

    /**Check Company Active**/
    //Company active or not (1st layer)
    if (entity?.company?.active === false) {
      throw new NotAuthenticated('Company is Inactive');
    }
    /******/

    //Scenario where admin disable the Member
    if (entity?.status === constant.userStatusInactive) {
      throw new NotAuthenticated('User is Inactive');
    }
    else if (entity?.status === constant.userStatusSuspended) {
      throw new NotAuthenticated('User is Suspended');
    }

    return await super.getEntity(entity, params);
  }

  async getEntityQuery(query, params) {

    //MC
    if (this.strategy === 'local') {
      // Query for user main control
      return {
        ...query,
        $limit: 1,
        userNameBO: null,
        contactNumber: null,
        company: null,
        //Must populate role for ability define CASL
        $populate: constant.usersPopulateQuery
      };
    }
    //BO
    else if (this.strategy === 'local-bo') {
      // Query for user bo
      return {
        ...query,
        $limit: 1,
        userName: null,
        contactNumber: null,
        //Company is not required any more due to FE always using the same domain
        //company: this.company,
        //Must populate role for ability define CASL
        $populate: constant.usersPopulateQuery
      };
    }
    //Member
    else if (this.strategy === 'local-member') {
      // Query for user Member
      return {
        ...query,
        $limit: 1,
        userName: null,
        userNameBO: null,
        company: this.company,
        //Must populate role for ability define CASL
        $populate: constant.usersPopulateQuery
      };
    }
  }
}

class LegacyJWTStrategy extends JWTStrategy {
  getEntityId(authResult) {
    const { authentication: { payload } } = authResult;

    return payload.userId || payload.sub;
  }
}

//Google Authentication
//Not getting profile picture
// class GoogleStrategy extends OAuthStrategy {
//   async getEntityData(profile, existingEntity) {
//     // this will set 'googleId'
//     const baseData = await super.getEntityData(profile);


//     let isActive = false;
//     let profileName;

//     //Check existing entity user login before
//     if(existingEntity){
//       //Is Active
//       if(existingEntity?.active){
//         isActive = true;
//         profileName = existingEntity.name;
//       }
//       //Not Active
//       else{
//         isActive = false;
//         profileName = existingEntity.name;
//         throw new NotAuthenticated('User is not active')
//       }
//     }
//     //New User
//     else{
//       //Set active true and profile name
//       isActive = true;
//       profileName = profile.name;
//     }


//     return {
//       ...baseData,
//       active: isActive,
//       name: profileName,
//       email: profile.email
//     };
//   }
// }

//Facebook Authentication
//Not getting profile picture
// class FacebookStrategy extends OAuthStrategy {
//   async getProfile (authResult) {
//     // This is the OAuth access token that can be used
//     // for Facebook API requests as the Bearer token
//     const accessToken = authResult.access_token;

//     const { data } = await axios.get('https://graph.facebook.com/me', { timeout: constant.axiosTimeout }, {
//       headers: {
//         authorization: `Bearer ${accessToken}`
//       },
//       params: {
//         // Get id, name, and email ONLY
//         fields: 'id,name,email'
//       }
//     });

//     return data;
//   }

//   async getEntityData(profile, existingEntity) {
//     // `profile` is the data returned by getProfile
//     const baseData = await super.getEntityData(profile);

//     let isActive = false;
//     let profileName;

//     //Check existing entity user login before
//     if(existingEntity){
//       //Is Active
//       if(existingEntity?.active){
//         isActive = true;
//         profileName = existingEntity.name;
//       }
//       //Not Active
//       else{
//         isActive = false;
//         profileName = existingEntity.name;
//         throw new NotAuthenticated('User is not active')
//       }
//     }
//     //New User
//     else{
//       //Set active true and profile name
//       isActive = true;
//       profileName = profile.name;
//     }

//     return {
//       ...baseData,
//       active: isActive,
//       name:  profileName,
//       email: profile.email
//     };
//   }
// }

// //Github authentication
// //Not getting profile picture
// class GitHubStrategy extends OAuthStrategy {
//   async getEntityData(profile) {
//     const baseData = await super.getEntityData(profile);

//     return {
//       ...baseData,
//       // You can also set the display name to profile.name
//       name: profile.login,
//       // The user email address (if available)
//       email: profile.email
//     };
//   }
// }

module.exports = app => {
  const authentication = new MyAuthenticationService(app);
  authentication.register('jwt', new LegacyJWTStrategy());
  authentication.register('local', new MyLocalStrategy(app));
  authentication.register('local-bo', new MyLocalStrategy(app));
  authentication.register('local-member', new MyLocalStrategy(app));
  //authentication.register('google', new GoogleStrategy());
  //authentication.register('facebook', new FacebookStrategy());
  //authentication.register('github', new GitHubStrategy());

  app.use('/authentication', authentication);
  app.service('authentication').hooks({
    before: {
      create: [
        async context => {

          //Check for Member login contact number
          if (context.data.strategy === 'local-member') {

            if (context.data.contactNumber) {

              //Check contactNumber phone code start with 60 ONLY, remove 0 if found
              if (context.data.contactNumber.startsWith('60')) {

                //If found 0, remove it
                if (context.data.contactNumber.substring(2, 3) === '0') {

                  //Phone code + removed 0 phone code
                  let finalContactNumber = context.data.contactNumber.substring(0, 2) + context.data.contactNumber.substring(3);

                  context.data.contactNumber = finalContactNumber;
                }
              }
            }
            else {
              throw new BadRequest('contactNumber required for Member.');
            }
          }
        }
      ]
    },
    after: {
      create: [
        async context => {
          const users = context.app.service('users');
          const companies = context.app.service('companies');

          //Get user
          const resultUsersGet = await users.get(context.result.user._id, {
            query: {
              //Populate usersPopulateQuery (will be handle in users.hook GET as well due to FE required)
              $populate: constant.usersPopulateQuery
            }
          });

          //Check current access token (could be after register Member is null, skip the checking)
          if (resultUsersGet.accessToken) {
            //Check the current accessToken (if it is not same with db token, ignore if it is same jwt token due to autologin)
            if (resultUsersGet.accessToken !== context.result.accessToken) {
              logger.custom.info('[authentication.js] db jwt token and after login jwt token NOT SAME!');
              //if it is login using JWT, revoke it
              if (context.data.strategy === 'jwt') {
                logger.custom.info('[authentication.js] strategy - jwt - revoke after login jwt token');
                //Revoke authorization token
                const revokeAccessToken = await authentication.revokeAccessToken(context.result.accessToken);
                //If able to proceed to this step, means the accessToken is revoked. but not showing token revoked. Hence show error
                if (revokeAccessToken) {
                  customError.show(customError.customErrorHeader, 'Token revoked.', customError.customErrorCode445, 'Token revoked.', {});
                }
              }
            }
          }

          //Check IP address
          let ipAddress = '';

          //Check if it is from REST
          //REST
          if (context?.params?.provider == constant.providerRest) {
            logger.custom.info('[authentication.js] REST authentication');
            if (context.params.ip) {
              ipAddress = context.params.ip;
            }
          }

          //Check if it is from SocketIO
          //SocketIO
          else if (context?.params?.provider == constant.providerSocketIO) {
            logger.custom.info('[authentication.js] SOCKET authentication');

            //Get ip address from Client with x-forwarded-for due to HAProxy
            if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
              if (context?.params?.handshake?.headers['x-forwarded-for']) {
                ipAddress = context.params.handshake.headers['x-forwarded-for'];
              }
            }
            else {
              if (context?.params?.handshake?.address) {
                ipAddress = context.params.handshake.address;
              }
            }
          }

          //Get ip address from Client with x-forwarded-for due to HAProxy
          if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
            //Do nothing
          }
          else {
            //If found subnet prefix in front
            if (ipAddress.substring(0, constant.subnetPrefix.length) === constant.subnetPrefix) {
              ipAddress = ipAddress.substring(constant.subnetPrefix.length);
            }
          }


          //Patch new accessToken (do not publish to socket)
          //(only in server db do not push to socket) query not required
          await users.patch(context.result.user._id, {
            accessToken: context.result.accessToken,
            lastLogin: new Date(),
            lastLoginIP: ipAddress
          }, {
            query: {
              $populate: constant.usersPopulateQuery
            },
            connection: {
              provider: constant.connectionProviderServer
            }
          });

          /*********************/

          //For main control access to BO Company
          if (context.data.strategy === 'jwt' && context.data.company) {

            //MC
            if (context?.result?.user?.role === constant.roleMCAdmin ||
              context?.result?.user?.role === constant.roleMCManager ||
              context?.result?.user?.role === constant.roleMCCS) {

              //Append company object to the user object
              const resultCompaniesGet = await companies.get(context.data.company, null);
              context.result.user.company = resultCompaniesGet;
            }
            else {
              throw new BadRequest('Role do not have permission to access.');
            }
          }

          //Update User pnId when login
          // if(context?.data){
          //   if(context.data?.pnId){
          //     // //Update pnId
          // const resultUsersPatch = await users.patch(context.result.user._id, {
          //   pnId:context.data.pnId
          // }, {
          //   query:{
          //     $populate: constant.usersPopulateQuery
          //   }
          // })
          //     logger.custom.info('[authentication.js] ***resultUsersPatch'+JSON.stringify(resultUsersPatch));
          //   }
          // }

          // Make sure the password, googleMFASecretKey field is never sent to the client and also server
          delete context.result.user['password'];
          delete context.result.user['googleMFASecretKey'];
          delete context.result.user['isVerified'];
          delete context.result.user['verifyToken'];
          delete context.result.user['verifyShortToken'];
          delete context.result.user['verifyExpires'];
          delete context.result.user['verifyAttempts'];
          delete context.result.user['verifyChanges'];
          delete context.result.user['verifyResend'];
          delete context.result.user['resetToken'];
          delete context.result.user['resetShortToken'];
          delete context.result.user['resetExpires'];
          delete context.result.user['resetAttempts'];
          delete context.result.user['resetResend'];

          // Returning will resolve the promise with the `context` object
          return context;
        }
      ],
      remove: [
        //Update User pnId when logout
        async context => {

          const users = context.app.service('users');

          //Get user
          const resultUsersGet = await users.get(context.result.user._id, {
            query: {
              //Populate usersPopulateQuery (will be handle in users.hook GET as well due to FE required)
              $populate: constant.usersPopulateQuery
            }
          });

          //Check the current accessToken (if it is not same with previous token, ignore if it is same jwt token due to autologin)
          if (resultUsersGet.accessToken !== context.result.accessToken) {
            //Revoke authorization token
            const revokeAccessToken = await authentication.revokeAccessToken(context.result.accessToken);
            //If able to proceed to this step, means the accessToken is revoked. but not showing token revoked. Hence show error
            if (revokeAccessToken) {
              customError.show(customError.customErrorHeader, 'Token revoked.', customError.customErrorCode445, 'Token revoked.', {});
            }
          }

          //Patch delete accessToken (do not publish to socket)
          //(only in server db do not push to socket) query not required
          await users.patch(context.result.user._id, {
            accessToken: null,
            pnId: null
          }, {
            query: {
              $populate: constant.usersPopulateQuery
            },
            connection: {
              provider: constant.connectionProviderServer
            }
          });

          // Returning will resolve the promise with the `context` object
          return context;
        }
      ]
    },
    error: {
      all: [
        async context => {
          if (context.error) {
            const error = context.error;

            //Temporary fixed for FE keep accessToken and login while clear players all records is executed (user get not found record _id)
            if (error?.code === 404) {
              context.error = customError.show(customError.customErrorHeader, 'Token revoked.', customError.customErrorCode445, 'Token revoked.', {});
            }

          }

          return context;
        }
      ],
      find: [],
      get: [],
      create: [],
      update: [],
      patch: [],
      remove: []
    }
  });
};