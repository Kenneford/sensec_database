const {
  studentOnlineEnrolment,
  approveStudentEnrollment,
} = require("../../controllers/students/StudentController");
const {
  sendEnrollmentEmail,
  studentEnrollmentApprovalSMS,
} = require("../../emails/sendEmail");
const { authUser, authUserRole } = require("../../middlewares/auth/authUser");
const { uploadImageFile } = require("../../middlewares/multer/multer");
const {
  validateStudentPlacementData,
  studentProgramme,
  studentClass,
  updateApprovedStudentData,
} = require("../../middlewares/student/studentMiddleware");

const router = require("express").Router();

router.post(
  "/students/enrolment/online",
  uploadImageFile.single("profilePicture"),
  validateStudentPlacementData,
  studentProgramme,
  studentClass,
  studentOnlineEnrolment
);
router.put(
  "/students/enrolment/:studentId/approve",
  authUser,
  authUserRole({ userRoles: { admin: "admin" } }),
  updateApprovedStudentData,
  sendEnrollmentEmail,
  studentEnrollmentApprovalSMS,
  approveStudentEnrollment
);

module.exports = router;
