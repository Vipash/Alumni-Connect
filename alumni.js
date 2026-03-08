const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'alumni', 'admin'], required: true },
  branch: { type: String, required: true },
  passoutYear: { type: Number, required: true },
  
  // Fields for Students/Alumni
  rollNumber: { type: String }, 
  company: { type: String },    
  bio: { type: String, default: "" },
  mobile: { type: String, default: "" },
  displayName: { type: String, default: "" }, // Added this because we added it to your form!
  
  // Location for Alumni map
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number] } 
  },
  
  isVerified: { type: Boolean, default: false }
}, { timestamps: true });

userSchema.index({ location: '2dsphere' });

// Use module.exports for compatibility with require()
module.exports = mongoose.model('User', userSchema);