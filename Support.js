const mongoose = require('mongoose');

const supportSchema = new mongoose.Schema({
  senderEmail: { type: String, required: true },
  userName: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['Bug', 'Feature', 'Account', 'Inquiry', 'Complaint', 'Suggestion'], 
    default: 'Inquiry' 
  },
  message: { type: String, required: true },
  isRegistered: { type: Boolean, default: false }, // Crucial for your sub-tab logic
  status: { type: String, default: 'Open' }, // Open, Resolved
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Support', supportSchema);