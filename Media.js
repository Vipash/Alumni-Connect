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

const NewsSchema = new mongoose.Schema({
  imageUrl: String,
  headline: String,
  content: String,
  date: { type: Date, default: Date.now },
  order: { type: Number, default: 0 }
});

const Gallery = mongoose.model('Gallery', GallerySchema);
const Magazine = mongoose.model('Magazine', MagazineSchema);
const News = mongoose.model('News', NewsSchema);

module.exports = { Gallery, Magazine, News };