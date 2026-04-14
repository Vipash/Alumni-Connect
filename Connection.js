const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  alumni: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  notice: { type: mongoose.Schema.Types.ObjectId, ref: 'Notice', required: true },
  contactMethod: { type: String, required: true },
  connectedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Connection', connectionSchema);