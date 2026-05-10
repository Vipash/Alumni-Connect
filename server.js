// server.js

require('dotenv').config(); // Make sure env vars work

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const path = require('path');
const nodemailer = require('nodemailer');

const Announcement = require('./Announcement');
const SecurityLog = require('./SecurityLog');
const noticeRoutes = require('./noticeRoutes');
const connectionRoutes = require('./connectionRoutes');
const notificationRoutes = require('./notificationRoutes');
const Admin = require('./Admin');
const User = require('./alumni');
const Support = require('./Support');
const mediaRoutes = require('./mediaRoutes');
const Ticker = require('./Ticker');
const { sendVerificationEmail } = require('./emailservice');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/notices', noticeRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/media', mediaRoutes);

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb+srv://AlumniAdmin:12345@cluster0.ajb1ovb.mongodb.net/alumni_db?appName=Cluster0';

mongoose
  .connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully!'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// ---------- ANNOUNCEMENTS ----------

// Get all announcements (with optional role-based audience filtering)
app.get('/api/announcements', async (req, res) => {
  try {
    const { role } = req.query; // e.g., /api/announcements?role=alumni

    let query = {};
    if (role) {
      query = {
        $or: [
          { targetAudience: 'all' },
          { targetAudience: role },
          { targetAudience: { $exists: false } }, // Include old posts
        ],
      };
    }

    const announcements = await Announcement.find(query).sort({ date: -1 });
    res.json(announcements);
  } catch (err) {
    console.error('Announcements fetch error:', err);
    res.status(500).send('Failed to fetch announcements');
  }
});

// Admin-only middleware (simple header-based check)
const isAdmin = async (req, res, next) => {
  const adminId = req.headers['admin-id'];
  if (!adminId) return res.status(403).send('Admin access required');

  try {
    const admin = await Admin.findById(adminId);
    if (!admin) return res.status(403).send('Invalid Admin Session');

    // Attach admin info to the request for use in later routes
    req.admin = admin;
    next();
  } catch (err) {
    res.status(500).send('Security check failed');
  }
};

// UPDATED: send permissions too
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const admin = await Admin.findOne({ username });
    if (!admin)
      return res.status(401).json({ message: 'Invalid Admin Credentials' });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch)
      return res.status(401).json({ message: 'Invalid Admin Credentials' });

    res.json({
      _id: admin._id,
      username: admin.username,
      role: admin.role,
      permissions: admin.permissions || [],
    });
  } catch (err) {
    console.error('Admin Login Error:', err);
    res.status(500).send('Server error');
  }
});

// Create Admin
app.post('/api/admin/create-new', async (req, res) => {
  try {
    const { username, password, role, permissions, creatorRole } = req.body;

    if (creatorRole !== 'GodMode') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new Admin({
      username,
      password: hashedPassword,
      role,
      permissions, // Save the array of checked tabs
    });

    await newAdmin.save();
    res.status(201).json({ message: 'New admin created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Post new announcement (Admin only)
app.post('/api/admin/announcement', async (req, res) => {
  try {
    const { title, subject, content, targetAudience } = req.body;
    const newAnn = new Announcement({
      title,
      subject,
      content,
      targetAudience: targetAudience || 'all',
    });
    await newAnn.save();
    res.status(201).send('Posted!');
  } catch (err) {
    console.error('Announcement post error:', err);
    res.status(500).send(err.message);
  }
});

// Delete announcement
app.delete('/api/admin/announcement/:id', async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.send('Announcement Deleted');
  } catch (err) {
    console.error('Announcement delete error:', err);
    res.status(400).send(err.message);
  }
});

// ---------- AUTH / USERS ----------

// Registration (enhanced with verification email + debug logs)
app.post('/api/register', async (req, res) => {
  console.log('--- New Registration Attempt ---');
  console.log('Payload Received:', req.body); // spy on the incoming data

  try {
    const { password, ...userData } = req.body;
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) return res.status(400).send('User already exists');

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
      ...userData,
      password: hashedPassword,
      isVerified: false,
    });

    await newUser.save();

    // Trigger verification email in the background (non-blocking)
    const firstName = userData.name ? userData.name.split(' ')[0] : 'Alumni';

    sendVerificationEmail(newUser.email, firstName).catch((err) => {
      console.error('Background Email Error:', err);
    });

    // Immediately respond to the user
    res.status(201).json({ message: 'Registration successful' });
  } catch (error) {
    console.error('DETAILED ERROR:', error); // exact failing field / validation
    res.status(400).json({ error: error.message });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).send('Invalid email or password');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).send('Invalid email or password');

    const { password: _, ...userProfile } = user._doc;
    res.json(userProfile);
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).send('Server error');
  }
});

// Complete profile
app.patch('/api/profile/complete', async (req, res) => {
  try {
    const {
      userId,
      dob,
      fatherName,
      tenthYear,
      twelfthYear,
      currentAddress,
      permanentAddress,
      hobbiesTechnical,
      hobbiesPersonal,
    } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          dob,
          fatherName,
          tenthYear,
          twelfthYear,
          currentAddress,
          permanentAddress,
          hobbiesTechnical,
          hobbiesPersonal,
          isProfileComplete: true,
        },
      },
      { new: true }
    );

    const { password: _, ...userProfile } = updatedUser._doc;
    res.json(userProfile);
  } catch (err) {
    console.error('Profile complete error:', err);
    res.status(500).send('Failed to update detailed profile');
  }
});

// Update profile
app.patch('/api/profile/update', async (req, res) => {
  try {
    const {
      userId,
      bio,
      linkedin,
      resumeUrl,
      profilePhoto,
      displayName,
      mobile,
      fatherName,
      dob,
      tenthYear,
      twelfthYear,
      currentAddress,
      permanentAddress,
      hobbiesTechnical,
      hobbiesPersonal,
    } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          bio,
          linkedin,
          resumeUrl,
          profilePhoto,
          displayName,
          mobile,
          fatherName,
          dob,
          tenthYear,
          twelfthYear,
          currentAddress,
          permanentAddress,
          hobbiesTechnical,
          hobbiesPersonal,
        },
      },
      { new: true }
    );

    if (!updatedUser) return res.status(404).send('User not found');

    const { password: _, ...userProfile } = updatedUser._doc;
    res.json(userProfile);
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).send('Update failed');
  }
});

// View contact
app.post('/api/view-contact', async (req, res) => {
  const { viewerId, alumniId } = req.body;
  try {
    const alumni = await User.findById(alumniId);
    if (!alumni) return res.status(404).send('Alumni not found');
    res.json({ mobile: alumni.mobile, email: alumni.email });
  } catch (error) {
    console.error('View contact error:', error);
    res.status(500).send('Error fetching details.');
  }
});

// Bookmarks toggle
app.post('/api/bookmarks/toggle', async (req, res) => {
  const { userId, alumniId } = req.body;
  try {
    const user = await User.findById(userId);
    const index = user.bookmarks.indexOf(alumniId);

    if (index === -1) {
      user.bookmarks.push(alumniId);
    } else {
      user.bookmarks.splice(index, 1);
    }
    await user.save();
    res.json(user.bookmarks);
  } catch (err) {
    console.error('Bookmark toggle error:', err);
    res.status(500).send('Error toggling bookmark');
  }
});

// Bookmarks details
app.post('/api/bookmarks/details', async (req, res) => {
  try {
    const { ids } = req.body;
    const alumni = await User.find({ _id: { $in: ids } });
    res.json(alumni);
  } catch (err) {
    console.error('Bookmark details error:', err);
    res.status(500).send('Error fetching details');
  }
});

// Admin user lists (pending/verified for alumni/students)
app.get('/api/admin/:filter/:role', async (req, res) => {
  try {
    const { filter, role } = req.params;
    const isVerified = filter === 'verified';
    const users = await User.find({ role: role, isVerified: isVerified });
    res.json(users);
  } catch (err) {
    console.error('Admin list error:', err);
    res.status(500).send(err.message);
  }
});

// Alumni fetch for map/admin
app.get('/api/get-alumni', async (req, res) => {
  try {
    const alumni = await User.find({ role: 'alumni', isVerified: true });
    res.json(alumni);
  } catch (err) {
    console.error('Alumni fetch error:', err);
    res.status(500).send('Failed to fetch alumni');
  }
});

// ---------- EMAIL / VERIFICATION ----------

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.patch('/api/verify-user/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isVerified: true },
      { new: true }
    );

    const mailOptions = {
      from: '"MBM Alumni Connect" <mrb0tman69420@gmail.com>',
      to: user.email,
      subject: 'Registration Approved! 🎓',
      html: `
        <h3>Welcome, ${user.name}!</h3>
        <p>Your registration for the MBM Alumni Connect portal has been approved by the Admin.</p>
        <p><strong>Login Details:</strong><br>
           Email: ${user.email}<br>
           Password: [The password you set during registration]</p>
        <p>Please log in and complete your profile to access all features.</p>
        <a href="https://alumni-connect-fegi.onrender.com">Login Now</a>
      `,
    };

    transporter.sendMail(mailOptions);
    res.send('User Verified and Email Sent!');
  } catch (err) {
    console.error('Verify user error:', err);
    res.status(400).send(err.message);
  }
});

app.delete('/api/delete-user/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.send('User Deleted!');
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(400).send(err.message);
  }
});

// ---------- STATS ----------

app.get('/api/admin/stats', isAdmin, async (req, res) => {
  try {
    const totalAlumni = await User.countDocuments({
      role: 'alumni',
      isVerified: true,
    });
    const pendingAlumni = await User.countDocuments({
      role: 'alumni',
      isVerified: false,
    });
    const totalStudents = await User.countDocuments({
      role: 'student',
      isVerified: true,
    });
    const pendingStudents = await User.countDocuments({
      role: 'student',
      isVerified: false,
    });

    res.json({
      alumni: { verified: totalAlumni, pending: pendingAlumni },
      students: { verified: totalStudents, pending: pendingStudents },
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).send(err.message);
  }
});

// ---------- SUPPORT & FEEDBACK (CLEANED) ----------

// POST: Public & Registered users both hit this
app.post('/api/support', async (req, res) => {
  try {
    // Frontend sends: { email, name, type, message, isRegistered }
    const { email, name, type, message, isRegistered } = req.body;

    const ticket = new Support({
      senderEmail: email,
      userName: name,
      type: type,
      message: message,
      isRegistered: isRegistered,
    });

    await ticket.save();
    res
      .status(201)
      .json({ message: 'Feedback received successfully' });
  } catch (err) {
    console.error('Support Post Error:', err);
    res.status(500).send('Error saving feedback');
  }
});

// GET: For Admin Dashboard
app.get('/api/admin/support-tickets', async (req, res) => {
  try {
    const tickets = await Support.find().sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    console.error('Support tickets fetch error:', err);
    res.status(500).send('Error fetching tickets');
  }
});

// ---------- TICKERS ----------

// GET all tickers (Public - for the landing page)
app.get('/api/tickers', async (req, res) => {
  try {
    const tickers = await Ticker.find({ isActive: true }).sort({
      priority: -1,
    });
    res.json(tickers);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Update ticker
app.put('/api/admin/tickers/:id', isAdmin, async (req, res) => {
  try {
    const { text, isActive, priority } = req.body;
    const updatedTicker = await Ticker.findByIdAndUpdate(
      req.params.id,
      { text, isActive, priority },
      { new: true }
    );
    if (!updatedTicker) return res.status(404).send('Ticker not found');
    res.json(updatedTicker);
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).send(err.message);
  }
});

// ADMIN: Get all tickers (including inactive ones)
app.get('/api/admin/tickers', isAdmin, async (req, res) => {
  const tickers = await Ticker.find().sort({ createdAt: -1 });
  res.json(tickers);
});

// ADMIN: Create/Update Ticker
app.post('/api/admin/tickers', isAdmin, async (req, res) => {
  const { id, text, isActive, priority } = req.body;
  try {
    if (id) {
      await Ticker.findByIdAndUpdate(id, { text, isActive, priority });
    } else {
      const newTicker = new Ticker({ text, isActive, priority });
      await newTicker.save();
    }
    res.status(200).send('Success');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// ADMIN: Delete Ticker
app.delete('/api/admin/tickers/:id', isAdmin, async (req, res) => {
  await Ticker.findByIdAndDelete(req.params.id);
  res.send('Deleted');
});

// ---------- SECURITY LOGS ----------

app.post('/api/log-interaction', async (req, res) => {
  try {
    const { alumniId, alumniName, studentId, studentName } = req.body;
    const clientIp =
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.socket.remoteAddress;

    const newLog = new SecurityLog({
      studentId,
      studentName,
      alumniId,
      alumniName,
      ipAddress: clientIp,
    });

    await newLog.save();
    res
      .status(200)
      .json({ message: 'Interaction logged successfully' });
  } catch (err) {
    console.error('Log interaction error:', err);
    res.status(500).json({ error: 'Failed to log interaction' });
  }
});

app.get('/api/admin/logs', isAdmin, async (req, res) => {
  try {
    const logs = await SecurityLog.find().sort({ timestamp: -1 });
    const formattedLogs = logs.map((log) => ({
      _id: log._id,
      viewerName: log.studentName || 'Unknown',
      alumniName: log.alumniName,
      ipAddress: log.ipAddress || 'N/A',
      timestamp: log.timestamp,
    }));
    res.json(formattedLogs);
  } catch (err) {
    console.error('Fetch logs error:', err);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Get list of all admins (GodMode Only)
app.get('/api/admin/list', isAdmin, async (req, res) => {
  try {
    const admins = await Admin.find({}, '-password'); // Never send passwords
    res.json(admins);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Delete an admin
app.delete('/api/admin/delete/:id', isAdmin, async (req, res) => {
  try {
    await Admin.findByIdAndDelete(req.params.id);
    res.send('Admin removed');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// ---------- PRODUCTION SERVING ----------

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);