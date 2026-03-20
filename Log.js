const mongoose = require('mongoose');

const securityLogSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  viewerName: String, // Matching the 'viewerName' used in your dashboard
  alumniId: { type: mongoose.Schema.Types.ObjectId, ref: 'Alumni', required: true },
  alumniName: String,
  action: { type: String, default: 'VIEW_CONTACT_DETAILS' },
  timestamp: { type: Date, default: Date.now }
});

// IMPORTANT: This must be exported correctly
module.exports = mongoose.model('SecurityLog', securityLogSchema);