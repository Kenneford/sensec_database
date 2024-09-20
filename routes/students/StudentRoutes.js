const {
  studentOnlineEnrolment,
} = require("../../controllers/students/StudentController");

const router = require("express").Router();

router.post("/students/enrolment/online", studentOnlineEnrolment);

module.exports = router;
