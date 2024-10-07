// Initializes the `messages` service on path `/messages`
const { Messages } = require('./messages.class');
const createModel = require('../../models/messages.model');
const hooks = require('./messages.hooks');
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
  app.use('/messages', new Messages(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('messages');

  service.hooks(hooks);
};
