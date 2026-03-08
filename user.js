import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: String,
  branch: String,
  passoutYear: Number,
  rollNumber: String,
  company: String,
  mobile: String,
  displayName: String, // Ensure this exists here
  isVerified: { type: Boolean, default: false }
});

// THIS IS THE KEY: Export the compiled model
const User = mongoose.model('User', userSchema);
export default User;