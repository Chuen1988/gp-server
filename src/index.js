/* eslint-disable no-console */
const https = require('https');
const fs = require('fs');
const app = require('./app');
const httpsPort = app.get('httpsPort');
const cluster = require('cluster');
const os = require('os');
const logger = require('./logger');

if (cluster.isMaster) {
  // If the current process is the master process
  logger.custom.info(`Master ${process.pid} is running`);

  // Fork workers equal to the number of CPU cores
  const numCPUs = os.cpus().length;
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Handle the event when a worker dies
  cluster.on('exit', (worker, code, signal) => {
    logger.custom.info(`Worker ${worker.process.pid} died`);
  });
}
else {

  //https port
  let serverHttps;

  if (process.env.NODE_ENV === 'production') {
    //TODO dummy SSL Cert
    //port 2007
    serverHttps = https.createServer({
      key: fs.readFileSync('./cert/gcsys.link/gcsys.link.key', 'utf8'),
      cert: fs.readFileSync('./cert/gcsys.link/fullchain.cer', 'utf8')
      //ca: fs.readFileSync('./cert/gcsys.link/ca.cer', 'utf8')
    }, app).listen(httpsPort);
  }
  else if (process.env.NODE_ENV === 'staging') {
    //TODO dummy SSL Cert
    //port 2007
    serverHttps = https.createServer({
      key: fs.readFileSync('./cert/gcsys.link/gcsys.link.key', 'utf8'),
      cert: fs.readFileSync('./cert/gcsys.link/fullchain.cer', 'utf8')
      //ca: fs.readFileSync('./cert/gcsys.link/ca.cer', 'utf8')
    }, app).listen(httpsPort);
  }
  else {
    //TODO dummy SSL Cert
    //port 2007
    serverHttps = https.createServer({
      key: fs.readFileSync('./cert/gcsys.link/gcsys.link.key', 'utf8'),
      cert: fs.readFileSync('./cert/gcsys.link/fullchain.cer', 'utf8')
      //ca: fs.readFileSync('./cert/gcsys.link/ca.cer', 'utf8')
    }, app).listen(httpsPort);
  }

  // Call app.setup to initialize all services and SocketIO
  app.setup(serverHttps);

  process.on('unhandledRejection', (reason, p) =>
    logger.custom.error(`[index.js] Unhandled Rejection at: Promise reason: ${reason}, p: ${p}`)
  );

  //https port
  serverHttps.on('listening', () =>
    logger.custom.info(`[index.js] GP application started on https port: ${httpsPort}`)
  );
}