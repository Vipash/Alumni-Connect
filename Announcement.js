const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema({
  title: String,
  subject: String,
  content: String,
  targetAudience: { type: String, enum: ['all', 'students', 'alumni'], default: 'all' },
  date: { type: Date, default: Date.now },
  author: String // e.g., "Admin Name"
});

module.exports = mongoose.model('Announcement', AnnouncementSchema);