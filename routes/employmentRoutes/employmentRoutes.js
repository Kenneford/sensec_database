const {
  addNewEmployee,
  approveEmployment,
  rejectEmployment,
  approveMultiEmployees,
  rejectMultiEmployees,
  employeeSchoolDataUpdate,
} = require("../../controllers/employments/EmploymentController");
const {
  studentPersonalDataUpdate,
} = require("../../controllers/students/StudentController");
const {
  userPersonalDataUpdate,
} = require("../../controllers/users/userController");
const {
  authUser,
  authUserRole,
  updateUserProfileImage,
} = require("../../middlewares/auth/authUser");
const { uploadImageFile } = require("../../middlewares/multer/multer");
const {
  updateStudentsProfileImage,
} = require("../../middlewares/student/studentMiddleware");

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
// Update employees's personal data
router.put(
  "/employment/:userId/personal_data/update",
  uploadImageFile.single("profilePicture"),
  authUser,
  updateUserProfileImage,
  userPersonalDataUpdate
);
// Update employees's school data
router.put(
  "/employment/:employeeId/school_data/update",
  employeeSchoolDataUpdate
);

module.exports = router;
