const {
  createAcademicTerm,
  getAllAcademicTerms,
  getSingleAcademicTerm,
  updateAcademicTerm,
  deleteAcademicTerm,
} = require("../../../controllers/academics/term/academicTermController");
const {
  authUser,
  authUserRole,
} = require("../../../middlewares/auth/authUser");

const router = require("express").Router();

router.post(
  "/academics/terms/create",
  authUser,
  authUserRole({ userRoles: { admin: "admin" } }),
  createAcademicTerm
);
router.get("/academics/terms/fetch_all", getAllAcademicTerms);
router.get("/academics/terms/:termId/fetch", getSingleAcademicTerm);
router.put(
  "/academics/terms/:termId/update",
  authUser,
  authUserRole({ userRoles: { admin: "admin" } }),
  updateAcademicTerm
);
router.delete(
  "/academics/terms/:termId/delete",
  authUser,
  authUserRole({ userRoles: { admin: "admin" } }),
  deleteAcademicTerm
);

module.exports = router;
