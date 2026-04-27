const mongoose = require('mongoose');

// media.js
const GallerySchema = new mongoose.Schema({
  title: String,
  desc: String,
  imageUrl: String,
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const MagazineSchema = new mongoose.Schema({
  pdfUrl: String,
  coverUrl: String,
  p1Url: String,
  p2Url: String,
  updatedAt: { type: Date, default: Date.now }
});

const Gallery = mongoose.model('Gallery', GallerySchema);
const Magazine = mongoose.model('Magazine', MagazineSchema);

module.exports = { Gallery, Magazine };