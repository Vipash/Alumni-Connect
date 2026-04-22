const express = require('express');
const router = express.Router();
const { Gallery, Magazine } = require('../models/Media');

// POST: Add new gallery item
router.post('/gallery-update', async (req, res) => {
  try {
    const newItem = new Gallery(req.body);
    await newItem.save();
    res.status(200).json({ message: "Gallery updated!" });
  } catch (err) {
    res.status(500).json(err);
  }
});

// POST: Update Magazine (Overwrites old one)
router.post('/magazine-update', async (req, res) => {
  try {
    // We use findOneAndUpdate so there's only ever ONE magazine record
    await Magazine.findOneAndUpdate({}, req.body, { upsert: true });
    res.status(200).json({ message: "Magazine published!" });
  } catch (err) {
    res.status(500).json(err);
  }
});

// GET: Fetch all for Homepage
router.get('/home-data', async (req, res) => {
  try {
    const gallery = await Gallery.find().sort({ createdAt: -1 });
    const magazine = await Magazine.findOne();
    res.json({ gallery, magazine });
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;