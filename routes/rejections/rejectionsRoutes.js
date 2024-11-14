const {
  createRejectedApplicationsData,
} = require("../../controllers/rejectionsData/RejectionsDataController");
const { authUser, authUserRole } = require("../../middlewares/auth/authUser");

const router = require("express").Router();

router.post(
  "/applications/rejected_data/create",
  authUser,
  authUserRole({ userRoles: { admin: "admin" } }),
  createRejectedApplicationsData
);

module.exports = router;
