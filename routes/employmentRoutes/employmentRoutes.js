const {
  addNewEmployee,
  approveEmployment,
  rejectEmployment,
  approveMultiEmployees,
  rejectMultiEmployees,
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
  "/employment/:employmentApprovedBy/employees/multi_data/approve",
  authUser,
  authUserRole({ userRoles: { admin: "admin" } }),
  approveMultiEmployees
);
router.put(
  "/employment/:employeeId/:employmentRejectedBy/reject",
  authUser,
  authUserRole({ userRoles: { admin: "admin" } }),
  rejectEmployment
);
router.put(
  "/employment/:employmentRejectedBy/employees/multi_data/reject",
  authUser,
  authUserRole({ userRoles: { admin: "admin" } }),
  rejectMultiEmployees
);

module.exports = router;
