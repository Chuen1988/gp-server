const Redis = require('ioredis');
const logger = require('./logger');

// Function to create an ioredis client with parameters
function createIORedisClient(app) {
  const client = new Redis(`redis://${app.get('redisHost')}:${app.get('redisPort')}`);

  // You can add more custom configurations as needed
  client.on('connect', () => {
    logger.custom.info('[redis-client.js] ###Connected to Redis###');
  });

  //Handle errors
  client.on('error', (err) => {
    logger.custom.error(`[redis-client.js] ###Redis Error: ${err}###`);
  });

  return client;
}

module.exports = createIORedisClient;