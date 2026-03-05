const mongoose = require('mongoose');

const AlumniSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Must be lowercase 'name'
  company: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  location: {
    type: { type: String, default: "Point" },
    coordinates: { type: [Number], required: true }
  }
});

module.exports = mongoose.model('Alumni', AlumniSchema);