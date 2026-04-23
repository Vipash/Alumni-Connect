const express = require('express');
const router = express.Router();
const { Gallery, Magazine } = require('./Media'); // Ensure this points to your Models

// POST: Add gallery item
router.post('/gallery-update', async (req, res) => {
  try {
    const newItem = new Gallery(req.body);
    await newItem.save();
    res.status(200).json({ message: "Gallery updated!" });
  } catch (err) {
    res.status(500).json(err);
  }
});

// POST: Update Magazine
router.post('/magazine-update', async (req, res) => {
  try {
    await Magazine.findOneAndUpdate({}, req.body, { upsert: true });
    res.status(200).json({ message: "Magazine published!" });
  } catch (err) {
    res.status(500).json(err);
  }
});

// GET: Home Data
router.get('/home-data', async (req, res) => {
  try {
    const gallery = await Gallery.find().sort({ createdAt: -1 });
    const magazine = await Magazine.findOne();
    res.json({ gallery, magazine });
  } catch (err) {
    res.status(500).json(err);
  }
});

// DELETE
router.delete('/gallery/:id', async (req, res) => {
  await Gallery.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

// PATCH
router.patch('/gallery/:id', async (req, res) => {
  await Gallery.findByIdAndUpdate(req.params.id, req.body);
  res.json({ message: "Updated" });
});

module.exports = router;