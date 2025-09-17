
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String },
  imagePath: { type: String },
  audioPath: { type: String },
  callType: { type: String, enum: ['audio', 'video'] },
  callStart: { type: Date },
  callDuration: { type: Number },
  sdp: { type: Object },
  lastCandidate: { type: Object },
  timestamp: { type: Date, default: Date.now },
  viewed: { type: Boolean, default: false }, 
});

module.exports = mongoose.model('Message', messageSchema);