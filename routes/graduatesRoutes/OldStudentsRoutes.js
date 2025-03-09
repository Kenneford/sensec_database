const {
  createOldStudentsGroup,
  getOldStudentsGroups,
  getSingleOldStudentsGroup,
  deleteOldStudentsGroup,
  updateOldStudentsGroup,
  fetchAllGraduates,
} = require("../../controllers/graduates/OldStudentsController");
const { authUser, authUserRole } = require("../../middlewares/auth/authUser");

const router = require("express").Router();

router.post(
  "/sensosan/groups/create",
  authUser,
  authUserRole({ userRoles: { admin: "admin" } }),
  createOldStudentsGroup
);
router.get("/sensosan/groups/fetch_all", getOldStudentsGroups);
router.get("/sensosan/members/fetch_all", fetchAllGraduates);
router.get("/sensosan/groups/:sensosanId/fetch", getSingleOldStudentsGroup);
router.put(
  "/sensosan/groups/:sensosanId/update",
  authUser,
  authUserRole({ userRoles: { admin: "admin" } }),
  updateOldStudentsGroup
);
router.delete(
  "/sensosan/groups/:sensosanId/delete",
  authUser,
  authUserRole({ userRoles: { admin: "admin" } }),
  deleteOldStudentsGroup
);

module.exports = router;
