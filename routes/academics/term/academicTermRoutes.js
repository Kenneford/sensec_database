const {
  createAcademicTerm,
  getAllAcademicTerms,
  getSingleAcademicTerm,
  updateAcademicTerm,
  deleteAcademicTerm,
  getCurrentAcademicTerm,
  setAcademicTermStatus,
} = require("../../../controllers/academics/term/academicTermController");
const {
  authUser,
  authUserRole,
} = require("../../../middlewares/auth/authUser");

const router = require("express").Router();

router.post(
  "/academics/terms/create",
  authUser,
  authUserRole({ userRoles: { admin: "Admin" } }),
  createAcademicTerm
);
router.get("/academics/terms/current/fetch", getCurrentAcademicTerm);
router.put(
  "/academics/terms/:semesterId/status/set",
  authUser,
  authUserRole({ userRoles: { admin: "Admin" } }),
  setAcademicTermStatus
);
router.get("/academics/terms/fetch_all", getAllAcademicTerms);
router.get("/academics/terms/:termId/fetch", getSingleAcademicTerm);
router.put(
  "/academics/terms/:termId/update",
  authUser,
  authUserRole({ userRoles: { admin: "Admin" } }),
  updateAcademicTerm
);
router.delete(
  "/academics/terms/:termId/delete",
  authUser,
  authUserRole({ userRoles: { admin: "Admin" } }),
  deleteAcademicTerm
);

module.exports = router;
