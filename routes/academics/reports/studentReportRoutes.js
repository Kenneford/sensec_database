const {
  createGrade,
} = require("../../../controllers/academics/reports/GradeController");
const {
  createStudentReport,
  saveDraftReports,
  fetchDraftReport,
  fetchAllReports,
  fetchAllStudentReports,
  createMultiStudentsReports,
} = require("../../../controllers/academics/reports/StudentReportController");
const {
  authUser,
  authUserRole,
} = require("../../../middlewares/auth/authUser");

const router = require("express").Router();

router.post(
  "/academics/grades/create",
  authUser,
  authUserRole({
    userRoles: {
      admin: "Admin",
    },
  }),
  createGrade
);
router.post(
  "/academics/student_report/:studentId/create",
  authUser,
  authUserRole({
    userRoles: {
      lecturer: "Lecturer",
    },
  }),
  createStudentReport
);
router.post(
  "/academics/reports/multi_students/create",
  authUser,
  authUserRole({
    userRoles: {
      lecturer: "Lecturer",
    },
  }),
  createMultiStudentsReports
);
router.post(
  "/academics/student_report/draft/save",
  authUser,
  authUserRole({
    userRoles: {
      lecturer: "Lecturer",
    },
  }),
  saveDraftReports
);
router.post(
  "/academics/student_report/draft/fetch",
  authUser,
  authUserRole({
    userRoles: {
      lecturer: "Lecturer",
    },
  }),
  fetchDraftReport
);
router.post(
  "/academics/student_report/fetch_all",
  authUser,
  authUserRole({
    userRoles: {
      admin: "Admin",
      lecturer: "Lecturer",
      student: "Headmaster",
    },
  }),
  fetchAllReports
);
router.post(
  "/academics/reports/all_student/fetch_all",
  authUser,
  authUserRole({
    userRoles: {
      admin: "Admin",
      lecturer: "Lecturer",
      student: "Student",
    },
  }),
  fetchAllStudentReports
);

module.exports = router;
