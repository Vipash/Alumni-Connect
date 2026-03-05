const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Alumni = require('./Alumni'); 
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// DATABASE CONNECTION (Use environment variable for security)
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://AlumniAdmin:12345@cluster0.ajb1ovb.mongodb.net/alumni_db?appName=Cluster0';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully!'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// API ROUTES
app.get('/api/get-alumni', async (req, res) => {
  try {
    const verifiedAlumni = await Alumni.find({ isVerified: true });
    res.json(verifiedAlumni);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/add-alumni', async (req, res) => {
  try {
    const newAlumni = new Alumni({
      name: req.body.name,
      company: req.body.company,
      isVerified: false,
      location: {
        type: "Point",
        coordinates: [parseFloat(req.body.location.coordinates[0]), parseFloat(req.body.location.coordinates[1])]
      }
    });
    await newAlumni.save();
    res.status(201).send("Registered Successfully!");
  } catch (error) {
    res.status(400).send(error.message);
  }
});

app.get('/api/get-pending', async (req, res) => {
  try {
    const pending = await Alumni.find({ isVerified: false });
    res.json(pending);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.patch('/api/approve-alumni/:id', async (req, res) => {
  try {
    await Alumni.findByIdAndUpdate(req.params.id, { isVerified: true });
    res.send("Alumnus Approved!");
  } catch (error) {
    res.status(400).send(error.message);
  }
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  app.get('*', (req, res) => res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html')));
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
