const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const path = require('path');
const Announcement = require('./Announcement');
const SecurityLog = require('./SecurityLog');
const noticeRoutes = require('./noticeRoutes');
const connectionRoutes = require('./connectionRoutes');
const notificationRoutes = require('./notificationRoutes');
const Admin = require('./Admin');
const User = require('./alumni'); 
const app = express();
const router = express.Router();
app.use(cors());
app.use(express.json());
app.use('/api/notices', noticeRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/notifications', notificationRoutes);

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://AlumniAdmin:12345@cluster0.ajb1ovb.mongodb.net/alumni_db?appName=Cluster0';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully!'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Get all announcements
app.get('/api/announcements', async (req, res) => {
  const { role } = req.query; // e.g., /api/announcements?role=alumni
  
  let query = {};
  if (role) {
    // If targetAudience is missing, treat as 'all' OR filter by role
    query = { 
      $or: [
        { targetAudience: 'all' },
        { targetAudience: role },
        { targetAudience: { $exists: false } } // Include old posts
      ] 
    };
  }
  
  const announcements = await Announcement.find(query).sort({ date: -1 });
  res.json(announcements);
});

const isAdmin = async (req, res, next) => {
  // In a real app, you'd use JWT. For now, check a header or role
  const adminId = req.headers['admin-id']; 
  if (!adminId) return res.status(403).send("Admin access required");
  next();
};

app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body; // App.jsx sends {username, password}
  try {
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(401).json({ message: "Invalid Admin Credentials" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid Admin Credentials" });

    // Send back the info needed for the dashboard (role is key!)
    res.json({ 
      username: admin.username, 
      role: admin.role,
      _id: admin._id 
    });
  } catch (err) {
    console.error("Admin Login Error:", err);
    res.status(500).send("Server error");
  }
});

app.post('/api/admin/create-new', async (req, res) => {
  // If you haven't set up JWT/verifyToken yet, you can temporarily 
  // bypass the middleware to test the creation from your frontend.
  try {
    const { username, password, role, creatorRole } = req.body;

    // Only GodMode can create other admins
    if (creatorRole !== 'GodMode') {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new Admin({ username, password: hashedPassword, role });
    await newAdmin.save();
    
    res.status(201).json({ message: "New admin created successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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

app.patch('/api/profile/complete', async (req, res) => {
  try {
    const { 
      userId, dob, fatherName, tenthYear, twelfthYear, 
      currentAddress, permanentAddress, hobbiesTechnical, hobbiesPersonal 
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
          isProfileComplete: true // Auto-unlock the site on successful save
        }
      },
      { new: true }
    );

    const { password: _, ...userProfile } = updatedUser._doc;
    res.json(userProfile);
  } catch (err) {
    res.status(500).send("Failed to update detailed profile");
  }
});

app.patch('/api/profile/update', async (req, res) => {
  try {
    const { 
      userId, bio, linkedin, resumeUrl, profilePhoto, displayName, mobile,
      fatherName, dob, tenthYear, twelfthYear, currentAddress, 
      permanentAddress, hobbiesTechnical, hobbiesPersonal 
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
          hobbiesPersonal
        } 
      },
      { new: true }
    );
    
    if (!updatedUser) return res.status(404).send("User not found");

    const { password: _, ...userProfile } = updatedUser._doc;
    res.json(userProfile);
    
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).send("Update failed");
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
    res.status(500).send("Error toggling bookmark");
  }
});
app.post('/api/bookmarks/details', async (req, res) => {
  try {
    const { ids } = req.body;
    const alumni = await User.find({ _id: { $in: ids } });
    res.json(alumni);
  } catch (err) {
    res.status(500).send("Error fetching details");
  }
});

app.get('/api/admin/:filter/:role', async (req, res) => {
  try {
    const { filter, role } = req.params;
    
    // Convert 'verified' to true, 'pending' to false
    const isVerified = filter === 'verified';
    
    const users = await User.find({ role: role, isVerified: isVerified });
    res.json(users);
  } catch (err) { 
    res.status(500).send(err.message); 
  }
});

// Alumni Fetch - OPENED FOR ADMIN/MAP
app.get('/api/get-alumni', async (req, res) => {
  try {
    const alumni = await User.find({ role: 'alumni', isVerified: true });
    res.json(alumni);
  } catch (err) { res.status(500).send("Failed to fetch alumni"); }
});

// Verification and Mail/Deletion
const nodemailer = require('nodemailer');

// Setup your Email Transporter (Use environment variables for credentials!)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS 
  }
});

app.patch('/api/verify-user/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isVerified: true }, { new: true });
    
    // Send Approval Email
    const mailOptions = {
      from: '"MBM Alumni Connect" <your-email@gmail.com>',
      to: user.email,
      subject: "Registration Approved! 🎓",
      html: `
        <h3>Welcome, ${user.name}!</h3>
        <p>Your registration for the MBM Alumni Connect portal has been approved by the Admin.</p>
        <p><strong>Login Details:</strong><br>
           Email: ${user.email}<br>
           Password: [The password you set during registration]</p>
        <p>Please log in and complete your profile to access all features.</p>
        <a href="https://your-site-link.com">Login Now</a>
      `
    };

    transporter.sendMail(mailOptions);
    res.send("User Verified and Email Sent!");
  } catch (err) { res.status(400).send(err.message); }
});

app.delete('/api/delete-user/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.send("User Deleted!");
  } catch (err) { res.status(400).send(err.message); }
});

// stats
app.get('/api/admin/stats', isAdmin, async (req, res) => {
  try {
    const totalAlumni = await User.countDocuments({ role: 'alumni', isVerified: true });
    const pendingAlumni = await User.countDocuments({ role: 'alumni', isVerified: false });
    const totalStudents = await User.countDocuments({ role: 'student', isVerified: true });
    const pendingStudents = await User.countDocuments({ role: 'student', isVerified: false });

    res.json({
      alumni: { verified: totalAlumni, pending: pendingAlumni },
      students: { verified: totalStudents, pending: pendingStudents }
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

const Support = require('./models/Support'); // Path to the schema above

// 1. POST route to save the feedback
app.post('/api/support', async (req, res) => {
  try {
    const newSupport = new Support(req.body);
    await newSupport.save();
    res.status(201).send({ message: "Success" });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// 2. GET route for the Admin to see all feedback
app.get('/api/admin/support', async (req, res) => {
  try {
    const tickets = await Support.find().sort({ timestamp: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Security Logs
app.post('/api/log-interaction', async (req, res) => {
  try {
    const { alumniId, alumniName, studentId, studentName } = req.body;
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
    
    const newLog = new SecurityLog({
      studentId,
      studentName,
      alumniId,
      alumniName,
      ipAddress: clientIp
    });

    await newLog.save();
    res.status(200).json({ message: "Interaction logged successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to log interaction" });
  }
});

app.get('/api/admin/logs', isAdmin, async (req, res) => {
  try {
    const logs = await SecurityLog.find().sort({ timestamp: -1 });
    const formattedLogs = logs.map(log => ({
      _id: log._id,
      viewerName: log.studentName || "Unknown",
      alumniName: log.alumniName,
      ipAddress: log.ipAddress || "N/A",
      timestamp: log.timestamp
    }));
    res.json(formattedLogs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch logs" });
  }
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