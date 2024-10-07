const users = require('./users/users.service.js');
const companies = require('./companies/companies.service.js');
const rooms = require('./rooms/rooms.service.js');
const authManagement = require('./authmanagement/authmanagement.service.js');
const messages = require('./messages/messages.service.js');

// eslint-disable-next-line no-unused-vars
module.exports = function (app) {
  app.configure(users);
  app.configure(companies);
  app.configure(rooms);
  app.configure(authManagement);
  app.configure(messages);
};
