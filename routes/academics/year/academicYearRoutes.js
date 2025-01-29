const {
  createAcademicYear,
  getAllAcademicYears,
  getSingleAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,
} = require("../../../controllers/academics/year/academicYearController");
const {
  authUser,
  authUserRole,
} = require("../../../middlewares/auth/authUser");

const router = require("express").Router();

router.post(
  "/academics/year/create",
  authUser,
  authUserRole({ userRoles: { admin: "Admin" } }),
  createAcademicYear
);
router.get("/academics/year/fetch_all", getAllAcademicYears);
router.get("/academics/single_year/:yearId/fetch", getSingleAcademicYear);
router.put(
  "/academics/year/:yearId/update",
  authUser,
  authUserRole({ userRoles: { admin: "Admin" } }),
  updateAcademicYear
);
router.delete(
  "/academics/year/:yearId/delete",
  authUser,
  authUserRole({ userRoles: { admin: "Admin" } }),
  deleteAcademicYear
);

module.exports = router;
