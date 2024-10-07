const verifyHooks = require('feathers-authentication-management').hooks;
const commonHooks = require('feathers-hooks-common');
const { iff } = require('feathers-hooks-common');
const { authenticate } = require('@feathersjs/authentication').hooks;
const { softDelete } = require('feathers-hooks-common');
const { BadRequest } = require('@feathersjs/errors');
const logger = require('../../logger');
const { hashPassword, protect } = require('@feathersjs/authentication-local').hooks;
const constant = require('../../constant');
const search = require('feathers-mongodb-fuzzy-search');
const utils = require('../../utils');

module.exports = {
  before: {
    all: [
      //Soft Delete
      softDelete({
        // context is the normal hook context
        deletedQuery: async context => {
          return { deleted: { $ne: true }, deletedAt: null };
        },
        removeData: async context => {
          return { deleted: true, deletedAt: new Date() };
        }
      }),
      search({
        // make all fields but constant.fuzzySearchExcludedFields are searchable
        excludedFields: constant.fuzzySearchExcludedFields,
      }),

      //For front end to support $ne
      function (hook) {
        if (hook?.params?.query?.$ne) {

          if (hook.params.query.$ne === 'null') {
            hook.params.query.$ne = null;
          }

        }
      },

      //For front end to support $paginate
      function (hook) {
        if (hook?.params?.query?.$paginate) {

          if (hook.params.query.$paginate === 'true' || hook.params.query.$paginate === true) {
            //Do not set paginate to true due to model service.js already declared there
            //hook.params.paginate = true;
          }
          else {
            hook.params.paginate = false;
          }

          delete hook.params.query.$paginate;
        }
      }

    ],
    find: [
      authenticate('jwt'),

      //populate users details (For FE due to not able to support inner)
      async context => {

        //External server calling
        if (context.params.provider) {
          let populateData = constant.usersPopulateQuery;

          //Client query
          // if(context?.params?.query?.$populate){
          //   context.params.query.$populate = populateData.push(context.params.query.$populate)
          // }

          //Override rooms query for populate
          context.params.query.$populate = populateData;
        }
        else {
          //Internal server calling (undefined according to feathersjs document)
        }

        return context;
      }
    ],
    get: [
      authenticate('jwt'),

      //populate user details for external and internal
      async context => {
        //Must populate role for ability define CASL (update in authentication.js getEntityQuery as well)
        let populateData = constant.usersPopulateQuery;

        //Client query
        // if(context?.params?.query?.$populate){
        //   context.params.query.$populate = populateData.push(context.params.query.$populate)
        // }

        //Override users query for populate (users GET)
        context.params.query.$populate = populateData;

        return context;
      }
    ],
    create: [
      //Soft Delete
      async context => {
        context.data.deletedAt = null;

        return context;
      },

      //Added createdBy who
      function (hook) {
        if (hook?.params?.user) {
          hook.data.createdBy = hook.params.user._id;
        }
      },

      //populate user details for external and internal
      async context => {
        let populateData = constant.usersPopulateQuery;

        //Client query
        // if(context?.params?.query?.$populate){
        //   context.params.query.$populate = populateData.push(context.params.query.$populate)
        // }

        //Override users query for populate (users CREATE)
        context.params.query.$populate = populateData;

        return context;
      },

      //Check contactNumber
      function (hook) {
        if (hook.data.contactNumber) {

          //trim for space and zero-width space Unicode
          hook.data.contactNumber = utils.zeroWidthTrim(hook.data.contactNumber);

          if (utils.isValidDigit(hook.data.contactNumber)) {
            //Do nothing
          }
          else {
            throw new BadRequest('Invalid contactNumber.');
          }
        }
      },

      //Check userName, userNameBO, contactNumber to ensure it is not duplicate
      async context => {
        const users = context.app.service('users');
        const companies = context.app.service('companies');

        //Check role type to differentiate Main control, BO, Member

        //MC
        if (context.data.role === constant.roleMCAdmin ||
          context.data.role === constant.roleMCManager ||
          context.data.role === constant.roleMCCS) {

          //Block FE from adding userNameBO, contactNumber & company
          if (context.data.userNameBO || context.data.contactNumber || context.data.company) {
            throw new BadRequest('Unable to add userNameBO or contactNumber or company in Main Control.');
          }

          //Check userName
          if (context.data.userName) {
            const resultUsersFind = await users.find({
              paginate: false,
              query: {
                $limit: 1,
                //For optimization
                $select: ['_id'],
                company: null,
                userName: context.data.userName,
                userNameBO: null,
                contactNumber: null,
                //For optimization
                //$populate: constant.usersPopulateQuery
              }
            });

            //duplicate userName found
            if (resultUsersFind.length > 0) {
              throw new BadRequest('Duplicate userName found in Main Control.');
            }

            //Temp variable in this hook  
            //For verifyHooks checking
            context.data.isMember = false;

          }
          else {
            throw new BadRequest('userName required in Main Control.');
          }
        }
        //BO
        else if (context.data.role === constant.roleBOAdmin ||
          context.data.role === constant.roleBOStaff ||
          context.data.role === constant.roleBOAgent ||
          context.data.role === constant.roleBOCS ||
          context.data.role === constant.roleBOKounter ||
          context.data.role === constant.roleBOHelper) {

          //Block FE from adding userName or contactNumber
          if (context.data.userName || context.data.contactNumber) {
            throw new BadRequest('Unable to add userName or contactNumber in Back Office.');
          }

          //Check Company
          if (context.data.company) {

            //Check userNameBO
            if (context.data.userNameBO) {
              const resultUsersFind = await users.find({
                paginate: false,
                query: {
                  $limit: 1,
                  //For optimization
                  $select: ['_id'],
                  //company not required for query due to sharing 1 BO system, could be causing duplicate userNameBO on different company
                  userName: null,
                  userNameBO: context.data.userNameBO,
                  contactNumber: null,
                  //For optimization
                  //$populate: constant.usersPopulateQuery
                }
              });

              //duplicate userNameBO found
              if (resultUsersFind.length > 0) {
                throw new BadRequest('Duplicate userNameBO found in Back Office.');
              }

              //Temp variable in this hook
              //For verifyHooks checking
              context.data.isMember = false;
            }
            else {
              throw new BadRequest('userNameBO required in Back Office.');
            }
          }
          else {
            throw new BadRequest('company required in Back Office.');
          }
        }
        //Member
        else if (context.data.role === constant.roleMember) {

          //Block FE from adding userName or userNameBO
          if (context.data.userName || context.data.userNameBO) {
            throw new BadRequest('Unable to add userName or userNameBO in Member.');
          }

          //Check Company
          if (context.data.company) {

            const resultCompaniesGet = await companies.get(context.data.company, null);//For optimization

            //Check contactNumber 
            if (context.data.contactNumber) {

              //If is from MC BO
              if (context.data.isFromMCBO) {
                //Do nothing
              }
              else {
                //If found 0 on 3rd digit, remove it
                if (context.data.contactNumber.substring(2, 3) === '0') {

                  //Phone code + removed 0 phone code
                  let finalContactNumber = context.data.contactNumber.substring(0, 2) + context.data.contactNumber.substring(3);

                  context.data.contactNumber = finalContactNumber;
                }
              }

              const resultUsersFind = await users.find({
                paginate: false,
                query: {
                  $limit: 1,
                  //For optimization
                  $select: ['_id'],
                  company: context.data.company,
                  userName: null,
                  userNameBO: null,
                  contactNumber: context.data.contactNumber
                  //For optimization
                  //$populate: constant.usersPopulateQuery
                }
              });

              //duplicate contactNumber found
              if (resultUsersFind.length > 0) {
                throw new BadRequest('Duplicate contactNumber found in Member in the same company.');
              }

              //Check company phone code
              if (utils.isValidPhoneCodeInCompany(context.data.contactNumber, resultCompaniesGet.phoneCodes)) {

                //Temp variable in this hook
                //For verifyHooks checking
                context.data.isMember = true;
              }
              else {
                throw new BadRequest('Invalid phone code.');
              }
            }
            else {
              throw new BadRequest('contactNumber required in Member.');
            }
          }
          else {
            throw new BadRequest('company required in Member.');
          }
        }
        else {
          throw new BadRequest('role not found.');
        }


        return context;
      },

      //block google MFA when create user
      async context => {

        //google MFA is enable
        if (context.data.googleMFA === true) {
          throw new BadRequest('Unable to enable Google MultiFactor Authenticator when registration.');
        }

        return context;
      },

      //Hash password at the end due to store password in plain text for member password
      hashPassword('password'),

      //Verification OTP (For Member handling in resendVerifySignup)
      iff((hook) => {
        //Temp variable in this hook
        //Check if it is Member
        if (hook.data.isMember === true) {
          return true;
        }
        else
          return false;
      },
      verifyHooks.addVerification()
      ),


      //Check status and isVerified
      function (hook) {
        //(Ignore comparing with type from front end comparing with integer)
        if (hook.data.status == constant.userStatusActive) {
          hook.data.isVerified = true;
        }
        //(Ignore comparing with type from front end comparing with integer)
        else if (hook.data.status == constant.userStatusInactive) {
          hook.data.isVerified = false;
        }
      },
    ],
    update: [
      //Verification OTP
      //Would not change below params 
      commonHooks.iff(
        commonHooks.isProvider('external'),
        commonHooks.preventChanges(true,
          [
            'userName',
            'userNameBO',
            'contactNumber',
            'isVerified',
            'verifyToken',
            'verifyShortToken',
            'verifyExpires',
            'verifyAttempts',
            'verifyChanges',
            'verifyResend',
            'resetToken',
            'resetShortToken',
            'resetExpires',
            'resetAttempts',
            'resetResend'
          ]
        ),
      ),
      hashPassword('password'),
      authenticate('jwt')
    ],
    patch: [
      //Verification OTP
      //Would not change below params 
      commonHooks.iff(
        commonHooks.isProvider('external'),
        commonHooks.preventChanges(true,
          [
            'userName',
            'userNameBO',
            'contactNumber',
            'isVerified',
            'verifyToken',
            'verifyShortToken',
            'verifyExpires',
            'verifyAttempts',
            'verifyChanges',
            'verifyResend',
            'resetToken',
            'resetShortToken',
            'resetExpires',
            'resetAttempts',
            'resetResend'
          ]
        ),
      ),

      authenticate('jwt'),

      //populate user details for external and internal
      async context => {
        let populateData = constant.usersPopulateQuery;

        //Client query
        // if(context?.params?.query?.$populate){
        //   context.params.query.$populate = populateData.push(context.params.query.$populate)
        // }

        //Override users query for populate (users PATCH)
        context.params.query.$populate = populateData;

        return context;
      },

      //Check contactNumber
      function (hook) {
        if (hook.data.contactNumber) {

          //trim for space and zero-width space Unicode
          hook.data.contactNumber = utils.zeroWidthTrim(hook.data.contactNumber);

          if (utils.isValidDigit(hook.data.contactNumber)) {
            //Do nothing
          } else {
            throw new BadRequest('Invalid contactNumber.');
          }
        }
      },

      //Check userName, userNameBO, contactNumber to ensure it is not duplicate
      async context => {
        const users = context.app.service('users');
        const companies = context.app.service('companies');

        const resultUsersGet = await users.get(context.id, {
          query: {
            //Populate usersPopulateQuery (will be handle in users.hook GET as well due to FE required)
            $populate: constant.usersPopulateQuery
          }
        });

        //Assume role is not passing
        //Check role type to differentiate Main control, BO, Member
        //MC
        if (resultUsersGet.role === constant.roleMCAdmin ||
          resultUsersGet.role === constant.roleMCManager ||
          resultUsersGet.role === constant.roleMCCS) {

          //Block FE from adding userNameBO, contactNumber & company
          if (context.data.userNameBO || context.data.contactNumber || context.data.company) {
            throw new BadRequest('Unable to add userNameBO or contactNumber or company in Main Control.');
          }

          //Check userName
          if (context.data.userName) {
            const resultUsersFind = await users.find({
              paginate: false,
              query: {
                $limit: 1,
                //For optimization
                $select: ['_id'],
                company: null,
                userName: context.data.userName,
                userNameBO: null,
                contactNumber: null,
                //For optimization
                //$populate: constant.usersPopulateQuery
              }
            });

            //duplicate userName found
            if (resultUsersFind.length > 0) {
              //If users id found is not the current users id patched
              if (JSON.stringify(resultUsersFind[0]._id) !== JSON.stringify(context.id))
                throw new BadRequest('Duplicate userName found in Main Control.');
            }
          }
        }
        //BO
        else if (resultUsersGet.role === constant.roleBOAdmin ||
          resultUsersGet.role === constant.roleBOStaff ||
          resultUsersGet.role === constant.roleBOAgent ||
          resultUsersGet.role === constant.roleBOCS ||
          resultUsersGet.role === constant.roleBOKounter ||
          resultUsersGet.role === constant.roleBOHelper) {

          //Block FE from adding userName or contactNumber
          if (context.data.userName || context.data.contactNumber) {
            throw new BadRequest('Unable to add userName or contactNumber in Back Office.');
          }

          //Check userNameBO
          if (context.data.userNameBO) {
            const resultUsersFind = await users.find({
              paginate: false,
              query: {
                $limit: 1,
                //For optimization
                $select: ['_id'],
                //company not required for query due to sharing 1 BO system, could be causing duplicate userNameBO on different company
                userName: null,
                userNameBO: context.data.userNameBO,
                contactNumber: null
                //For optimization
                //$populate: constant.usersPopulateQuery
              }
            });

            //duplicate userNameBO found
            if (resultUsersFind.length > 0) {
              //If users id found is not the current users id patched
              if (JSON.stringify(resultUsersFind[0]._id) !== JSON.stringify(context.id))
                throw new BadRequest('Duplicate userNameBO found in Back Office.');
            }
          }
        }
        //Member
        else if (resultUsersGet.role === constant.roleMember) {

          //Block FE from adding userName or userNameBO
          if (context.data.userName || context.data.userNameBO) {
            throw new BadRequest('Unable to add userName or userNameBO in Member.');
          }

          //Check contactNumber 
          if (context.data.contactNumber) {

            //If is from MC BO
            if (context.data.isFromMCBO) {
              //Do nothing
            }
            else {
              //If found 0 on 3rd digit, remove it
              if (context.data.contactNumber.substring(2, 3) === '0') {

                //Phone code + removed 0 phone code
                let finalContactNumber = context.data.contactNumber.substring(0, 2) + context.data.contactNumber.substring(3);

                context.data.contactNumber = finalContactNumber;
              }
            }

            const resultUsersFind = await users.find({
              paginate: false,
              query: {
                $limit: 1,
                //For optimization
                $select: ['_id'],
                company: resultUsersGet.company._id,
                userName: null,
                userNameBO: null,
                contactNumber: context.data.contactNumber
                //For optimization
                //$populate: constant.usersPopulateQuery
              }
            });

            //duplicate contactNumber found
            if (resultUsersFind.length > 0) {
              //If users id found is not the current users id patched
              if (JSON.stringify(resultUsersFind[0]._id) !== JSON.stringify(context.id))
                throw new BadRequest('Duplicate contactNumber found in Member in the same company.');
            }

            const resultCompaniesGet = await companies.get(context.data.company, null); //For optimization

            //Check company phone code
            if (utils.isValidPhoneCodeInCompany(context.data.contactNumber, resultCompaniesGet.phoneCodes)) {
              //Contact Number is valid
            }
            else {
              throw new BadRequest('Invalid phone code.');
            }
          }
        }
        else {
          throw new BadRequest('role not found.');
        }
        return context;
      },

      //check google MFA
      // async context => {
      //   const users = context.app.service('users');
      //   const uploadGoogleMFAQRImage = context.app.service('upload-google-mfa-qr-image');

      //   //google MFA is enable
      //   if (context.data.googleMFA === true) {
      //     const resultUsersGet = await users.get(context.id, {
      //       query: {
      //         //Populate usersPopulateQuery (will be handle in users.hook GET as well due to FE required)
      //         $populate: constant.usersPopulateQuery
      //       }
      //     });

      //     //Main Control
      //     //BO
      //     if (resultUsersGet.role === constant.roleMCAdmin ||
      //       resultUsersGet.role === constant.roleMCManager ||
      //       resultUsersGet.role === constant.roleMCCS ||
      //       resultUsersGet.role === constant.roleBOAdmin ||
      //       resultUsersGet.role === constant.roleBOStaff ||
      //       resultUsersGet.role === constant.roleBOAgent ||
      //       resultUsersGet.role === constant.roleBOCS ||
      //       resultUsersGet.role === constant.roleBOKounter ||
      //       resultUsersGet.role === constant.roleBOHelper) {
      //       let secret = speakeasy.generateSecret();
      //       let QRCode = require('qrcode');

      //       let googleAuthenticatorLabel = '';

      //       if (resultUsersGet.role === constant.roleMCAdmin ||
      //         resultUsersGet.role === constant.roleMCManager ||
      //         resultUsersGet.role === constant.roleMCCS) {

      //         googleAuthenticatorLabel = `GCS Main Control (${resultUsersGet.userName})`;
      //       }
      //       else if (resultUsersGet.role === constant.roleBOAdmin ||
      //         resultUsersGet.role === constant.roleBOStaff ||
      //         resultUsersGet.role === constant.roleBOAgent ||
      //         resultUsersGet.role === constant.roleBOCS ||
      //         resultUsersGet.role === constant.roleBOKounter ||
      //         resultUsersGet.role === constant.roleBOHelper) {

      //         googleAuthenticatorLabel = `GCS Back Office (${resultUsersGet.userName})`;
      //       }

      //       // Get the data URL of the authenticator URL
      //       let googleMFAURL = speakeasy.otpauthURL({ secret: secret.base32, label: googleAuthenticatorLabel });
      //       const base64Image = await QRCode.toDataURL(googleMFAURL);

      //       const resultUploadGoogleMFAQRImage = await uploadGoogleMFAQRImage.create({
      //         uri: base64Image
      //       }, null);

      //       //Check if existing googleMFAQRImage
      //       if (resultUsersGet.googleMFAQRImage) {
      //         //Remove previous image in folder
      //         //Production & Staging (AWS S3)
      //         if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
      //           await uploadGoogleMFAQRImage.remove(constant.googleMFAQRImagePath + resultUsersGet.googleMFAQRImage, null);
      //         }
      //         //Local(Public folder)
      //         else {
      //           try {
      //             fs.unlinkSync(constant.googleMFAQRImagePath + resultUsersGet.googleMFAQRImage);
      //             //file removed
      //           } catch (err) {
      //             logger.custom.error(`[users.hooks.js] ${err}`);
      //           }
      //         }
      //       }

      //       //Store MFAQRImage & MFASecretKey
      //       context.data.googleMFAQRImage = resultUploadGoogleMFAQRImage.id;
      //       context.data.googleMFASecretKey = secret.base32;
      //     }
      //     //Member
      //     else {
      //       throw new BadRequest('Role not supported for Google MultiFactor Authenticator.');
      //     }
      //   }
      //   else if (context.data.googleMFA === false) {
      //     const resultUsersGet = await users.get(context.id, {
      //       query: {
      //         //Populate usersPopulateQuery (will be handle in users.hook GET as well due to FE required)
      //         $populate: constant.usersPopulateQuery
      //       }
      //     });

      //     //Check if existing googleMFAQRImage
      //     if (resultUsersGet.googleMFAQRImage) {
      //       //Remove previous image in folder
      //       //Production & Staging (AWS S3)
      //       if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
      //         await uploadGoogleMFAQRImage.remove(constant.googleMFAQRImagePath + resultUsersGet.googleMFAQRImage, null);
      //       }
      //       //Local(Public folder)
      //       else {
      //         try {
      //           fs.unlinkSync(constant.googleMFAQRImagePath + resultUsersGet.googleMFAQRImage);
      //           //file removed
      //         } catch (err) {
      //           logger.custom.error(`[users.hooks.js] ${err}`);
      //         }
      //       }
      //     }

      //     //Store MFAQRImage & MFASecretKey
      //     context.data.googleMFAQRImage = '';
      //     context.data.googleMFASecretKey = '';
      //   }

      //   return context;
      // },

      //Hash password at the end due to store password in plain text for member password
      hashPassword('password'),

      //Check status and isVerified
      function (hook) {
        //(Ignore comparing with type from front end comparing with integer)
        if (hook.data.status == constant.userStatusActive) {
          hook.data.isVerified = true;
        }
        //(Ignore comparing with type from front end comparing with integer)
        else if (hook.data.status == constant.userStatusInactive) {
          hook.data.isVerified = false;
        }
      },
    ],
    remove: [
      authenticate('jwt'),

      //populate user details for external and internal
      async context => {
        let populateData = constant.usersPopulateQuery;

        //Client query
        // if(context?.params?.query?.$populate){
        //   context.params.query.$populate = populateData.push(context.params.query.$populate)
        // }

        //Override users query for populate (users REMOVE)
        context.params.query.$populate = populateData;

        return context;
      }
    ]
  },

  after: {
    all: [
      // Make sure the password, googleMFASecretKey field is never sent to the client
      protect('password'),
      protect('googleMFASecretKey'),
      protect('isVerified'),
      protect('verifyToken'),
      protect('verifyShortToken'),
      protect('verifyExpires'),
      protect('verifyAttempts'),
      protect('verifyChanges'),
      protect('verifyResend'),
      protect('resetToken'),
      protect('resetShortToken'),
      protect('resetExpires'),
      protect('resetAttempts'),
      protect('resetResend'),
    ],
    find: [],
    get: [],
    create: [
      //Verification OTP (For Member handling in resendVerifySignup)
      iff((hook) => {
        //Temp variable in this hook
        //Check if it is member
        if (hook.data.isMember === true) {
          return true;
        }
        else
          return false;
      },
      verifyHooks.removeVerification()
      ),

      //Assign userId to BO & Member
      //Assign the room to the Member (check if it is member created)
      async context => {
        const rooms = context.app.service('rooms');
        const users = context.app.service('users');
        const companies = context.app.service('companies');

        //check role
        if (context.result.role) {

          //BO
          if (context.result.role === constant.roleBOAdmin ||
            context.result.role === constant.roleBOStaff ||
            context.result.role === constant.roleBOAgent ||
            context.result.role === constant.roleBOCS ||
            context.result.role === constant.roleBOKounter ||
            context.result.role === constant.roleBOHelper) {

            const companyId = utils.getObjectId(context.result.company);

            //Create userId
            //To avoid Id conflict and error
            let resultUsersPatch;
            let counter = 0;
            for (; ;) {
              try {
                const resultCompaniesPatch = await companies.patch(companyId, {
                  $inc: {
                    //Increase
                    incrementUserId: 1
                  }
                }, {
                  //For optimization
                  // query: {
                  //   $populate: constant.companiesPopulateQuery
                  // },
                  connection: {
                    provider: constant.connectionProviderServer
                  }
                });

                //userId = GCS + incrementCompanyId + company incrementUserId
                const userId = `${constant.companyIDFormat}${resultCompaniesPatch.incrementCompanyId}${resultCompaniesPatch.incrementUserId}`;

                //Assign the userId to that Member
                //Not passing to socket
                resultUsersPatch = await users.patch(context.result._id, {
                  userId: userId
                }, {
                  //For optimization
                  // query: {
                  //   $populate: constant.usersPopulateQuery
                  // },
                  connection: {
                    provider: constant.connectionProviderServer
                  }
                });

                break;
              } catch (e) {
                if (counter++ < constant.crudApiMaxRetry) {
                  //delay random
                  let delayRandomMS = utils.getRandomInt(1, 6) * 100;
                  await utils.sleep(delayRandomMS);
                  continue;
                }

                throw e;
              }
            }

            //replace the result userId
            context.result.userId = resultUsersPatch.userId;
          }
          //Member Only
          else if (context.result.role === constant.roleMember) {

            const companyId = utils.getObjectId(context.result.company);

            //Create userId
            //To avoid Id conflict and error
            let resultUsersPatch;
            let counter = 0;
            let resultRoomsCreate = null;
            for (; ;) {
              try {
                const resultCompaniesPatch = await companies.patch(companyId, {
                  $inc: {
                    //Increase
                    incrementUserId: 1
                  }
                }, {
                  //For optimization
                  // query: {
                  //   $populate: constant.companiesPopulateQuery
                  // },
                  connection: {
                    provider: constant.connectionProviderServer
                  }
                });

                //userId = GCS + incrementCompanyId + company incrementUserId
                const userId = `${constant.companyIDFormat}${resultCompaniesPatch.incrementCompanyId}${resultCompaniesPatch.incrementUserId}`;

                //For first time resultRoomsCreate === null
                if (resultRoomsCreate === null) {
                  //Create room for the Member
                  resultRoomsCreate = await rooms.create({
                    user: context.result._id,
                    company: companyId
                  }, {
                    query: {
                      $populate: constant.roomsPopulateQuery
                    }
                  });
                }

                //Assign the userId & room to that Member
                //Not passing to socket
                //First room always one to one member
                resultUsersPatch = await users.patch(context.result._id, {
                  userId: userId,
                  $push: {
                    rooms: resultRoomsCreate._id
                  }
                }, {
                  query: {
                    $populate: constant.usersPopulateQuery
                  },
                  connection: {
                    provider: constant.connectionProviderServer
                  }
                });

                break;
              } catch (e) {
                logger.custom.error(`[users.hooks.js] ###retry ${e}###`);
                if (counter++ < constant.crudApiMaxRetry) {
                  //delay random
                  let delayRandomMS = utils.getRandomInt(1, 6) * 100;
                  await utils.sleep(delayRandomMS);
                  continue;
                }

                throw e;
              }
            }

            //replace the result userId
            context.result.userId = resultUsersPatch.userId;
            //replace the result rooms
            context.result.rooms = resultUsersPatch.rooms;
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
