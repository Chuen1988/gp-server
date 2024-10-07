// rooms-model.js - A mongoose model
// 
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const modelName = 'rooms';
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const schema = new Schema({
    //deviceId (as identifier for Anonymous (ensure it is unique) currently support for one to one), 
    deviceId: { type: String, default: null },
    //Member (as identifier, currently support for one to one)
    user: { type: Schema.Types.ObjectId, ref: 'users', default: null },
    //online status (true or false) for Member or Anonymous(deviceId)
    online: { type: Boolean, default: false },

    //Company (to identify which company)
    company: { type: Schema.Types.ObjectId, ref: 'companies', required: true },
    lastMessage: { type: Schema.Types.ObjectId, ref: 'messages', default: null },
    lastMessageAt: { type: Date, default: null },

    //Soft Delete
    deleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  }, {
    timestamps: true,
    //Enable Mongoose setters getter functions
    toObject: { getters: true, setters: true },
    toJSON: { getters: true, setters: true }
  });

  //Search user
  schema.index({ 'user': 1 });
  //Search deviceId
  schema.index({ 'deviceId': 1 });

  // This is necessary to avoid model compilation errors in watch mode
  // see https://mongoosejs.com/docs/api/connection.html#connection_Connection-deleteModel
  if (mongooseClient.modelNames().includes(modelName)) {
    mongooseClient.deleteModel(modelName);
  }
  return mongooseClient.model(modelName, schema);

};
