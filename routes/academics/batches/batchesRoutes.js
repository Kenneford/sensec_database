const {
  createBatch,
  fetchAllBatches,
  fetchSingleBatch,
  updateBatch,
  deleteBatch,
} = require("../../../controllers/academics/batches/BatchesController");
const {
  authUser,
  authUserRole,
} = require("../../../middlewares/auth/authUser");

const router = require("express").Router();

router.post(
  "/academics/batches/create",
  authUser,
  authUserRole({ userRoles: { admin: "admin" } }),
  createBatch
);
router.get("/academics/batches/fetch_all", fetchAllBatches);
router.get("/academics/batches/:batchId/fetch", fetchSingleBatch);
router.put(
  "/academics/batches/:batchId/update",
  authUser,
  authUserRole({ userRoles: { admin: "admin" } }),
  updateBatch
);
router.delete(
  "/academics/batches/:batchId/delete",
  authUser,
  authUserRole({ userRoles: { admin: "admin" } }),
  deleteBatch
);

module.exports = router;
