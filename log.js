const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  viewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  viewerName: String,
  alumniId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  alumniName: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Log', LogSchema);