const express = require('express');
const router = express.Router();
const Notification = require('./Notification');
const User = require('./alumni');

// @route   GET /api/notifications/:userId
// @desc    Get all notifications for a specific user
router.get('/:userId', async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.params.userId })
      .sort({ createdAt: -1 }) // Newest first
      .limit(50); // Keep the inbox snappy
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   PATCH /api/notifications/:id/read
// @desc    Mark a single notification as read
router.patch('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    res.json(notification);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   PATCH /api/users/:id/interests
router.patch('/:id/interests', async (req, res) => {
  try {
    const { interests } = req.body; 
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { interests },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// backend/routes/notificationRoutes.js
router.patch('/:userId/mark-all-read', async (req, res) => {
  await Notification.updateMany({ userId: req.params.userId }, { read: true });
  res.json({ message: "All marked as read" });
});

// @route   DELETE /api/notifications/:userId/clear
// @desc    Clear all notifications for a user
router.delete('/:userId/clear', async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.params.userId });
    res.json({ message: "Inbox cleared" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;