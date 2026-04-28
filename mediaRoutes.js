// mediaRoutes.js
const express = require('express');
const router = express.Router();
const { Gallery, Magazine, News } = require('./Media'); 

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
    const gallery = await Gallery.find().sort({ order: 1 });
    const magazine = await Magazine.findOne();
    const news = await News.find().sort({ order: 1, date: -1 });
    res.json({ gallery, magazine, news });
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

// POST: Add/Update News
router.post('/news-update', async (req, res) => {
  try {
    const newItem = new News(req.body);
    await newItem.save();
    res.status(200).json({ message: 'News added!', item: newItem });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Bulk Reorder News
router.post('/news/reorder', async (req, res) => {
  try {
    const { items } = req.body;
    const promises = items.map(item => 
      News.findByIdAndUpdate(item._id, { 
        order: item.order, 
        headline: item.headline, 
        content: item.content,
        imageUrl: item.imageUrl
      })
    );
    await Promise.all(promises);
    res.status(200).json({ message: 'News sequence and details updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update the GET home-data to include news
router.get('/home-data', async (req, res) => {
  try {
    const gallery = await Gallery.find().sort({ order: 1 });
    const magazine = await Magazine.findOne();
    const news = await News.find().sort({ order: 1, date: -1 }); // Get News
    res.json({ gallery, magazine, news });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE News
router.delete('/news/:id', async (req, res) => {
  try {
    await News.findByIdAndDelete(req.params.id);
    res.json({ message: 'News deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;