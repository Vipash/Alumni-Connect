// mediaRoutes.js
const express = require('express');
const router = express.Router();
const { Gallery, Magazine } = require('./Media'); // Ensure this points to your Models

const upload = require('./multer');

// POST: Add gallery item
// This assumes the Gallery entry already contains a Cloudinary URL in req.body.imageUrl
router.post('/gallery-update', async (req, res) => {
  try {
    const newItem = new Gallery(req.body);
    await newItem.save();
    res.status(200).json({ message: 'Gallery updated!' });
  } catch (err) {
    console.error('Gallery Route Error:', err);
    res.status(500).json(err);
  }
});

// POST: Update Magazine (FIXED)
// Expecting multipart/form-data with fields: pdf, cover, p1, p2
router.post(
  '/magazine-update',
  upload.fields([
    { name: 'pdf', maxCount: 1 },
    { name: 'cover', maxCount: 1 },
    { name: 'p1', maxCount: 1 },
    { name: 'p2', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const updateData = {};
      
      if (req.files && req.files['pdf']) {
        updateData.pdfUrl = req.files['pdf'][0].path;
      }
      if (req.files && req.files['cover']) {
        updateData.coverUrl = req.files['cover'][0].path;
      }
      if (req.files && req.files['p1']) {
        updateData.p1Url = req.files['p1'][0].path;
      }
      if (req.files && req.files['p2']) {
        updateData.p2Url = req.files['p2'][0].path;
      }

      // Optionally merge any text fields from req.body (e.g., title, issueNumber)
      if (req.body && Object.keys(req.body).length > 0) {
        Object.assign(updateData, req.body);
      }

      // Use $set so you only update the provided fields
      const updated = await Magazine.findOneAndUpdate(
        {},
        { $set: updateData },
        { upsert: true, new: true }
      );

      res
        .status(200)
        .json({ message: 'Magazine published successfully!', magazine: updated });
    } catch (err) {
      console.error('Magazine Route Error:', err);
      res
        .status(500)
        .json({ message: 'Internal Server Error', error: err });
    }
  }
);

// GET: Home Data
router.get('/home-data', async (req, res) => {
  try {
    const gallery = await Gallery.find().sort({ createdAt: -1 });
    const magazine = await Magazine.findOne();
    res.json({ gallery, magazine });
  } catch (err) {
    console.error('Home Data Route Error:', err);
    res.status(500).json(err);
  }
});

// DELETE gallery item
router.delete('/gallery/:id', async (req, res) => {
  try {
    await Gallery.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Gallery Delete Error:', err);
    res.status(500).json(err);
  }
});

// PATCH gallery item
router.patch('/gallery/:id', async (req, res) => {
  try {
    await Gallery.findByIdAndUpdate(req.params.id, req.body);
    res.json({ message: 'Updated' });
  } catch (err) {
    console.error('Gallery Update Error:', err);
    res.status(500).json(err);
  }
});

module.exports = router;