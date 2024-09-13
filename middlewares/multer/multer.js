const multer = require("multer");

// Configure Multer For Image Files Upload
const uploadImageFile = multer();

// Configure Multer For Excel Files Upload
const uploadExcelFile = multer();

module.exports = { uploadImageFile, uploadExcelFile };
