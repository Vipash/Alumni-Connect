const mongoose = require('mongoose');

// media.js
const GallerySchema = new mongoose.Schema({
  title: String,
  desc: String,
  imageUrl: String,
  createdAt: { type: Date, default: Date.now }
});

const MagazineSchema = new mongoose.Schema({
  pdfUrl: String,
  coverUrl: String,
  p1Url: String, // Add this for Page 1 preview
  p2Url: String, // Add this for Page 2 preview
  updatedAt: { type: Date, default: Date.now }
});

const Gallery = mongoose.model('Gallery', GallerySchema);
const Magazine = mongoose.model('Magazine', MagazineSchema);

module.exports = { Gallery, Magazine };