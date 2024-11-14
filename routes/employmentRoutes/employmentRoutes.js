const {
  addNewEmployee,
  approveEmployment,
  rejectEmployment,
} = require("../../controllers/employments/EmploymentController");
const { authUser, authUserRole } = require("../../middlewares/auth/authUser");
const { uploadImageFile } = require("../../middlewares/multer/multer");

const router = require("express").Router();

router.post(
  "/employment/new",
  uploadImageFile.single("profilePicture"),
  addNewEmployee
);
router.put(
  "/employment/:employeeId/:employmentApprovedBy/approve",
  authUser,
  authUserRole({ userRoles: { admin: "admin" } }),
  approveEmployment
);
router.put(
  "/employment/:employeeId/:employmentRejectedBy/reject",
  authUser,
  authUserRole({ userRoles: { admin: "admin" } }),
  rejectEmployment
);

module.exports = router;
