const constant = require('../constant');
const autoIncrement = require('mongoose-plugin-autoinc-fix');
// companies-model.js - A mongoose model
// 
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const modelName = 'companies';
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const schema = new Schema({
    name: { type: String, required: true },
    contactNumber: { type: String, default: null },
    domains: [{ type: String, sparse: true, required: true }],
    active: { type: Boolean, default: true },
    remarks: { type: String, default: null },
    companyId: { type: String, unique: true, sparse: true },
    smsCredits: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'users', default: null },
    countryCode: { type: String, default: constant.defaultCountryCode },
    phoneCodes: [{ type: String, required: true }],
    currencyCode: { type: String, default: constant.defaultCurrencyCode },

    //userId increment on users model
    incrementUserId: { type: Number, default: 0 },

    //SMS Vendor
    smsVendor: { type: Number, default: constant.smsVendorGinota },
    smsUrl: { type: String, default: constant.smsVendorGinotaUrl },
    smsApiKey: { type: String, default: constant.smsVendorGinotaApiKey },
    smsApiSecret: { type: String, default: constant.smsVendorGinotaApiSecret },
    
    smsCheckCredits: { type: Boolean, default: true },
    smsResendLimit: { type: Number, default: constant.smsResendLimitDefault },

    //Soft Delete
    deleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  }, {
    timestamps: true,
    //Enable Mongoose setters getter functions
    toObject: { getters: true, setters: true },
    toJSON: { getters: true, setters: true }
  });

  //Search domains
  schema.index({ 'domains': 1 });

  //CompanyId start with 100
  schema.plugin(autoIncrement.plugin, {
    model: 'companies',
    field: 'incrementCompanyId',
    startAt: 100,
    incrementBy: 1
  });

  // This is necessary to avoid model compilation errors in watch mode
  // see https://mongoosejs.com/docs/api/connection.html#connection_Connection-deleteModel
  if (mongooseClient.modelNames().includes(modelName)) {
    mongooseClient.deleteModel(modelName);
  }
  return mongooseClient.model(modelName, schema);

};
