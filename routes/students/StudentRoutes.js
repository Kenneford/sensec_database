const {
  studentOnlineEnrolment,
} = require("../../controllers/students/StudentController");

const router = require("express").Router();

router.post("/enrolment/online", studentOnlineEnrolment);

module.exports = router;
