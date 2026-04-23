const express = require('express');
const router = express.Router();
const { Gallery, Magazine } = require('./Media');

const handleMagazineSubmit = async () => {
  try {
    const res = await fetch('/api/media/magazine-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pdfUrl: magUrl, // The URL from Cloudinary
        coverUrl: magCoverUrl, // Optional screenshot of cover
      }),
    });
    if (res.ok) alert("Magazine Published!");
  } catch (err) {
    console.error("Upload failed", err);
  }
};

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

// DELETE an image
router.delete('/gallery/:id', async (req, res) => {
  await Gallery.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

// UPDATE text
router.patch('/gallery/:id', async (req, res) => {
  await Gallery.findByIdAndUpdate(req.params.id, req.body);
  res.json({ message: "Updated" });
});

module.exports = router;