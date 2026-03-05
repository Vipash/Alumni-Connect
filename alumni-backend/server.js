const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Alumni = require('./Alumni'); 

const app = express();
app.use(cors());
app.use(express.json());

// 1. DATABASE CONNECTION
mongoose.connect('mongodb+srv://AlumniAdmin:12345@cluster0.ajb1ovb.mongodb.net/alumni_db?appName=Cluster0')
  .then(() => console.log('✅ MongoDB Connected Successfully!'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// 2. GET ROUTE: Fetches verified alumni for the Map
app.get('/get-alumni', async (req, res) => {
  try {
    const verifiedAlumni = await Alumni.find({ isVerified: true });
    res.json(verifiedAlumni);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 3. POST ROUTE: Register new alumni
app.post('/add-alumni', async (req, res) => {
  try {
    console.log("Receiving data for:", req.body.name);

    // Standard Mongoose way (Much more reliable than .collection.insertOne)
    const newAlumni = new Alumni({
      name: req.body.name,
      company: req.body.company,
      isVerified: false,
      location: {
        type: "Point",
        coordinates: [
          parseFloat(req.body.location.coordinates[0]), 
          parseFloat(req.body.location.coordinates[1])
        ]
      }
    });

    await newAlumni.save();
    
    console.log("✅ Successfully saved:", newAlumni.name);
    res.status(201).send("Registered Successfully! Waiting for Admin Approval.");
  } catch (error) {
    console.error("❌ Database Error:", error);
    res.status(400).send(error.message);
  }
});

// 4. ADMIN ROUTE: Get all UNVERIFIED alumni
app.get('/get-pending', async (req, res) => {
  try {
    // Adding .lean() helps ensure you get plain JS objects that React loves
    const pending = await Alumni.find({ isVerified: false }).lean();
    console.log("Pending count:", pending.length);
    res.json(pending);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// 5. ADMIN ROUTE: Approve an alumnus
app.patch('/approve-alumni/:id', async (req, res) => {
  try {
    await Alumni.findByIdAndUpdate(req.params.id, { isVerified: true });
    console.log(`✅ Alumnus ${req.params.id} approved!`);
    res.send("Alumnus Approved!");
  } catch (error) {
    res.status(400).send(error.message);
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
