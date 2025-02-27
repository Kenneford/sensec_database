const {
  createStudentGuardian,
} = require("../../controllers/students/GuardianController");
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
  studentPersonalDataUpdate,
  studentSchoolDataUpdate,
} = require("../../controllers/students/StudentController");
const {
  userPersonalDataUpdate,
} = require("../../controllers/users/userController");
const {
  sendEnrollmentEmail,
  studentEnrollmentApprovalSMS,
} = require("../../emails/sendEmail");
const {
  authUser,
  authUserRole,
  updateUserProfileImage,
} = require("../../middlewares/auth/authUser");
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
  updateStudentsProfileImage,
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
// Update student's personal data
router.put(
  "/students/:userId/personal_data/update",
  uploadImageFile.single("profilePicture"),
  updateUserProfileImage,
  userPersonalDataUpdate
);
// Update student's school data
router.put("/students/:studentId/school_data/update", studentSchoolDataUpdate);
// For Enrollment Approval/Rejection
router.put(
  "/students/:studentId/enrolment/approve",
  authUser,
  authUserRole({ userRoles: { admin: "Admin" } }),
  updateApprovedStudentData,
  // sendEnrollmentEmail,
  // studentEnrollmentApprovalSMS,
  approveStudentEnrollment
);
router.put(
  "/students/:studentId/enrolment/reject",
  authUser,
  authUserRole({ userRoles: { admin: "Admin" } }),
  rejectStudentEnrollment
);
router.put(
  "/students/enrolment/multi_data/approve/all",
  authUser,
  authUserRole({ userRoles: { admin: "Admin" } }),
  updateMultiApprovedStudentData,
  // sendEnrollmentEmail,
  // studentEnrollmentApprovalSMS,
  approveMultiStudents
);
router.put(
  "/students/enrolment/multi_data/reject/all",
  authUser,
  authUserRole({ userRoles: { admin: "Admin" } }),
  rejectMultiStudents
);

// For Student Promotion
router.put(
  "/students/:studentId/promote",
  authUser,
  authUserRole({ userRoles: { admin: "Admin" } }),
  validatePromotionData,
  level100Promotion,
  level200Promotion,
  level300Promotion,
  promotedStudent
);
router.put(
  "/students/multi_data/promote/all",
  authUser,
  authUserRole({ userRoles: { admin: "Admin" } }),
  validateMultiStudentsPromotionData,
  level100MultiStudentsPromotion,
  level200MultiStudentsPromotion,
  level300MultiStudentsPromotion,
  promotedMultiStudents
);

module.exports = router;
