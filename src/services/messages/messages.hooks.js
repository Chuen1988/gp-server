const { softDelete } = require('feathers-hooks-common');
const constant = require('../../constant');
const search = require('feathers-mongodb-fuzzy-search');
const utils = require('../../utils');

module.exports = {
  before: {
    all: [
      //Soft Delete
      softDelete({
        // context is the normal hook context
        deletedQuery: async context => {
          return { deleted: { $ne: true }, deletedAt: null };
        },
        removeData: async context => {
          return { deleted: true, deletedAt: new Date() };
        }
      }),
      search({
        // make all fields but constant.fuzzySearchExcludedFields are searchable
        excludedFields: constant.fuzzySearchExcludedFields,
      }),

      //For front end to support $ne
      function (hook) {
        if (hook?.params?.query?.$ne) {

          if (hook.params.query.$ne === 'null') {
            hook.params.query.$ne = null;
          }

        }
      },

      //For front end to support $paginate
      function (hook) {
        if (hook?.params?.query?.$paginate) {

          if (hook.params.query.$paginate === 'true' || hook.params.query.$paginate === true) {
            //Do not set paginate to true due to model service.js already declared there
            //hook.params.paginate = true;
          }
          else {
            hook.params.paginate = false;
          }

          delete hook.params.query.$paginate;
        }
      }

    ],
    find: [],
    get: [],
    create: [
      //Soft Delete
      async context => {
        context.data.deletedAt = null;

        return context;
      },
    ],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [
      //Save lastMessage in room
      async context => {
        const rooms = context.app.service('rooms');

        const roomId = utils.getObjectId(context.result.room);

        //Update lastMessage
        await rooms.patch(roomId, {
          lastMessage: context.result._id,
          lastMessageAt: new Date()
        }, {
          query: {
            $populate: constant.roomsPopulateQuery
          }
        });

        return context;
      }
    ],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};
