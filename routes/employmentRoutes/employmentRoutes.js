const {
  addNewEmployee,
} = require("../../controllers/employments/EmploymentController");
const { uploadImageFile } = require("../../middlewares/multer/multer");

const router = require("express").Router();

router.post(
  "/employment/new",
  uploadImageFile.single("profilePicture"),
  addNewEmployee
);

module.exports = router;
