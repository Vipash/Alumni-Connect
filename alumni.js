const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  // Basic Auth & Profile
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // We will hash this later
  role: { type: String, enum: ['student', 'alumni', 'admin'], required: true },
  isVerified: { type: Boolean, default: false },

  // Profile Details
  branch: { type: String, required: true },
  passoutYear: { type: Number, required: true }, // For students, this is expected year
  
  // Role-Specific Fields
  rollNumber: String,   // Student only
  degree: String,       // Student only
  company: String,      // Alumni only
  bio: String,          // Alumni only
  mobile: String,       // Hidden from public
  
  // Location (Primarily for Alumni)
  location: {
    type: { type: String, default: "Point" },
    coordinates: { type: [Number], index: "2dsphere" } // [lng, lat]
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);