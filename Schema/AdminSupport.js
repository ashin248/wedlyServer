const mongoose = require('mongoose');

const AdminSupportSchema = new mongoose.Schema({
  email: {
    type: String,
  },
  mobile: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  supported: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('SupportSchema', AdminSupportSchema);