/* --- backend/routes/connectionRoutes.js --- */
const express = require('express');
const router = express.Router();
const Connection = require('./Connection');

// Record a new connection event
router.post('/log', async (req, res) => {
  try {
    const { studentId, alumniId, noticeId, contactMethod } = req.body;
    const newConn = new Connection({
      student: studentId,
      alumni: alumniId,
      notice: noticeId,
      contactMethod
    });
    await newConn.save();
    res.status(201).json({ message: "Connection logged" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get history for a specific Alumni (to see who contacted them)
router.get('/alumni/:id', async (req, res) => {
  try {
    const history = await Connection.find({ student: req.params.id }) // 'student' field tracks the initiator
      .populate('alumni', 'name email branch company') // The person being contacted
      .populate('notice', 'title company')
      .sort({ connectedAt: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get history for a specific student
router.get('/student/:id', async (req, res) => {
  try {
    const history = await Connection.find({ student: req.params.id })
      .populate('alumni', 'name branch')
      .populate('notice', 'title company')
      .sort({ connectedAt: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;