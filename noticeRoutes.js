/* --- backend/routes/noticeRoutes.js --- */
const express = require('express');
const router = express.Router();
const Notice = require('./Notice'); // Ensure this path is correct
const Notification = require('./Notification');
const User = require('./User');

// --- Helper Function for Alerts ---
const createInterestAlerts = async (newNotice) => {
  try {
    // Find all users who have this opportunityType in their interests array
    const matchingUsers = await User.find({ 
      interests: newNotice.opportunityType 
    });

    if (matchingUsers.length === 0) return;

    const notifications = matchingUsers.map(user => ({
      userId: user._id,
      message: `New ${newNotice.opportunityType} alert: ${newNotice.title} at ${newNotice.company}!`,
      link: `/hub`, 
      type: 'interest_match'
    }));

    await Notification.insertMany(notifications);
  } catch (err) {
    console.error("Alert Trigger Error:", err);
  }
};

// @route   POST /api/notices/add
router.post('/add', async (req, res) => {
  try {
    const newNotice = new Notice(req.body);
    const savedNotice = await newNotice.save(); // FIXED: was 'await savedNotice.save()'

    // Trigger the alerts in the background
    await createInterestAlerts(savedNotice);

    // Populate for the frontend response
    const populatedNotice = await savedNotice.populate('postedBy', 'name email mobile');
    
    res.status(201).json(populatedNotice);
  } catch (err) {
    console.error("Notice Add Error:", err);
    res.status(500).json({ message: "Server error while posting notice" });
  }
});

// @route   GET /api/notices
router.get('/', async (req, res) => {
  try {
    const notices = await Notice.find()
      .populate('postedBy', 'name branch passoutYear company location profilePhoto bio')
      .sort({ createdAt: -1 });
    res.json(notices);
  } catch (err) {
    console.error("Fetch Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PATCH /api/notices/:id
router.patch('/:id', async (req, res) => {
  try {
    const { isFilled } = req.body;
    const notice = await Notice.findByIdAndUpdate(
      req.params.id, 
      { isFilled }, 
      { new: true }
    );
    if (!notice) return res.status(404).json({ message: "Notice not found" });
    res.json(notice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   DELETE /api/notices/:id
router.delete('/:id', async (req, res) => {
  try {
    const notice = await Notice.findByIdAndDelete(req.params.id);
    if (!notice) return res.status(404).json({ message: "Notice not found" });
    res.json({ message: "Notice removed successfully" });
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;