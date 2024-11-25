const {
  addPlacementBatch,
  fetchAllPlacementBatches,
  fetchSinglePlacementBatch,
  updatePlacementBatch,
  deletePlacementBatch,
} = require("../../../controllers/placementController/PlacementBatchController");
const {
  authUser,
  authUserRole,
} = require("../../../middlewares/auth/authUser");

const router = require("express").Router();

router.post(
  "/placement/batches/create",
  authUser,
  authUserRole({ userRoles: { admin: "admin" } }),
  addPlacementBatch
);
router.get("/placement/batches/fetch_all", fetchAllPlacementBatches);
router.get("/placement/batches/fetch_single/:year", fetchSinglePlacementBatch);
router.put(
  "/placement/batches/:batchId/update",
  authUser,
  authUserRole({ userRoles: { admin: "admin" } }),
  updatePlacementBatch
);
router.delete(
  "/placement/batches/:batchId/delete",
  authUser,
  authUserRole({ userRoles: { admin: "admin" } }),
  deletePlacementBatch
);
module.exports = router;
