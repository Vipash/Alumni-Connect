const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['junior', 'alumni', 'admin'], default: 'junior' }
});

module.exports = mongoose.model('User', UserSchema);