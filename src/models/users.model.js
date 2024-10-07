const constant = require('../constant');
const utils = require('../utils');

// users-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const modelName = 'users';
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const schema = new Schema({
    //isVerified & status active skip sms notification
    status: { type: Number, default: constant.userStatusInactive },
    //userName for Main Control ONLY
    userName: { type: String, sparse: true, lowercase: true, default: null },
    //userNameBO for Back Office ONLY
    userNameBO: { type: String, sparse: true, lowercase: true, default: null },
    //contactNumber for Member ONLY
    contactNumber: { type: String, default: null },
    accessToken: { type: String, default: null },
    password: { type: String, required: true },
    role: { type: Number, required: true },

    fullName: { type: String, default: null },
    pnId: { type: String, default: null },
    userId: { type: String, unique: true, sparse: true },

    //chat rooms for Member ONLY
    rooms: [{ type: Schema.Types.ObjectId, ref: 'rooms' }],

    //Google Authenticator Multi Factor Authentication for Main Control & BO
    googleMFA: { type: Boolean, default: false },
    googleMFASecretKey: { type: String, default: null },
    googleMFAQRImage: { type: String, default: null },

    //Company
    company: { type: Schema.Types.ObjectId, ref: 'companies', default: null },

    //Verification
    //isVerified & status active skip sms notification
    isVerified: { type: Boolean, default: false },
    verifyToken: { type: String, default: null },
    verifyShortToken: { type: String, default: null },
    verifyExpires: { type: Date, default: null },
    verifyAttempts: { type: Number, default: constant.verifyAttempts },
    verifyChanges: { type: Object, default: null },
    //SMS Resend limit
    verifyResend: { type: Number, default: 0 },
    resetToken: { type: String, default: null },
    resetShortToken: { type: String, default: null },
    resetExpires: { type: Date, default: null },
    resetAttempts: { type: Number, default: constant.resetAttempts },

    //SMS Resend limit
    resetResend: { type: Number, default: 0 },

    createdBy: { type: Schema.Types.ObjectId, ref: 'users', default: null },

    //Soft Delete
    deleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  }, {
    timestamps: true,
    //Enable Mongoose setters getter functions
    toObject: { getters: true, setters: true },
    toJSON: { getters: true, setters: true }
  });

  //Check to avoid duplicate (BO)
  schema.index({ 'userName': 1, 'userNameBO': 1, 'contactNumber': 1 });
  //Check to avoid duplicate (Main Control and Member)
  schema.index({ 'company': 1, 'userName': 1, 'userNameBO': 1, 'contactNumber': 1 });

  // This is necessary to avoid model compilation errors in watch mode
  // see https://mongoosejs.com/docs/api/connection.html#connection_Connection-deleteModel
  if (mongooseClient.modelNames().includes(modelName)) {
    mongooseClient.deleteModel(modelName);
  }
  return mongooseClient.model(modelName, schema);

};
