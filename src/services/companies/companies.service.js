// Initializes the `companies` service on path `/companies`
const { Companies } = require('./companies.class');
const createModel = require('../../models/companies.model');
const hooks = require('./companies.hooks');
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
  app.use('/companies', new Companies(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('companies');

  service.hooks(hooks);
};
