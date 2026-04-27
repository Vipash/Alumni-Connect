// mediaRoutes.js
const express = require('express');
const router = express.Router();
const { Gallery, Magazine } = require('./Media'); 

// Revised gallery route in mediaRoutes.js
router.post('/gallery-update', async (req, res) => {
  try {
    // AdminDashboard sends { imageUrl, title, desc } in the body 
    const newItem = new Gallery(req.body); 
    await newItem.save();
    res.status(200).json({ message: 'Gallery updated!', item: newItem });
  } catch (err) {
    console.error('Gallery Route Error:', err);
    res.status(500).json({ message: 'Error updating gallery', error: err.message });
  }
});

router.post('/gallery/reorder', async (req, res) => {
  try {
    const { items } = req.body; // Expecting an array of { _id, order, title, desc }
    
    const updatePromises = items.map(item => 
      Gallery.findByIdAndUpdate(item._id, { 
        order: item.order,
        title: item.title,
        desc: item.desc
      })
    );

    await Promise.all(updatePromises);
    res.status(200).json({ message: 'Gallery sequence and info updated!' });
  } catch (err) {
    res.status(500).json({ message: 'Update failed', error: err.message });
  }
});

// Update the GET route to sort by order first
router.get('/home-data', async (req, res) => {
  try {
    const gallery = await Gallery.find().sort({ order: 1, createdAt: -1 });
    const magazine = await Magazine.findOne();
    res.json({ gallery, magazine });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/magazine-update', async (req, res) => {
  try {
    const updateData = req.body; // Contains the URLs sent from the frontend
    const updated = await Magazine.findOneAndUpdate(
      {},
      { $set: updateData },
      { upsert: true, new: true }
    );
    res.status(200).json({ message: 'Updated!', magazine: updated });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
});

// DELETE: Magazine Issue (MISSING ROUTE ADDED HERE)
router.delete('/magazine-delete', async (req, res) => {
  try {
    await Magazine.deleteMany({}); // Clears the magazine record
    res.status(200).json({ message: 'Magazine issue deleted successfully' });
  } catch (err) {
    console.error('Magazine Delete Error:', err);
    res.status(500).json({ message: 'Error deleting magazine', error: err.message });
  }
});

// GET: Home Data
router.get('/home-data', async (req, res) => {
  try {
    const gallery = await Gallery.find().sort({ createdAt: -1 });
    const magazine = await Magazine.findOne();
    res.json({ gallery, magazine });
  } catch (err) {
    console.error('Home Data Route Error:', err);
    res.status(500).json({ message: 'Error fetching data', error: err.message });
  }
});

// DELETE gallery item
router.delete('/gallery/:id', async (req, res) => {
  try {
    await Gallery.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH gallery item
router.patch('/gallery/:id', async (req, res) => {
  try {
    await Gallery.findByIdAndUpdate(req.params.id, req.body);
    res.json({ message: 'Updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;