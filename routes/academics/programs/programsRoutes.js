const router = require("express").Router();

const {
  createProgram,
  getAllPrograms,
  getSingleProgram,
  updateProgram,
  deleteProgram,
  getAllFlattenedProgrammes,
} = require("../../../controllers/academics/programmes/programController");
const {
  createDivisionProgram,
  getAllDivisionPrograms,
  getSingleDivisionProgram,
  updateDivisionProgram,
  deleteDivisionProgram,
  getAllCreatedDivisionPrograms,
} = require("../../../controllers/academics/programmes/programDivisionController");
const {
  authUser,
  authUserRole,
} = require("../../../middlewares/auth/authUser");

// Programmes
router.post(
  "/academics/programme/create",
  authUser,
  authUserRole({
    userRole: {
      admin: "Admin",
    },
  }),
  createProgram
);
router.get("/academics/programmes/fetch_all", getAllPrograms);
router.get(
  "/academics/programmes_and_divisions/fetch_all",
  getAllFlattenedProgrammes
);
router.get("/academics/programs/:programId/fetch", getSingleProgram);
router.put(
  "/academics/programs/:programId/update",
  authUser,
  authUserRole({
    userRole: {
      admin: "Admin",
    },
  }),
  updateProgram
);
router.delete(
  "/academics/programs/:programId/delete",
  authUser,
  authUserRole({
    userRole: {
      admin: "Admin",
    },
  }),
  deleteProgram
);

// Division programmes
router.post(
  "/academics/program/division/create",
  authUser,
  authUserRole({
    userRoles: {
      admin: "Admin",
    },
  }),
  createDivisionProgram
);
router.get(
  "/academics/programs/:programId/divisions/fetch_all",
  getAllDivisionPrograms
);
router.get(
  "/academics/programs/divisions/fetch_all",
  getAllCreatedDivisionPrograms
);
router.get(
  "/academics/programs/:programId/divisions/fetch",
  getSingleDivisionProgram
);
router.put(
  "/academics/programs/:programId/divisions/update",
  authUser,
  authUserRole({
    userRole: {
      admin: "Admin",
    },
  }),
  updateDivisionProgram
);
router.delete(
  "/academics/programs/:programId/divisions/delete",
  authUser,
  authUserRole({
    userRole: {
      admin: "Admin",
    },
  }),
  deleteDivisionProgram
);

module.exports = router;
