const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary with your credentials
// Replace these with your actual keys or use process.env
cloudinary.config({
  cloud_name: 'duoofmsri', 
  api_key: 'YOUR_API_KEY',
  api_secret: 'YOUR_API_SECRET'
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'magazine_uploads',
      resource_type: file.mimetype === 'application/pdf' ? 'raw' : 'image',
      public_id: file.originalname.split('.')[0] + "_" + Date.now(),
    };
  },
});

const upload = multer({ storage: storage });
module.exports = upload;