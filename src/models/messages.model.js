// messages-model.js - A mongoose model
// 
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const modelName = 'messages';
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const schema = new Schema({
    text: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'users', required: true },
    room: { type: Schema.Types.ObjectId, ref: 'rooms', required: true },
    company: { type: Schema.Types.ObjectId, ref: 'companies', required: true },

    //Soft Delete
    deleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  }, {
    timestamps: true,
    //Enable Mongoose setters getter functions
    toObject: { getters: true, setters: true },
    toJSON: { getters: true, setters: true }
  });

  // This is necessary to avoid model compilation errors in watch mode
  // see https://mongoosejs.com/docs/api/connection.html#connection_Connection-deleteModel
  if (mongooseClient.modelNames().includes(modelName)) {
    mongooseClient.deleteModel(modelName);
  }
  return mongooseClient.model(modelName, schema);

};
