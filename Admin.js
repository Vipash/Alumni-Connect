const mongoose = require('mongoose');

// This defines exactly what an Admin looks like in your database
const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'Admin' }, // 'GodMode' or 'Admin'
  // NEW: Store list of accessible tabs
  permissions: { 
    type: [String], 
    default: ['dashboard'] // Default minimal access
  }
});

// Export it so seed.js and server.js can use it
module.exports = mongoose.model('Admin', AdminSchema);