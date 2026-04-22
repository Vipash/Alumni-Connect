const mongoose = require('mongoose');

const GallerySchema = new mongoose.Schema({
  title: String,
  desc: String,
  img: String, // This will store the Cloudinary URL
  createdAt: { type: Date, default: Date.now }
});

const MagazineSchema = new mongoose.Schema({
  pdfUrl: String,
  coverUrl: String, // Cloudinary screenshot URL
  updatedAt: { type: Date, default: Date.now }
});

const Gallery = mongoose.model('Gallery', GallerySchema);
const Magazine = mongoose.model('Magazine', MagazineSchema);

module.exports = { Gallery, Magazine };