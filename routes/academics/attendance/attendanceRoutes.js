const {
  createClassAttendance,
  // getStudentAttendance,
  getCurrentClassAttendance,
  getStudentsAttendance,
  singleStudentAttendances,
  getAllClassAttendances,
  getStudentWeeklyClassAttendance,
  searchClassAttendance,
  createWeekendAttendance,
  getWeeklyClassAttendance,
} = require("../../../controllers/academics/attendance/AttendanceController");
const {
  authUser,
  authUserRole,
} = require("../../../middlewares/auth/authUser");

const router = require("express").Router();

router.post(
  "/academics/attendance/create",
  authUser,
  authUserRole({
    userRoles: {
      lecturer: "Lecturer",
    },
  }),
  createClassAttendance
);
router.post("/academics/attendance/weekend/create", createWeekendAttendance);
router.get(
  "/academics/class_attendance/current/fetch",
  authUser,
  authUserRole({
    userRoles: {
      lecturer: "Lecturer",
    },
  }),
  getCurrentClassAttendance
);
router.get(
  "/academics/students/class_attendance/fetch_all",
  getAllClassAttendances
);
router.get("/academics/students/attendance/fetch_all", getStudentsAttendance);
router.get(
  "/academics/:uniqueId/attendance/fetch_all",
  singleStudentAttendances
);
router.get(
  "/academics/:uniqueId/weekly_attendance/fetch_all",
  getStudentWeeklyClassAttendance
);
router.get(
  "/academics/weekly_attendance/fetch_all",
  authUser,
  authUserRole({
    userRoles: {
      lecturer: "Lecturer",
    },
  }),
  getWeeklyClassAttendance
);
router.put(
  "/academics/class_attendance/search",
  authUser,
  authUserRole({
    userRoles: {
      lecturer: "Lecturer",
    },
  }),
  searchClassAttendance
);

module.exports = router;
