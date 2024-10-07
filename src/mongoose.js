const mongoose = require('mongoose');
const logger = require('./logger');

module.exports = function (app) {
  mongoose.set('strictPopulate', false);
  mongoose.connect(
    app.get('mongodb'),{ 
      family: 4
    }
  ).catch(err => {
    logger.custom.error(`[mongoose.js] ${err}`);
    process.exit(1);
  });

  app.set('mongooseClient', mongoose);
};
