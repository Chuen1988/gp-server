// Application hooks that run for every service
const customError = require('./custom-error');
const { when } = require('feathers-hooks-common');
const hookLogger = require('./hooks/logger');
const authorize = require('./hooks/abilities');
const authenticate = require('./hooks/authenticate');
const logger = require('./logger');
const createIORedisClient = require('./redis-client');

module.exports = {
  before: {
    all: [
      when(
        //Compare with string 'authentication' WS
        hook => hook.params.provider && `/${hook.path}` !== '/authentication',
        authenticate,
        authorize()
      ),

      //API Rate Limit
      async context => {

        //redis (Production & Staging only due to multiple instances for sync services)
        if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {

          //TODO dummy API Rate limit
          //For certain WS ONLY
          if (context.path == 'calculate-commission') {

            //External server calling
            if (context?.params?.provider) {
              logger.custom.info(`[app.hook.js] API Rate Limit - ${context.path} - ALL external server calling`);

              if (context?.params?.user?._id) {

                const redisClient = createIORedisClient(context.app);

                let redisKey;
                let apiRateLimitSeconds;
                let errorMessage = 'Please try again.';

                redisKey = `ARL-${context.method}-${context.path}-${context.params.user._id}`;
                //1s
                apiRateLimitSeconds = 1;

                let value;
                try {
                  //incr will increase 1 for the key, if key not found will start with 0
                  value = await redisClient.incr(redisKey);
                }
                catch (e) {
                  logger.custom.error('[app.hook.js] API Rate Limit - could not increment key');
                  logger.custom.error(`[app.hook.js] API Rate Limit - ${e}`);
                  throw e;
                }

                //check rate limit
                if (value > 1) {
                  //quit redis connection
                  await redisClient.quit();
                  customError.show(customError.customErrorHeader, errorMessage, customError.customErrorCode455, errorMessage, {});
                }
                else {
                  try {
                    //expire redis key
                    await redisClient.expire(redisKey, apiRateLimitSeconds);
                  }
                  catch (e) {
                    logger.custom.error('[app.hook.js] API Rate Limit - could not expire key');
                    logger.custom.error(`[app.hook.js] API Rate Limit - ${e}`);
                    throw e;
                  }
                  //quit redis connection
                  await redisClient.quit();
                }
              }
            }
            //Internal server calling (undefined according to feathersjs document)
            else {
              logger.custom.info(`[app.hook.js] API Rate Limit - ${context.path} - ALL internal server calling`);
              //Do nothing
            }
          }
        }

        return context;
      },

      function (hook) {

        if (hook?.params?.user) {

          //MC
          if (hook?.params?.user?.userName) {
            logger.custom.info(`[app.hook.js] - hook path: ${hook.path} - method: ${hook.method} - MC user: ${hook.params.user.userName}`);
          }

          //BO
          if (hook?.params?.user?.userNameBO) {
            logger.custom.info(`[app.hook.js] - hook path: ${hook.path} - method: ${hook.method} - BO user: ${hook.params.user.userNameBO}`);
          }

          //Member
          if (hook?.params?.user?.contactNumber) {
            logger.custom.info(`[app.hook.js] - hook path - ${hook.path} - method: ${hook.method} - Member user: ${hook.params.user.contactNumber}`);
          }

        }

      }
    ],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    all: [hookLogger()],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [
      hookLogger(),

      //To handle the scenario where certain defined API hit error, remove redis key to avoid user waiting
      //API Rate Limit
      async context => {

        //API Rate Limit error
        if (context?.error?.code === customError.customErrorCode455) {
          //Do nothing
        }
        else {
          //redis (Production & Staging only due to multiple instances for sync services)
          if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {

            //TODO dummy API Rate limit
            //For certain WS ONLY
            if (context.path == 'calculate-commission') {

              //External server calling
              if (context?.params?.provider) {
                logger.custom.info(`[app.hook.js] error API Rate Limit - ${context.path} - ALL external server calling`);

                if (context?.params?.user?._id) {

                  const redisClient = createIORedisClient(context.app);

                  let redisKey;
                  redisKey = `ARL-${context.method}-${context.path}-${context.params.user._id}`;

                  await redisClient.del(redisKey);
                  //quit redis connection
                  await redisClient.quit();
                }
              }
              //Internal server calling (undefined according to feathersjs document)
              else {
                logger.custom.info(`[app.hook.js] error API Rate Limit - ${context.path} - ALL internal server calling`);
                //Do nothing
              }
            }
          }
        }
      }
    ],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};
