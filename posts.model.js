const mongoose = require('mongoose')
const { Schema } = mongoose
const { ObjectId } = Schema.Types

const postSchema = new Schema({
  title: { type: String },
  body: { type: String },
  image: { type: String },
  user_id: { ref: 'User', type: ObjectId, required: true },
  comments: [{
      user_id: {ref: 'User', type: ObjectId, required: true},
      text: {type: String},
  }]
})

module.exports = mongoose.model('Post', postSchema)
