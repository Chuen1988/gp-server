const defineAbilityFor = require('./defineAbility');
const { rulesToQuery } = require('@casl/ability/extra');
const { Forbidden } = require('@feathersjs/errors');
const TYPE_KEY = Symbol.for('type');
const customError = require('../custom-error');
const constant = require('../constant');


function canReadQuery(query) {
  return query != null;
}

function convertToMongoQuery(rule) {
  const conditions = rule.conditions;
  return rule.inverted ? { $nor: [conditions] } : conditions;
}

function toMongoQuery(ability, subjectType, action = 'read') {
  return rulesToQuery(ability, action, subjectType, convertToMongoQuery);
}

module.exports = function
authorize(name = null) {
  return async function (hook) {
    const action = hook.method;
    const service = name ? hook.app.service(name) : hook.service;
    const serviceName = name || hook.path;

    //Check if it is from REST
    //REST
    if (hook?.params?.provider == constant.providerRest) {
      //To ensure only latest accessToken is valid for any API
      //If authorization (access token) passed by FE
      if (hook?.params?.headers?.authorization) {
        //If authorization (access token) from FE is not same with latest accessToken in the User 
        if (hook.params.headers.authorization !== hook.params.user.accessToken) {
          //Revoke authorization token
          const authentication = hook.app.service('authentication');
          const revokeAccessToken = await authentication.revokeAccessToken(hook.params.headers.authorization);
          //If able to proceed to this step, means the accessToken is revoked. but not showing token revoked. Hence show error
          if (revokeAccessToken) {
            customError.show(customError.customErrorHeader, 'Token revoked.', customError.customErrorCode445, 'Token revoked.', {});
          }
        }
      }
    }
    //Check if it is from SocketIO
    //SocketIO
    else if (hook?.params?.provider == constant.providerSocketIO) {
      //To ensure only latest accessToken is valid for any API
      //If authorization (access token) passed by FE
      if (hook?.params?.authentication?.accessToken) {
        //If authorization (access token) from FE is not same with latest accessToken in the User 
        if (hook.params.authentication.accessToken !== hook.params.user.accessToken) {
          //Revoke authorization token
          const authentication = hook.app.service('authentication');
          const revokeAccessToken = await authentication.revokeAccessToken(hook.params.authentication.accessToken);
          //If able to proceed to this step, means the accessToken is revoked. but not showing token revoked. Hence show error
          if (revokeAccessToken) {
            customError.show(customError.customErrorHeader, 'Token revoked.', customError.customErrorCode445, 'Token revoked.', {});
          }
        }
      }
    }

    const ability = defineAbilityFor(hook.params.user);

    const throwUnlessCan = (action, resource) => {
      if (ability.cannot(action, serviceName)) {
        throw new Forbidden(`You are not allowed to ${action} ${serviceName}`);
      }
    };

    hook.params.ability = ability;

    //For Create need Authentication
    if (hook.method === 'create') {
      hook.data[TYPE_KEY] = serviceName;
      throwUnlessCan('create', hook.data);
    }

    if (!hook.id) {
      const query = toMongoQuery(ability, serviceName, action);

      if (canReadQuery(query)) {
        Object.assign(hook.params.query, query);
      } else {
        //hook.params.query.$limit = 0
        throwUnlessCan(hook.method, hook.data);
      }

      return hook;
    }

    const params = Object.assign({}, hook.params, { provider: null });
    const result = await service.get(hook.id, params);

    result[TYPE_KEY] = serviceName;
    throwUnlessCan(action, result);

    if (action === 'get') {
      hook.result = result;
    }

    return hook;
  };
};
