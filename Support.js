const mongoose = require('mongoose');

const supportSchema = new mongoose.Schema({
  sender: { type: String, required: true }, // Email
  userName: { type: String },
  type: { type: String, enum: ['Bug', 'Feature', 'Account', 'Other'], default: 'Other' },
  message: { type: String, required: true },
  status: { type: String, default: 'Pending' }, // 'Pending' or 'Resolved'
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Support', supportSchema);