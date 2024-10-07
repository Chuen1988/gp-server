// Initializes the `rooms` service on path `/rooms`
const { Rooms } = require('./rooms.class');
const createModel = require('../../models/rooms.model');
const hooks = require('./rooms.hooks');
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
  app.use('/rooms', new Rooms(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('rooms');

  service.hooks(hooks);
};
