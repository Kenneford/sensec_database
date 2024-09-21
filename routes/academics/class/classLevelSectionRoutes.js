const {
  createClassLevelSection,
  getAllClassLevelSections,
  getSingleClassLevelSection,
  updateClassLevelSection,
  deleteClassLevelSection,
  assignClassSectionLecturer,
  removeClassSectionLecturer,
} = require("../../../controllers/academics/class/classLevelSectionController");
const {
  authUser,
  authUserRole,
} = require("../../../middlewares/auth/authUser");
const {
  findProgramme,
} = require("../../../middlewares/programme/programMiddleware");

const router = require("express").Router();

// Create class section
router.post(
  "/academics/class_section/create",
  authUser,
  authUserRole({
    userRoles: {
      admin: "admin",
    },
  }),
  findProgramme,
  createClassLevelSection
);
// Assign lecturer
router.put(
  "/academics/class_section/lecturer/assign",
  authUser,
  authUserRole({
    userRoles: {
      admin: "admin",
    },
  }),
  assignClassSectionLecturer
);
// Remove lecturer
router.put(
  "/academics/class_section/lecturer/:lecturerId/remove",
  authUser,
  authUserRole({
    userRoles: {
      admin: "admin",
    },
  }),
  removeClassSectionLecturer
);
// Get all class sections
router.get("/academics/class_sections/fetch_all", getAllClassLevelSections);
// Get single class sections
router.get(
  "/academics/class_sections/:classSectionId/fetch",
  getSingleClassLevelSection
);
// Update class section
router.put(
  "/academics/class_sections/:classSectionId/update",
  authUser,
  authUserRole({
    userRoles: {
      admin: "admin",
    },
  }),
  updateClassLevelSection
);
// Delete class section
router.delete(
  "/academics/class_sections/:classSectionId/delete",
  authUser,
  authUserRole({
    userRoles: {
      admin: "admin",
    },
  }),
  deleteClassLevelSection
);

module.exports = router;
