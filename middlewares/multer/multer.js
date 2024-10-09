const multer = require("multer");
const { studentsImageStorage } = require("../cloudinary/cloudinary");

// Configure Multer For Image Files Upload
const uploadImageFile = multer();
// const uploadImageFile = multer({ storage: studentsImageStorage });

// Configure Multer For Excel Files Upload
const uploadExcelFile = multer();

module.exports = { uploadImageFile, uploadExcelFile };
