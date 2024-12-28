const {
  fetchAllPlacementBatches,
} = require("../../controllers/placementController/PlacementBatchController");
const {
  verifyPlacementStudent,
  fetchAllVerifiedPlacementStudents,
  fetchAllPlacementStudents,
  fetchSinglePlacementStudent,
  studentCheckPlacement,
  uploadPlacementFile,
  updatePlacementData,
} = require("../../controllers/placementController/StudentPlacementController");
const { authUser, authUserRole } = require("../../middlewares/auth/authUser");
const { uploadExcelFile } = require("../../middlewares/multer/multer");

const router = require("express").Router();

router.post(
  "/students/placement/excel_file/upload",
  uploadExcelFile.single("placementExcelFile"),
  authUser,
  authUserRole({ userRoles: { admin: "admin" } }),
  uploadPlacementFile
);
router.put("/students/:studentIndexNo/placement/update", updatePlacementData);
router.get(
  "/students/:studentIndexNo/placement/:yearGraduated/check",
  studentCheckPlacement
);
router.put("/students/placement/verify", verifyPlacementStudent);
router.get("/students/placement/fetch_all", fetchAllPlacementStudents);
router.get(
  "/students/placement/:studentIndexNo/fetch",
  fetchSinglePlacementStudent
);
router.get(
  "/students/placement/verified/fetch_all",
  fetchAllVerifiedPlacementStudents
);
router.get("/students/placement/verified/fetch_all", fetchAllPlacementBatches);

module.exports = router;
