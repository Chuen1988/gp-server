// Initializes the `users` service on path `/users`
const { Users } = require('./users.class');
const createModel = require('../../models/users.model');
const hooks = require('./users.hooks');
const constant = require('../../constant');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    //lean to false, force to run mongoose with query filter (setters & getters)
    lean: false,
    paginate: app.get('paginate'),
    whitelist: constant.whiteListMongoose,
    //Allow multiple entries
    multi: true
  };

  // Initialize our service with any options it requires
  app.use('/users', new Users(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('users');

  service.hooks(hooks);
};
