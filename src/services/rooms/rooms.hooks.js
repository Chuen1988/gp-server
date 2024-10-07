const { softDelete } = require('feathers-hooks-common');
const constant = require('../../constant');
const search = require('feathers-mongodb-fuzzy-search');
const customError = require('../../custom-error');
const { FeathersError } = require('@feathersjs/errors');
const { BadRequest } = require('@feathersjs/errors');

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

      //Check user to ensure it is unique (currently support one to one)
      async context => {
        const rooms = context.app.service('rooms');

        if (context.data.user) {
          const resultRoomsFind = await rooms.find({
            paginate: false,
            query: {
              $limit: 1,
              //For optimization
              $select: ['_id'],
              user: context.data.user
              //For optimization
              //$populate: constant.roomsPopulateQuery
            }
          });

          //duplicate user found in existing rooms list
          if (resultRoomsFind.length > 0) {
            throw new BadRequest('Duplicate user found.');
          }
        }

        return context;
      },

      //Check deviceId to ensure it is unique (currently support one to one)
      async context => {
        const rooms = context.app.service('rooms');

        //new deviceId will generated when FE clear cache
        if (context.data.deviceId) {
          const resultRoomsFind = await rooms.find({
            paginate: false,
            query: {
              $limit: 1,
              //For optimization
              $select: ['_id'],
              deviceId: context.data.deviceId
              //For optimization
              //$populate: constant.roomsPopulateQuery
            }
          });

          //duplicate deviceId found in existing rooms list
          if (resultRoomsFind.length > 0) {
            throw new BadRequest('Duplicate deviceId found.');
          }
        }

        return context;
      },
    ],
    update: [],
    patch: [
      //Check user to ensure it is unique (currently support one to one)
      async context => {
        const rooms = context.app.service('rooms');

        if (context.data.user) {
          const resultRoomsFind = await rooms.find({
            paginate: false,
            query: {
              $limit: 1,
              //For optimization
              $select: ['_id'],
              user: context.data.user
              //For optimization
              //$populate: constant.roomsPopulateQuery
            }
          });

          //duplicate user found in existing rooms list
          if (resultRoomsFind.length > 0) {
            //If rooms id found is not the current rooms id patched
            if (JSON.stringify(resultRoomsFind[0]._id) !== JSON.stringify(context.id))
              throw new BadRequest('Duplicate user found.');
          }
        }

        return context;
      },

      //Check deviceId to ensure it is unique (currently support one to one)
      async context => {
        const rooms = context.app.service('rooms');

        if (context.data.deviceId) {
          const resultRoomsFind = await rooms.find({
            paginate: false,
            query: {
              $limit: 1,
              //For optimization
              $select: ['_id'],
              deviceId: context.data.deviceId
              //For optimization
              //$populate: constant.roomsPopulateQuery
            }
          });

          //duplicate deviceId found in existing rooms list
          if (resultRoomsFind.length > 0) {
            //If rooms id found is not the current rooms id patched
            if (JSON.stringify(resultRoomsFind[0]._id) !== JSON.stringify(context.id))
              throw new BadRequest('Duplicate deviceId found.');
          }
        }

        return context;
      },
    ],
    remove: []
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [
      //After remove room, ensure remove messages with the same room also (Handle in cron job for anonymous)
    ]
  },

  error: {
    all: [],
    find: [],
    get: [
      //Special handling for room not found (Object id not found) - error code 404
      //for the anonymous in front end due to cron job remove anonymous room and message
      function (hook) {
        if (hook?.error?.code === 404) {
          hook.error = new FeathersError('Room not found.', 'Error', customError.customErrorCode449, 'Room not found.', {});
        }
      }
    ],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};
