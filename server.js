const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const User = require('./alumni'); // We'll keep the filename but it acts as User now
const Log = require('./Log');    // New Log model
const path = require('path');
const bcrypt = require('bcrypt'); // Make sure this is at the top of server.js
const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://AlumniAdmin:12345@cluster0.ajb1ovb.mongodb.net/alumni_db?appName=Cluster0';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully!'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- NEW/UPDATED API ROUTES ---

// 1. Get ONLY verified Alumni for the map (Hides sensitive info)
app.get('/api/get-alumni', async (req, res) => {
  try {
    // Exclude mobile and email from the initial map fetch
    const verifiedAlumni = await User.find({ role: 'alumni', isVerified: true }, '-mobile -email');
    res.json(verifiedAlumni);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. Universal Register Route (Handles both Student and Alumni)
app.post('/api/register', async (req, res) => {
  try {
    const { password, ...userData } = req.body;
    
    // 1. Hash the password (10 rounds of salt)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // 2. Create the user with the hashed password
    const newUser = new User({
      ...userData,
      password: hashedPassword,
      isVerified: false
    });
    
    await newUser.save();
    res.status(201).send("Registered successfully! Awaiting verification.");
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(400).send("Error: " + error.message);
  }
});

// 3. Admin: Get Pending List (Filtered by Role)
app.get('/api/admin/pending/:role', async (req, res) => {
  try {
    const pending = await User.find({ role: req.params.role, isVerified: false });
    res.json(pending);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// 4. Admin: Get Security Logs
app.get('/api/admin/logs', async (req, res) => {
  try {
    const logs = await Log.find().sort({ timestamp: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// 5. SECURE: Request Contact Info & Log Action
app.post('/api/view-contact', async (req, res) => {
  const { viewerId, alumniId } = req.body;
  try {
    const viewer = await User.findById(viewerId);
    const alumni = await User.findById(alumniId);

    if (!viewer || !viewer.isVerified) {
      return res.status(403).send("Only verified users can view contact details.");
    }

    // Create Security Log
    const newLog = new Log({
      viewerId: viewer._id,
      viewerName: viewer.name,
      alumniId: alumni._id,
      alumniName: alumni.name
    });
    await newLog.save();

    // Return sensitive info
    res.json({ mobile: alumni.mobile, email: alumni.email });
  } catch (error) {
    res.status(500).send("Error processing request.");
  }
});

// 6. Generic Update/Verify Route
app.patch('/api/verify-user/:id', async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isVerified: true });
    res.send("User Verified!");
  } catch (error) {
    res.status(400).send(error.message);
  }
});

// 7. Generic Delete Route
app.delete('/api/delete-user/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.send("User Deleted Successfully!");
  } catch (error) {
    res.status(400).send(error.message);
  }
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