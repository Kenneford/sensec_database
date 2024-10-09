const dotenv = require("dotenv");
const cloudinaryModule = require("cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

dotenv.config();
const cloudinary = cloudinaryModule.v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary storage setup
const studentsImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "usersImages", // Folder name in Cloudinary
    format: async (req, file) => "jpg", // Format to store images
    public_id: (req, file) => Date.now(), // Unique ID for each image
  },
});

module.exports = { cloudinary, studentsImageStorage };
