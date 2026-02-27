const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  nickname: {
    type: String,
    required: true
  },
  language: {
    type: String,
    enum: ['english', 'hindi', 'tamil', 'telugu'],
    default: 'english'
  },
  voiceProfile: {
    type: String,
    default: null
  },
  faceId: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
