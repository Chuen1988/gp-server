const { softDelete } = require('feathers-hooks-common');
const { BadRequest } = require('@feathersjs/errors');
const utils = require('../../utils');
const companiesModel = require('../../models/companies.model');
const constant = require('../../constant');
const search = require('feathers-mongodb-fuzzy-search');

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

      //Added createdBy who
      function (hook) {
        if (hook?.params?.user) {
          hook.data.createdBy = hook.params.user._id;
        }
      },

      //Check contactNumber
      function (hook) {
        if (hook.data.contactNumber) {
          if (utils.isValidDigit(hook.data.contactNumber)) {
            //Do nothing
          } else {
            throw new BadRequest('Invalid contactNumber.');
          }
        }
      },

      //Check domain name to ensure it is unique in the company
      async context => {

        if (context.data.domains) {
          if (utils.hasDuplicates(context.data.domains)) {
            throw new BadRequest('Duplicate domain found.');
          }
        }

        return context;
      },

      //Check domain name to ensure it is unique in other companies as well
      async context => {
        const companies = context.app.service('companies');

        if (context.data.domains) {
          const resultCompaniesFind = await companies.find({
            paginate: false,
            query: {
              $limit: 1,
              //For optimization
              $select: ['_id'],
              domains: {
                $in: context.data.domains
              }
              //For optimization
              //$populate: constant.companiesPopulateQuery
            }
          });

          if (resultCompaniesFind.length > 0) {
            throw new BadRequest('Duplicate domain found in other company.');
          }
        }
        return context;
      },

      //Check phone code to ensure it is unique in the company
      async context => {

        if (context.data.phoneCodes) {
          if (utils.hasDuplicates(context.data.phoneCodes)) {
            throw new BadRequest('Duplicate phone code found.');
          }
        }

        return context;
      },

      //Check valid phone code
      async context => {

        if (context.data.phoneCodes) {

          for (let phoneCode of context.data.phoneCodes) {
            if (utils.isValidDigit(phoneCode)) {
              //Do nothing
            }
            else {
              throw new BadRequest('Invalid phone code.');
            }
          }
        }

        return context;
      },

      //Checking companies increment and add new company ID
      async context => {
        const count = await companiesModel(context.app).nextCount();
        context.data.companyId = `${constant.companyIDFormat}${count}`;

        return context;
      }

    ],
    update: [],
    patch: [
      //Check contactNumber
      function (hook) {
        if (hook.data.contactNumber) {
          if (utils.isValidDigit(hook.data.contactNumber)) {
            //Do nothing
          } else {
            throw new BadRequest('Invalid contactNumber.');
          }
        }
      },

      //Check domain name to ensure it is unique in the company
      async context => {

        if (context.data.domains) {
          if (utils.hasDuplicates(context.data.domains)) {
            throw new BadRequest('Duplicate domain found.');
          }
        }

        return context;
      },

      //Check domain name to ensure it is unique in other companies as well
      async context => {
        const companies = context.app.service('companies');

        if (context.data.domains) {
          const resultCompaniesFind = await companies.find({
            paginate: false,
            query: {
              //For optimization
              $select: ['_id'],
              domains: {
                $in: context.data.domains
              }
              //For optimization
              //$populate: constant.companiesPopulateQuery
            }
          });

          if (resultCompaniesFind.length > 0) {
            //If found 1, check whether its the same company id or not
            if (resultCompaniesFind.length === 1) {
              //If company id found is not the current company id patched
              if (JSON.stringify(resultCompaniesFind[0]._id) !== JSON.stringify(context.id))
                throw new BadRequest('Duplicate domain found in other company.');
            } else {
              throw new BadRequest('Duplicate domain found in other company.');
            }
          }
        }
        return context;
      },

      //Check phone code to ensure it is unique in the company
      async context => {

        if (context.data.phoneCodes) {
          if (utils.hasDuplicates(context.data.phoneCodes)) {
            throw new BadRequest('Duplicate phone code found.');
          }
        }

        return context;
      },

      //Check valid phone code
      async context => {

        if (context.data.phoneCodes) {

          for (let phoneCode of context.data.phoneCodes) {
            if (utils.isValidDigit(phoneCode)) {
              //Do nothing
            }
            else {
              throw new BadRequest('Invalid phone code.');
            }
          }
        }

        return context;
      }

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
