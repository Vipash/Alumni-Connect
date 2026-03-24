const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'alumni', 'admin'], required: true },
  branch: { type: String, required: true },
  passoutYear: { type: Number, required: true },
  rollNumber: { type: String }, 
  company: { type: String },    
  mobile: { type: String, default: "" },
  displayName: { type: String, default: "" },
  interests: { type: [String], default: [] },
  bio: { type: String, default: "" },
  linkedin: { type: String, default: "" },
  resumeUrl: { type: String, default: "" },
  profilePhoto: { type: String, default: "" },
  bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number] } 
  },
  isVerified: { type: Boolean, default: false }
}, { timestamps: true });

userSchema.index({ location: '2dsphere' });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);