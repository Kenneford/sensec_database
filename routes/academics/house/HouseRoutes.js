const {
  createHouse,
  fetchAllHouses,
} = require("../../../controllers/academics/house/HouseController");

const router = require("express").Router();

router.post("/academics/houses/create", createHouse);
router.get("/academics/houses/fetch_all", fetchAllHouses);
// router.get("/academics/single_house/:name", getSingleClassLevel);
// router.put("/academics/update_house/:id", updateClassLevel);
// router.delete("/academics/delete_house/:id", deleteClassLevel);

module.exports = router;
