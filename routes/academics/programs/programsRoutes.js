const router = require("express").Router();

const {
  createProgram,
  getAllPrograms,
  getSingleProgram,
  updateProgram,
  deleteProgram,
} = require("../../../controllers/academics/programmes/programController");
const {
  createDivisionProgram,
  getAllDivisionPrograms,
  getSingleDivisionProgram,
  updateDivisionProgram,
  deleteDivisionProgram,
} = require("../../../controllers/academics/programmes/programDivisionController");
const {
  authUser,
  authUserRole,
} = require("../../../middlewares/auth/authUser");

// Programmes
router.post(
  "/academics/program/create",
  authUser,
  authUserRole({
    userRole: {
      admin: "admin",
    },
  }),
  createProgram
);
router.get("/academics/programs/fetch_all", getAllPrograms);
router.get("/academics/programs/:programId/fetch", getSingleProgram);
router.put(
  "/academics/programs/:programId/update",
  authUser,
  authUserRole({
    userRole: {
      admin: "admin",
    },
  }),
  updateProgram
);
router.delete(
  "/academics/programs/:programId/delete",
  authUser,
  authUserRole({
    userRole: {
      admin: "admin",
    },
  }),
  deleteProgram
);

// Division programmes
router.post(
  "/academics/program/division/create",
  authUser,
  authUserRole({
    userRole: {
      admin: "admin",
    },
  }),
  createDivisionProgram
);
router.get(
  "/academics/programs/:programId/divisions/fetch_all",
  getAllDivisionPrograms
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
      admin: "admin",
    },
  }),
  updateDivisionProgram
);
router.delete(
  "/academics/programs/:programId/divisions/delete",
  authUser,
  authUserRole({
    userRole: {
      admin: "admin",
    },
  }),
  deleteDivisionProgram
);

module.exports = router;
