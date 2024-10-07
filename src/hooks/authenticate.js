const { authenticate } = require('@feathersjs/authentication').hooks;
const { NotAuthenticated } = require('@feathersjs/errors');
const verifyIdentity = authenticate('jwt');
const constant = require('../constant');

function hasToken(hook) {

  //Check if it is from REST
  //REST
  if (hook?.params?.provider == constant.providerRest) {
    return hook.params.headers.authorization;
  }
  //Check if it is from SocketIO
  //SocketIO
  else if (hook?.params?.provider == constant.providerSocketIO) {
    return hook.params.authentication;
  }
  else {
    return null;
  }
}

module.exports = async function authenticate(hook) {
  try {
    return await verifyIdentity(hook);
  } catch (error) {
    if (error instanceof NotAuthenticated && !hasToken(hook)) {
      return hook;
    }

    throw error;
  }
};
