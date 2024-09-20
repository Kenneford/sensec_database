const {
  createSubject,
  deleteSubject,
  updateSubject,
  getAllSubjects,
  getSingleSubject,
  getAllProgramElectiveSubjects,
  getAllProgramOptionalElectiveSubjects,
} = require("../../../controllers/academics/subjects/subjectController");
const {
  authUser,
  authUserRole,
} = require("../../../middlewares/auth/authUser");

const router = require("express").Router();

router.post(
  "/academics/subjects/add",
  authUser,
  authUserRole({
    userRoles: {
      admin: "admin",
    },
  }),
  createSubject
);
router.get(
  "/academics/subjects/fetch_all",
  authUser,
  authUserRole({
    userRoles: {
      admin: "admin",
    },
  }),
  getAllSubjects
);
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
      admin: "admin",
    },
  }),
  getAllProgramElectiveSubjects
);
router.get(
  "/academics/subjects/electives/optional/program/:programId/fetch_all",
  authUser,
  authUserRole({
    userRoles: {
      admin: "admin",
    },
  }),
  getAllProgramOptionalElectiveSubjects
);
router.put(
  "/academics/subjects/:subjectId/update",
  authUser,
  authUserRole({
    userRoles: {
      admin: "admin",
    },
  }),
  updateSubject
);
router.delete(
  "/academics/subjects/:subjectId/delete",
  authUser,
  authUserRole({
    userRoles: {
      admin: "admin",
    },
  }),
  deleteSubject
);

module.exports = router;
