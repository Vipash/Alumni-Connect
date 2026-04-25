const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Use process.env to keep keys safe and flexible
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'duoofmsri', 
  api_key: process.env.CLOUDINARY_API_KEY || 'YOUR_API_KEY',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'YOUR_API_SECRET'
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Determine if it's a PDF
    const isPdf = file.mimetype === 'application/pdf';
    
    return {
      folder: 'magazine_uploads',
      // 'auto' is safer; it lets Cloudinary decide based on the file stream
      resource_type: 'auto', 
      // Only set public_id for images; let Cloudinary handle the raw file names for PDFs
      public_id: isPdf ? undefined : file.originalname.split('.')[0] + "_" + Date.now(),
    };
  },
});

const upload = multer({ storage: storage });
module.exports = upload;