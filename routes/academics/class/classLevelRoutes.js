const {
  createClassLevel,
  getAllClassLevels,
  getSingleClassLevel,
  getClassLevelPendingStudents,
  updateClassLevel,
  deleteClassLevel,
  getClassLevelApprovedStudents,
} = require("../../../controllers/academics/class/classLevelController");
const {
  authUser,
  authUserRole,
} = require("../../../middlewares/auth/authUser");

const router = require("express").Router();

router.post(
  "/academics/class_level/create",
  authUser,
  authUserRole({
    userRoles: {
      admin: "admin",
    },
  }),
  createClassLevel
);
router.get("/academics/class_levels/fetch_all", getAllClassLevels);
router.get("/academics/single_class_level/:name", getSingleClassLevel);
router.get(
  "/academics/approved_students/class_level/:name",
  getClassLevelApprovedStudents
);
router.get(
  "/academics/pending_students/class_level/:name",
  getClassLevelPendingStudents
);
router.put(
  "/academics/class_level/:classLevelId/update",
  authUser,
  authUserRole({
    userRoles: {
      admin: "admin",
    },
  }),
  updateClassLevel
);
router.delete("/academics/class_level/:id/delete", deleteClassLevel);

module.exports = router;
