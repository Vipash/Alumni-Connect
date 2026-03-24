/* --- backend/routes/noticeRoutes.js --- */
const express = require('express');
const router = express.Router();
const Notice = require('./Notice');

// @route   POST /api/notices/add
router.post('/add', async (req, res) => {
  try {
    const { title, company, location, opportunityType, deadline, contactMethod, details, postedBy } = req.body;

    const newNotice = new Notice({
      title,
      company,
      location,
      opportunityType,
      deadline,
      contactMethod,
      details,
      postedBy
    });

    const savedNotice = await newNotice.save();
    
    // We populate the 'postedBy' field so the frontend gets the Alumni's name/details immediately
    const populatedNotice = await savedNotice.populate('postedBy', 'name email mobile');
    
    res.status(201).json(populatedNotice);
  } catch (err) {
    console.error("Notice Add Error:", err);
    res.status(500).json({ message: "Server error while posting notice" });
  }
});

/* --- Add this to backend/routes/noticeRoutes.js --- */

// @route   DELETE /api/notices/:id
// @desc    Delete a notice (Only by the creator)
router.delete('/:id', async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    
    if (!notice) {
      return res.status(404).json({ message: "Notice not found" });
    }

    // Optional: Add a check here to ensure the user deleting is the owner or an admin
    // if (notice.postedBy.toString() !== req.body.userId) { ... }

    await Notice.findByIdAndDelete(req.params.id);
    res.json({ message: "Notice removed successfully" });
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ message: "Server error during deletion" });
  }
});

// @route   GET /api/notices
// @desc    Get all active notices (sorted by newest first)
router.get('/', async (req, res) => {
  try {
    const notices = await Notice.find()
      .populate('postedBy', 'name branch passoutYear company location profilePhoto bio') // Get author details
      .sort({ createdAt: -1 }); // Newest first
    res.json(notices);
  } catch (err) {
    console.error("Fetch Notices Error:", err);
    res.status(500).json({ message: "Server error while fetching notices" });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { isFilled } = req.body;
    
    // 1. Find the notice
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ message: "Notice not found" });

    // 2. Update the status
    notice.isFilled = isFilled;
    await notice.save();

    res.json(notice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;