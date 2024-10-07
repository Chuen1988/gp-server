const { BadRequest, NotAuthenticated } = require('@feathersjs/errors');
const accountService = require('../authmanagement/notifier');
const constant = require('../../constant');
const utils = require('../../utils');
const logger = require('../../logger');

module.exports = {
  before: {
    all: [],
    find: [],
    get: [],
    create: [
      //For reset otp verification attempt to 0 when request new otp & checking registartion OTP verification 3 times
      async context => {
        const users = context.app.service('users');

        if (context?.data?.action) {
          //verifySignupShort (Short Token Verification)
          if (context.data.action === 'verifySignupShort') {

            if (context?.data?.value?.user?._id && context?.data?.value?.user?.contactNumber && context?.data?.value?.user?.company && context?.data?.value?.token) {

              const resultUsersGet = await users.get(context.data.value.user._id, {
                query: {
                  //Populate usersPopulateQuery (will be handle in users.hook GET as well due to FE required)
                  $populate: constant.usersPopulateQuery
                }
              });

              if (resultUsersGet.verifyShortToken) {

                //Correct short token
                if (JSON.stringify(resultUsersGet.verifyShortToken) === JSON.stringify(context.data.value.token)) {
                  //Let the default flow handle it, remove unwanted _id (unable to change original behaviour of verifySignupShort)
                  //default "value": {"user":{"_id": "xxxx","contactNumber":"60xxxxxxxxx", "company":"xxxxx"},"token":"xxxxx"}
                  delete context.data.value.user['_id'];
                }
                //Incorrect short token
                else {
                  if (resultUsersGet.verifyAttempts == 0) {
                    //Ignore it, let the authmanagement to invoke it
                    //Let the default flow handle it, remove unwanted _id (unable to change original behaviour of verifySignupShort)
                    //default "value": {"user":{"_id": "xxxx","contactNumber":"60xxxxxxxxx", "company":"xxxxx"},"token":"xxxxx"}
                    delete context.data.value.user['_id'];
                  }
                  else {
                    const numberOfVerifyAttempt = resultUsersGet.verifyAttempts - 1;

                    //Update otp verify attempt
                    await users.patch(resultUsersGet._id, {
                      verifyAttempts: numberOfVerifyAttempt
                    }, {
                      query: {
                        $populate: constant.usersPopulateQuery
                      },
                      connection: {
                        provider: constant.connectionProviderServer
                      }
                    });

                    //Ignore 0
                    throw new BadRequest(`Invalid token. Number of retry [${numberOfVerifyAttempt + 1}]`);
                  }
                }
              }
              else {
                throw new BadRequest('verifyShortToken not found.');
              }
            }
            else {
              throw new BadRequest('user id, contactNumber, company and token required.');
            }
          }

          //resendVerifySignup (Short Token resend)
          else if (context.data.action === 'resendVerifySignup') {

            if (context?.data?.value?.user && context?.data?.value?.contactNumber && context?.data?.value?.company) {

              //Update otp verify attempt
              await users.patch(context.data.value.user, {
                verifyAttempts: constant.verifyAttempts
              }, {
                query: {
                  $populate: constant.usersPopulateQuery
                },
                connection: {
                  provider: constant.connectionProviderServer
                }
              });

              //Let the default flow handle it, remove unwanted _id (unable to change original behaviour of resendVerifySignup)
              //default "value": {"user":"xxxx","contactNumber":"60xxxxxxxxx","company":"xxxxxxx"}
              delete context.data.value['user'];

            }
            else {
              throw new BadRequest('user, contactNumber and company required.');
            }
          }
        }
        else {
          throw new BadRequest('action required.');
        }

        return context;
      }
    ],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [
      async context => {
        const users = context.app.service('users');

        if (context.data.action) {

          //Resend Verify Signup
          if (context.data.action === 'resendVerifySignup') {
            const resultUsersGet = await users.get(context.result['_doc']._id, {
              query: {
                //Populate usersPopulateQuery (will be handle in users.hook GET as well due to FE required)
                $populate: constant.usersPopulateQuery
              }
            });

            if (resultUsersGet.verifyResend >= resultUsersGet.company.smsResendLimit) {
              throw new BadRequest('Exceed maximum SMS limit, please try again tomorrow.');
            }
            else {

              //Check company sms credits
              if (resultUsersGet.company.smsCheckCredits) {

                if (resultUsersGet.company.smsCredits <= 0) {
                  logger.custom.info(`[authmanagement.hooks.js] Company - id: ${resultUsersGet.company._id} - name: ${resultUsersGet.company.name}, insufficient SMS Credits - ${resultUsersGet.company.smsCredits}`);
                  throw new NotAuthenticated('Please contact Customer Service.');
                }
              }

              //trigger notifier
              accountService(context.app).notifier('resendVerifySignup', resultUsersGet);
              
              //Update new verify resend
              const resultUsersPatch = await users.patch(resultUsersGet._id, {
                $inc: {
                  verifyResend: 1
                }
              }, {
                query: {
                  $populate: constant.usersPopulateQuery
                }
              });

              //Select certain field pass to FE
              context.result = utils.filterObj(resultUsersPatch, constant.usersPlayerNotifierSelectFields);

              //smsResendLimit
              let smsResendLimit = resultUsersPatch.company.smsResendLimit - resultUsersPatch.verifyResend;
              if (smsResendLimit > 0) {
                //Do nothing
              }
              else {
                smsResendLimit = 0;
              }

              context.result.smsResendLimit = smsResendLimit;
            }
          }

          //Sign Up Verification Short Token
          //Update verifyAttempt to default value
          else if (context.data.action === 'verifySignupShort') {
            const resultUsersPatch = await users.patch(context.result['_doc']._id, {
              status: constant.userStatusActive,
              verifyAttempts: constant.verifyAttempts
            }, {
              query: {
                $populate: constant.usersPopulateQuery
              }
            });

            //trigger notifier
            accountService(context.app).notifier('verifySignup', resultUsersPatch);

            //Select certain field pass to FE
            context.result = utils.filterObj(resultUsersPatch, constant.usersPlayerNotifierSelectFields);

            //Auto login for member once otp is verified
            // const resultAuthentication = await authentication.create({
            //   strategy: 'local-member',
            //   contactNumber: resultUsersPatch.contactNumber,
            //   password: resultUsersPatch.playerPassword,
            //   company: resultUsersPatch.company._id
            // }, null);

            // context.result = resultAuthentication;
            //smsResendLimit
            context.result.smsResendLimit = 0;
          }

          //Send Reset Password
          else if (context.data.action === 'sendResetPwd') {
            const resultUsersGet = await users.get(context.result['_doc']._id, {
              query: {
                //Populate usersPopulateQuery (will be handle in users.hook GET as well due to FE required)
                $populate: constant.usersPopulateQuery
              }
            });

            if (resultUsersGet.resetResend >= resultUsersGet.company.smsResendLimit) {
              throw new BadRequest('Exceed maximum SMS limit, please try again tomorrow.');
            }
            else {

              //Check company sms credits
              if (resultUsersGet.company.smsCheckCredits) {

                if (resultUsersGet.company.smsCredits <= 0) {
                  logger.custom.info(`[authmanagement.hooks.js] Company - id: ${resultUsersGet.company._id} - name: ${resultUsersGet.company.name}, insufficient SMS Credits - ${resultUsersGet.company.smsCredits}`);
                  throw new NotAuthenticated('Please contact Customer Service.');
                }
              }

              //trigger notifier
              accountService(context.app).notifier('sendResetPwd', resultUsersGet);

              //Update new reset resend
              const resultUsersPatch = await users.patch(resultUsersGet._id, {
                $inc: {
                  resetResend: 1
                }
              }, {
                query: {
                  $populate: constant.usersPopulateQuery
                }
              });

              //Select certain field pass to FE
              context.result = utils.filterObj(resultUsersPatch, constant.usersPlayerNotifierSelectFields);

              //smsResendLimit
              let smsResendLimit = resultUsersPatch.company.smsResendLimit - resultUsersPatch.resetResend;
              if (smsResendLimit > 0) {
                //Do nothing
              }
              else {
                smsResendLimit = 0;
              }

              context.result.smsResendLimit = smsResendLimit;
            }
          }

          //Reset New Password Short Token
          else if (context.data.action === 'resetPwdShort') {
            const resultUsersPatch = await users.patch(context.result['_doc']._id, {
              password: context.data.value.password
            }, {
              query: {
                $populate: constant.usersPopulateQuery
              }
            });

            //trigger notifier
            accountService(context.app).notifier('resetPwd', resultUsersPatch);

            //Select certain field pass to FE
            context.result = utils.filterObj(resultUsersPatch, constant.usersPlayerNotifierSelectFields);

            //Auto login for member once otp is verified
            // const resultAuthentication = await authentication.create({
            //   strategy: 'local-member',
            //   contactNumber: resultUsersPatch.contactNumber,
            //   password: resultUsersPatch.playerPassword,
            //   company: resultUsersPatch.company._id
            // }, null);

            //context.result = resultAuthentication;
            //smsResendLimit
            context.result.smsResendLimit = 0;
          }
        }

        return context;
      }
    ],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};
