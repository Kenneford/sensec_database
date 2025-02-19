const {
  createGrade,
} = require("../../../controllers/academics/reports/GradeController");
const {
  createStudentReport,
  saveDraftReports,
  fetchElectiveDraftReport,
  fetchAllReports,
  fetchAllStudentReports,
  createMultiStudentsReports,
  fetchReportStudents,
  fetchCoreDraftReport,
  fetchSubjectMultiStudentsReport,
  searchClassReport,
  fetchSingleStudentReports,
} = require("../../../controllers/academics/reports/StudentReportController");
const {
  multiElectiveReport,
  multiCoreReport,
  fetchMultiElectiveReport,
  fetchMultiCoreReport,
} = require("../../../middlewares/academics/reportMiddleware");
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
  multiElectiveReport,
  multiCoreReport,
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
  "/academics/student_report/draft/elective/fetch",
  authUser,
  authUserRole({
    userRoles: {
      lecturer: "Lecturer",
    },
  }),
  fetchElectiveDraftReport
);
router.post(
  "/academics/student_report/draft/core/fetch",
  authUser,
  authUserRole({
    userRoles: {
      lecturer: "Lecturer",
    },
  }),
  fetchCoreDraftReport
);
router.get(
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
router.get(
  "/academics/report/students/fetch_all",
  authUser,
  authUserRole({
    userRoles: {
      lecturer: "Lecturer",
    },
  }),
  fetchReportStudents
);
router.put(
  "/academics/report/elective_subject/multi_students/fetch_all",
  authUser,
  authUserRole({
    userRoles: {
      lecturer: "Lecturer",
    },
  }),
  fetchMultiElectiveReport,
  // fetchMultiCoreReport,
  fetchSubjectMultiStudentsReport
);
router.put(
  "/academics/report/core_subject/multi_students/fetch_all",
  authUser,
  authUserRole({
    userRoles: {
      lecturer: "Lecturer",
    },
  }),
  // fetchMultiElectiveReport,
  fetchMultiCoreReport,
  fetchSubjectMultiStudentsReport
);
router.put(
  "/academics/class_report/search",
  authUser,
  authUserRole({
    userRoles: {
      lecturer: "Lecturer",
      admin: "Admin",
    },
  }),
  searchClassReport
);
router.get(
  "/academics/student/:studentId/report/search",
  authUser,
  authUserRole({
    userRoles: {
      lecturer: "Lecturer",
      admin: "Admin",
      student: "Student",
    },
  }),
  fetchSingleStudentReports
);

module.exports = router;
