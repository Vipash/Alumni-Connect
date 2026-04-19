const mongoose = require('mongoose');

const tickerSchema = new mongoose.Schema({
  text: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  priority: { type: Number, default: 0 }, // Higher number = shows first
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ticker', tickerSchema);