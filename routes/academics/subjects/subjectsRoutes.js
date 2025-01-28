const {
  createSubject,
  deleteSubject,
  updateSubject,
  getAllSubjects,
  getSingleSubject,
  getAllProgramElectiveSubjects,
  getAllProgramOptionalElectiveSubjects,
  assignSubjectLecturer,
  removeSubjectLecturer,
  getAllSubjectLecturers,
} = require("../../../controllers/academics/subjects/subjectController");
const {
  validateSubjectData,
  coreSubject,
  programmeElectiveSubject,
  divisionProgrammeElectiveSubject,
  assignElectiveSubject,
  assignCoreSubject,
  removeElectiveSubject,
  subjectLecturers,
} = require("../../../middlewares/academics/subjectMiddleware");
const {
  authUser,
  authUserRole,
} = require("../../../middlewares/auth/authUser");

const router = require("express").Router();

router.post(
  "/academics/subjects/core/create",
  authUser,
  authUserRole({
    userRoles: {
      admin: "Admin",
    },
  }),
  validateSubjectData,
  coreSubject,
  createSubject
);
router.post(
  "/academics/subjects/elective/create",
  authUser,
  authUserRole({
    userRoles: {
      admin: "Admin",
    },
  }),
  validateSubjectData,
  programmeElectiveSubject,
  divisionProgrammeElectiveSubject,
  createSubject
);
router.get("/academics/subjects/fetch_all", getAllSubjects);
router.get(
  "/academics/subjects/:subjectId/fetch",
  authUser,
  authUserRole({
    userRoles: {
      admin: "admin",
    },
  }),
  getSingleSubject
);
router.get(
  "/academics/subjects/electives/program/:programId/fetch_all",
  authUser,
  authUserRole({
    userRoles: {
      admin: "Admin",
    },
  }),
  getAllProgramElectiveSubjects
);
router.get(
  "/academics/subjects/electives/optional/program/:programId/fetch_all",
  authUser,
  authUserRole({
    userRoles: {
      admin: "Admin",
    },
  }),
  getAllProgramOptionalElectiveSubjects
);
router.get(
  "/academics/subjects/:subjectId/lecturers/fetch_all",
  authUser,
  authUserRole({
    userRoles: {
      admin: "Admin",
    },
  }),
  subjectLecturers,
  getAllSubjectLecturers
);
router.put(
  "/academics/subjects/:subjectId/update",
  authUser,
  authUserRole({
    userRoles: {
      admin: "Admin",
    },
  }),
  updateSubject
);
router.put(
  "/academics/subjects/:subjectId/assign_lecturer",
  authUser,
  authUserRole({
    userRoles: {
      admin: "Admin",
    },
  }),
  assignElectiveSubject,
  assignCoreSubject,
  assignSubjectLecturer
);
router.put(
  "/academics/subjects/:subjectId/remove_lecturer",
  authUser,
  authUserRole({
    userRoles: {
      admin: "Admin",
    },
  }),
  removeElectiveSubject,
  removeSubjectLecturer
);
router.delete(
  "/academics/subjects/:subjectId/delete",
  authUser,
  authUserRole({
    userRoles: {
      admin: "Admin",
    },
  }),
  deleteSubject
);

module.exports = router;
