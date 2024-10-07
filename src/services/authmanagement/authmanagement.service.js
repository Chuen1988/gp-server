// Initializes the `authmanagement` service on path `/authmanagement`
//const authManagement = require('feathers-authentication-management');
const { AuthenticationManagementService } = require('feathers-authentication-management');
const hooks = require('./authmanagement.hooks');
const makeNotifier = require('./notifier');
const constant = require('../../constant');

module.exports = function (app) {

  //Customize auth management
  //15 mins expiration token
  //2 = 3 attempt only count including 0
  //app.configure(authManagement({ identifyUserProps:['contactNumber', 'company'], delay: 15*60*1000, resetDelay: 15*60*1000, resetAttempts: constant.resetAttempts, reuseResetToken:true, shortTokenLen:6, shortTokenDigits:true }, notifier(app)));

  const notifier = makeNotifier(app).notifier;

  const options = {
    notifier,
    identifyUserProps: ['contactNumber', 'company'],
    delay: 15 * 60 * 1000,
    resetDelay: 15 * 60 * 1000,
    resetAttempts: constant.resetAttempts,
    reuseResetToken: true,
    shortTokenLen: 6,
    shortTokenDigits: true
  };

  // Initialize our service with any options it requires
  app.use('/authManagement', new AuthenticationManagementService(app, options));

  // Get our initialized service so that we can register hooks
  const service = app.service('authManagement');

  service.hooks(hooks);
};
