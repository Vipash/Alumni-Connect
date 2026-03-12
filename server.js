// --- IMPORTS ---
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const path = require('path');

// Models
const User = require('./alumni'); 
const Log = require('./Log');

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://AlumniAdmin:12345@cluster0.ajb1ovb.mongodb.net/alumni_db?appName=Cluster0';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully!'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- API ROUTES ---
const Announcement = require('./Announcement');

// Get all announcements
app.get('/api/announcements', async (req, res) => {
  const { role } = req.query; // e.g., /api/announcements?role=alumni
  
  let query = {};
  if (role) {
    // Finds announcements meant for 'all' OR for the specific role
    query = { targetAudience: { $in: ['all', role] } };
  }
  
  const announcements = await Announcement.find(query).sort({ date: -1 });
  res.json(announcements);
});

// Post new announcement (Admin only)
app.post('/api/admin/announcement', async (req, res) => {
  try {
    const { title, subject, content, targetAudience } = req.body;
    const newAnn = new Announcement({ 
      title, subject, content, 
      targetAudience: targetAudience || 'all' 
    });
    await newAnn.save();
    res.status(201).send("Posted!");
  } catch (err) { res.status(500).send(err.message); }
});

// Registration
app.post('/api/register', async (req, res) => {
  try {
    const { password, ...userData } = req.body;
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) return res.status(400).send("User already exists");

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const newUser = new User({
      ...userData,
      password: hashedPassword,
      isVerified: false
    });
    
    await newUser.save();
    res.status(201).send("Registered successfully!");
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(400).send("Registration failed: " + error.message);
  }
});

// Login - FIXED DATA LEAK & SYNTAX
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).send("Invalid email or password");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).send("Invalid email or password");

    // We use 'rest' to gather everything EXCEPT the password to send to the frontend
    const { password: _, ...userProfile } = user._doc;
    res.json(userProfile); 
    
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).send("Server error");
  }
});

app.post('/api/view-contact', async (req, res) => {
  const { viewerId, alumniId } = req.body;
  try {
    const alumni = await User.findById(alumniId);
    if (!alumni) return res.status(404).send("Alumni not found");
    res.json({ mobile: alumni.mobile, email: alumni.email });
  } catch (error) {
    res.status(500).send("Error fetching details.");
  }
});

// Admin Routes
app.get('/api/admin/pending/:role', async (req, res) => {
  try {
    const pending = await User.find({ role: req.params.role, isVerified: false });
    res.json(pending);
  } catch (error) { res.status(500).send(error.message); }
});

app.get('/api/admin/approved/student', async (req, res) => {
  try {
    const students = await User.find({ role: 'student', isVerified: true });
    res.json(students);
  } catch (err) { res.status(500).send(err.message); }
});

// Alumni Fetch - OPENED FOR ADMIN/MAP
app.get('/api/get-alumni', async (req, res) => {
  try {
    const alumni = await User.find({ role: 'alumni', isVerified: true });
    res.json(alumni);
  } catch (err) { res.status(500).send("Failed to fetch alumni"); }
});

// Verification/Deletion
app.patch('/api/verify-user/:id', async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isVerified: true });
    res.send("User Verified!");
  } catch (err) { res.status(400).send(err.message); }
});

app.delete('/api/delete-user/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.send("User Deleted!");
  } catch (err) { res.status(400).send(err.message); }
});

// Security Logs
app.get('/api/admin/logs', async (req, res) => {
  try {
    const logs = await Log.find().sort({ timestamp: -1 });
    res.json(logs);
  } catch (err) { res.status(500).send(err.message); }
});

app.delete('/api/admin/announcement/:id', async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.send("Announcement Deleted");
  } catch (err) { res.status(400).send(err.message); }
});

// --- PRODUCTION SERVING ---
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));