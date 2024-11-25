const {
  createStudentGuardian,
} = require("../../controllers/students/GaurdianController");
const {
  createStudentParent,
} = require("../../controllers/students/ParentController");
const {
  promotedStudent,
  promotedMultiStudents,
} = require("../../controllers/students/promotionController");
const {
  studentOnlineEnrolment,
  approveStudentEnrollment,
  approveMultiStudents,
  rejectMultiStudents,
  rejectStudentEnrollment,
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
  updateMultiApprovedStudentData,
  validatePromotionData,
  level100Promotion,
  level200Promotion,
  level300Promotion,
  validateMultiStudentsPromotionData,
  level100MultiStudentsPromotion,
  level200MultiStudentsPromotion,
  level300MultiStudentsPromotion,
} = require("../../middlewares/student/studentMiddleware");

const router = require("express").Router();

// For Enrollment
router.post(
  "/students/enrolment/online",
  uploadImageFile.single("profilePicture"),
  validateStudentPlacementData,
  studentProgramme,
  studentClass,
  studentOnlineEnrolment
);
router.post(
  "/students/:studentId/enrolment/online/parent/add",
  createStudentParent
);
router.post(
  "/students/:studentId/enrolment/online/guardian/add",
  createStudentGuardian
);
// For Enrollment Approval/Rejection
router.put(
  "/students/:studentId/enrolment/approve",
  authUser,
  authUserRole({ userRoles: { admin: "admin" } }),
  updateApprovedStudentData,
  // sendEnrollmentEmail,
  // studentEnrollmentApprovalSMS,
  approveStudentEnrollment
);
router.put(
  "/students/:studentId/enrolment/reject",
  authUser,
  authUserRole({ userRoles: { admin: "admin" } }),
  rejectStudentEnrollment
);
router.put(
  "/students/enrolment/multi_data/approve/all",
  authUser,
  authUserRole({ userRoles: { admin: "admin" } }),
  updateMultiApprovedStudentData,
  // sendEnrollmentEmail,
  // studentEnrollmentApprovalSMS,
  approveMultiStudents
);
router.put(
  "/students/enrolment/multi_data/reject/all",
  authUser,
  authUserRole({ userRoles: { admin: "admin" } }),
  rejectMultiStudents
);

// For Student Promotion
router.put(
  "/students/:studentId/promote",
  authUser,
  authUserRole({ userRoles: { admin: "admin" } }),
  validatePromotionData,
  level100Promotion,
  level200Promotion,
  level300Promotion,
  promotedStudent
);
router.put(
  "/students/multi_data/promote/all",
  authUser,
  authUserRole({ userRoles: { admin: "admin" } }),
  validateMultiStudentsPromotionData,
  level100MultiStudentsPromotion,
  level200MultiStudentsPromotion,
  level300MultiStudentsPromotion,
  promotedMultiStudents
);

module.exports = router;
