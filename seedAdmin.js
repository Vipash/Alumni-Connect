const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// 1. Manually define the schema here to avoid path issues
const adminSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['Moderator', 'Admin', 'GodMode'], default: 'Admin' }
});
const Admin = mongoose.model('Admin', adminSchema);

// 2. Use your exact connection string
const MONGO_URI = 'mongodb+srv://AlumniAdmin:12345@cluster0.ajb1ovb.mongodb.net/alumni_db?appName=Cluster0';

async function createAdmin() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected!");

        const hashedPassword = await bcrypt.hash('admin0', 10);
        
        // Check if it already exists
        const exists = await Admin.findOne({ username: 'admin0' });
        if (exists) {
            console.log("Admin 'admin0' already exists. Updating password...");
            exists.password = hashedPassword;
            await exists.save();
        } else {
            const newAdmin = new Admin({
                username: 'admin0',
                password: hashedPassword,
                role: 'GodMode'
            });
            await newAdmin.save();
            console.log("✅ GodMode Admin 'admin0' created successfully!");
        }
    } catch (err) {
        console.error("❌ Error:", err);
    } finally {
        mongoose.connection.close();
        process.exit();
    }
}

createAdmin();