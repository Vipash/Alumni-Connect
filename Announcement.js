const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema({
  title: String,
  subject: String,
  content: String,
  date: { type: Date, default: Date.now },
  author: String // e.g., "Admin Name"
});

module.exports = mongoose.model('Announcement', AnnouncementSchema);