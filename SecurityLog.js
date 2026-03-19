const mongoose = require('mongoose');

const securityLogSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: String,
  alumniId: { type: mongoose.Schema.Types.ObjectId, ref: 'Alumni', required: true },
  alumniName: String,
  action: { type: String, default: 'VIEW_CONTACT_DETAILS' },
  timestamp: { type: Date, default: Date.now },
  ipAddress: String, // Good for security audits
});

module.exports = mongoose.model('SecurityLog', securityLogSchema);