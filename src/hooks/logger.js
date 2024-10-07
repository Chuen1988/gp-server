// A hook that logs service method before, after and error
const logger = require('../logger');

module.exports = function () {
  return function (hook) {
    let message = `${hook.type}: ${hook.path} - Method: ${hook.method}`;

    if (hook.type === 'error') {
      message += `: ${hook?.error?.message}`;
    }

    logger.custom.info(message);
    logger.custom.debug('hook.data', hook.data);
    logger.custom.debug('hook.params', hook.params);

    if (hook.result) {
      logger.custom.debug('hook.result', hook.result);
    }

    if (hook.error) {
      logger.custom.error(hook.error);
    }
  };
};
