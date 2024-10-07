const path = require('path');
const favicon = require('serve-favicon');
const compress = require('compression');
const helmet = require('helmet');
const cors = require('cors');

const feathers = require('@feathersjs/feathers');
const configuration = require('@feathersjs/configuration');
const express = require('@feathersjs/express');
const socketio = require('@feathersjs/socketio');
const sync = require('feathers-sync');

const logger = require('./logger');
const middleware = require('./middleware');
const services = require('./services');
const appHooks = require('./app.hooks');
const channels = require('./channels');

const authentication = require('./authentication');
const mongoose = require('./mongoose');

const app = express(feathers());

// Load app configuration
app.configure(configuration());
// Enable security, CORS, compression, favicon and body parsing
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors());
app.use(compress());

//50MB
//For parsing application/json
//app.use(express.json({limit: '50mb'}));

//50MB
//For parsing application/x-www-form-urlencoded
app.use(express.urlencoded({
  limit: '50mb',
  extended: true,
  parameterLimit: 50000
}));

//50MB
//For parsing any content type
app.use(express.text({
  type: '*/*',
  limit: '50mb'
}));

app.use(favicon(path.join(app.get('public'), 'logo.png')));
// Host the public folder
app.use('/', express.static(app.get('public')));

// Configure other middleware (see `middleware/index.js`)
app.use(middleware);

// Set up Plugins and providers
app.configure(express.rest());

// app.configure(socketio({
//   pingInterval: 10000,
//   pingTimeout: 50000
// }));

//Set unlimited to prevent memory leak
app.configure(socketio({
  pingInterval: 20000,
  //Timeout sync with FE 120 seconds
  pingTimeout: 120000,
  //1e6 = 1MB, 1e7 = 10MB
  maxHttpBufferSize: 1e7
}, function (io) {

  //Get socket hand shake
  io.use((socket, next) => {
    socket.feathers.handshake = socket.handshake;
    next();
  });
  //Solved MaxListenersExceededWarning: Possible EventEmitter memory leak detected
  io.sockets.setMaxListeners(Infinity);
}));

//redis (Production & Staging only due to multiple instances for sync services)
if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
  app.configure(sync({
    uri: `redis://${app.get('redisHost')}:${app.get('redisPort')}`
  }));

  app.sync.ready.then(() => {
    logger.custom.info('[app.js] ***REDIS SYNC is READY!!!***');
  });
}

//mongoose
app.configure(mongoose);

app.configure(authentication);
// Set up our services (see `services/index.js`)
app.configure(services);
// Set up event channels (see channels.js)
app.configure(channels);

/**Feathers errors **/
/*
400: BadRequest
401: NotAuthenticated
402: PaymentError
403: Forbidden
404: NotFound
405: MethodNotAllowed
406: NotAcceptable
408: Timeout
409: Conflict
411: LengthRequired
422: Unprocessable
429: TooManyRequests
500: GeneralError
501: NotImplemented
502: BadGateway
503: Unavailable
*/
// Configure a middleware for error and the error handler
app.use(express.notFound());
app.use(express.errorHandler({
  logger,
  html: {
    400: app.get('public') + '/error.html',
    401: app.get('public') + '/error.html',
    402: app.get('public') + '/error.html',
    403: app.get('public') + '/error.html',
    404: app.get('public') + '/error.html',
    405: app.get('public') + '/error.html',
    406: app.get('public') + '/error.html',
    408: app.get('public') + '/error.html',
    409: app.get('public') + '/error.html',
    411: app.get('public') + '/error.html',
    422: app.get('public') + '/error.html',
    429: app.get('public') + '/error.html',
    500: app.get('public') + '/error.html',
    501: app.get('public') + '/error.html',
    502: app.get('public') + '/error.html',
    503: app.get('public') + '/error.html',
  }
}));

app.hooks(appHooks);

module.exports = app;