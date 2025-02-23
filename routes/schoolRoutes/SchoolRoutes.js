const {
  addSchoolData,
  fetchSchoolData,
} = require("../../controllers/schoolDataController/SchoolAboutDataController");
const { authUserRole, authUser } = require("../../middlewares/auth/authUser");
const { uploadImageFile } = require("../../middlewares/multer/multer");

const router = require("express").Router();

router.post(
  "/school_data/add",
  uploadImageFile.single("schoolLogo"),
  authUser,
  authUserRole({ userRoles: { admin: "Admin" } }),
  addSchoolData
);
router.get("/school_data/fetch", fetchSchoolData);
module.exports = router;
