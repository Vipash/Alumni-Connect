const mongoose = require('mongoose');

// This defines the "Schema" (the blueprint)
const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'Admin' }, // 'GodMode' or 'Admin'
  permissions: { 
    type: [String], 
    default: ['dashboard'] 
  }
});

// This creates the "Model" using that blueprint and exports it
// The error was likely here (referencing AdminSchema instead of adminSchema)
module.exports = mongoose.model('Admin', adminSchema);