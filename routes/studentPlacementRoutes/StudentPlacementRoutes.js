const {
  verifyPlacementStudent,
  fetchAllVerifiedPlacementStudents,
  fetchAllPlacementStudents,
  fetchSinglePlacementStudent,
  studentCheckPlacement,
  uploadPlacementFile,
} = require("../../controllers/placementController/StudentPlacementController");
const { authUser, authUserRole } = require("../../middlewares/auth/authUser");
const { uploadExcelFile } = require("../../middlewares/multer/multer");

const router = require("express").Router();

router.post(
  "/placement/file/upload",
  uploadExcelFile.single("placementExcelFile"),
  authUser,
  authUserRole({ userRoles: { admin: "admin" } }),
  uploadPlacementFile
);
router.post("/placement/check", studentCheckPlacement);
router.post("/placement/verify", verifyPlacementStudent);
router.get("/placement/fetch_all", fetchAllPlacementStudents);
router.get("/placement/:studentId/fetch", fetchSinglePlacementStudent);
router.get("/placement/verified/fetch_all", fetchAllVerifiedPlacementStudents);

module.exports = router;
