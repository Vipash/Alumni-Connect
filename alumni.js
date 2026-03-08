import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'alumni', 'admin'], required: true },
  branch: { type: String, required: true },
  passoutYear: { type: Number, required: true },
  
  // Fields that might be specific to Students or Alumni
  rollNumber: { type: String }, // Required for Students
  company: { type: String },    // Required for Alumni
  bio: { type: String, default: "" },
  mobile: { type: String, default: "" },
  
  // Location for Alumni map
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number] } // [Longitude, Latitude]
  },
  
  // Security/Status fields
  isVerified: { type: Boolean, default: false }
}, { timestamps: true });

// Add a 2dsphere index for your Map location searches
userSchema.index({ location: '2dsphere' });

const User = mongoose.model('User', userSchema);
export default User;