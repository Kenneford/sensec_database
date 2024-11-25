const House = require("../../../models/academics/house/HouseModel");
const User = require("../../../models/user/UserModel");

module.exports.createHouse = async (req, res) => {
  const { data } = req.body;
  try {
    const error = [];
    if (!data?.name) {
      error.push("Name Of House Required!");
    }
    if (!data?.createdBy) {
      error.push("Operation Denied! You're Not An admin!");
    }
    if (error.length > 0) {
      res.status(400).json({
        errorMessage: {
          message: error,
        },
      });
      return;
    }
    const foundAdmin = await User.findOne({ _id: data?.createdBy });
    if (!foundAdmin) {
      res.status(403).json({
        errorMessage: {
          message: [`Operation Denied! You're Not An admin!`],
        },
      });
      return;
    }
    const existingHouse = await House.findOne({ name: data?.name });
    if (existingHouse) {
      res.status(400).json({
        errorMessage: {
          message: [`${existingHouse.name} already exists!`],
        },
      });
      return;
    } else {
      const newHouse = await House.create({
        name: data?.name,
        createdBy: data?.createdBy,
      });
      if (newHouse) {
        try {
          if (
            !foundAdmin?.adminActionsData?.housesCreated?.includes(
              newHouse?._id
            )
          ) {
            await User.findOneAndUpdate(
              foundAdmin?._id,
              {
                $push: {
                  "adminActionsData.housesCreated": newHouse?._id,
                },
              },
              { upsert: true }
            );
          }
        } catch (error) {
          console.log(error);
          return res.status(500).json({
            errorMessage: {
              message: [`Internal Server Error!`],
            },
          });
        }
      }
      res.status(201).json({
        successMessage: " House Created Successfully...",
        house: newHouse,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      errorMessage: {
        message: [`Internal Server Error!`],
      },
    });
  }
};

module.exports.fetchAllHouses = async (req, res) => {
  try {
    const housesFound = await House.find({}).populate("students");
    if (!housesFound) {
      res.status(404).json({
        errorMessage: {
          message: [`No house found!`],
        },
      });
      return;
    }
    if (housesFound) {
      res.status(200).json({
        successMessage: "All houses fetched successfully...",
        housesFound,
      });
    }
  } catch (error) {
    res.status(500).json({
      errorMessage: {
        message: [`Internal Server Error!`],
      },
    });
  }
};

module.exports.fetchSingleHouse = async (req, res) => {
  const { yearRange } = req.params;
  try {
    const batchFound = await Batch.findOne({
      yearRange,
    }).populate("students");
    if (!batchFound) {
      res.status(404).json({
        errorMessage: {
          message: [`No Batch found!`],
        },
      });
      return;
    }
    if (batchFound) {
      res.status(200).json({
        successMessage: "Batch fetched successfully...",
        batchFound,
      });
    }
  } catch (error) {
    res.status(500).json({
      errorMessage: {
        message: [`Internal Server Error!`],
      },
    });
  }
};

module.exports.updateHouse = async (req, res) => {};

module.exports.deleteHouse = async (req, res) => {};
