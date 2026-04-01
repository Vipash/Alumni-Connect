const mongoose = require('mongoose');

// This defines exactly what an Admin looks like in your database
const AdminSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true // Prevents two admins from having the same name
  },
  password: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    default: 'Moderator' // Options: 'GodMode', 'Moderator', 'Editor'
  }
});

// Export it so seed.js and server.js can use it
module.exports = mongoose.model('Admin', AdminSchema);