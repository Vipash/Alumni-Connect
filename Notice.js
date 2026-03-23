const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String, required: true },
  opportunityType: { 
    type: String, 
    enum: ['Internship', 'Full-time', 'Project', 'Referral'], 
    required: true 
  },
  deadline: { type: Date, required: true },
  contactMethod: { 
    type: String, 
    enum: ['WhatsApp', 'Email', 'LinkedIn'], 
    required: true 
  },
  details: { type: String, required: true },
  // Link to the Alumni who posted it
  postedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  createdAt: { type: Date, default: Date.now }
},
{ timestamps: true });

module.exports = mongoose.model('Notice', noticeSchema);