const PlacementBatch = require("../../models/PlacementStudent/placementBatches/PlacementBatchesModel");
const User = require("../../models/user/UserModel");

// Create placement batch ✅
module.exports.addPlacementBatch = async (req, res) => {
  const { placementBatch } = req.body;
  const currentUser = req.user;
  try {
    //Find Admin
    const adminFound = await User.findOne({ _id: currentUser?.id });
    if (!adminFound || !currentUser?.roles?.includes("admin")) {
      res.status(403).json({
        errorMessage: {
          message: ["Operation Denied! You're Not An Admin!"],
        },
      });
      return;
    }
    if (currentUser?.id !== placementBatch?.createdBy) {
      res.status(403).json({
        errorMessage: {
          message: ["Operation Denied! You're Not An Admin!"],
        },
      });
      return;
    }
    if (!placementBatch?.year) {
      res.status(400).json({
        errorMessage: {
          message: [`Placement Batch Year Required!`],
        },
      });
      return;
    }
    const existingBatch = await PlacementBatch.findOne({
      year: placementBatch?.year,
    });
    if (existingBatch) {
      res.status(400).json({
        errorMessage: {
          message: [`Placement batch ${existingBatch?.year} already exists!`],
        },
      });
      return;
    }
    const newBatch = await PlacementBatch.create({
      year: placementBatch?.year,
      createdBy: placementBatch?.createdBy,
    });
    //   push placement batch into admin's created placement batches array✅
    if (
      adminFound &&
      !adminFound?.adminActionsData?.placementBatchesCreated.includes(
        newBatch._id
      )
    ) {
      await User.findOneAndUpdate(
        adminFound._id,
        {
          $push: {
            "adminActionsData.placementBatchesCreated": newBatch?._id,
          },
        },
        { upsert: true }
      );
    }
    res.status(201).json({
      successMessage: "Placement batch created successfully",
      placementBatch: newBatch,
    });
  } catch (error) {
    res.status(500).json({
      errorMessage: {
        message: [`Internal Server Error!`],
      },
    });
  }
};
// Get placement batches ✅
module.exports.fetchAllPlacementBatches = async (req, res) => {
  try {
    const batchesFound = await PlacementBatch.find({}).populate("students");
    if (!batchesFound) {
      res.status(404).json({
        errorMessage: {
          message: [`No placement batch found!`],
        },
      });
      return;
    }
    if (batchesFound) {
      let sortedStudents;
      batchesFound?.forEach((batch) => {
        sortedStudents =
          batch &&
          [...batch.students].sort(
            (oldBatch, newBatch) => newBatch?.createdAt - oldBatch?.createdAt
          );
        console.log(sortedStudents);
      });
      const sortedBatches = [...batchesFound]?.sort(
        (oldBatch, newBatch) => newBatch?.year - oldBatch?.year
      );

      res.status(200).json({
        successMessage: "All placements batches fetched successfully!",
        batchesFound: sortedBatches,
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
// Get single placement batch ✅
module.exports.fetchSinglePlacementBatch = async (req, res) => {
  const { year } = req.params;
  try {
    const batchFound = await PlacementBatch.findOne({
      year,
    }).populate("students");
    if (!batchFound) {
      res.status(404).json({
        errorMessage: {
          message: [`No Placement Batch found!`],
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
// Update placement batch ✅
module.exports.updatePlacementBatch = async (req, res) => {
  const currentUser = req.user;
  const data = req.body;
  const { batchId } = req.params;
  try {
    //Find Admin
    const adminFound = await User.findOne({ _id: currentUser?.id });
    if (!adminFound || !currentUser?.roles?.includes("admin")) {
      res.status(403).json({
        errorMessage: {
          message: ["Operation Denied! You're Not An Admin!"],
        },
      });
      return;
    }
    if (currentUser?.id !== data?.lastUpdatedBy) {
      res.status(403).json({
        errorMessage: {
          message: ["Operation Denied! You're Not An Admin!"],
        },
      });
      return;
    }
    // Find batch to update
    const batchFound = await PlacementBatch.findOne({ _id: batchId });
    if (!batchFound) {
      res.status(404).json({
        errorMessage: {
          message: [`Placement batch data not found!`],
        },
      });
      return;
    }
    // Check for existing batch
    const existingBatch = await PlacementBatch.findOne({
      year: data?.placementYear,
    });
    if (existingBatch) {
      res.status(400).json({
        errorMessage: {
          message: [`${data?.placementYear} placement batch already exists!`],
        },
      });
      return;
    }
    const updatedBatch = await PlacementBatch.findOneAndUpdate(
      batchFound?._id,
      {
        year: data?.placementYear,
        lastUpdatedBy: data?.lastUpdatedBy,
      },
      { new: true }
    );
    res.status(201).json({
      successMessage: "Placement batch updated successfully!",
      updatedBatch,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      errorMessage: {
        message: [`Internal Server Error!`],
      },
    });
  }
};
// Delete placement batch ✅
module.exports.deletePlacementBatch = async (req, res) => {
  const currentUser = req.user;
  const { batchId } = req.params;
  try {
    //Find Admin
    const adminFound = await User.findOne({ _id: currentUser?.id });
    if (!adminFound || !currentUser?.roles?.includes("admin")) {
      res.status(403).json({
        errorMessage: {
          message: ["Operation Denied! You're Not An Admin!"],
        },
      });
      return;
    }
    // Find batch to delete
    const batchFound = await PlacementBatch.findOne({ _id: batchId });
    if (!batchFound) {
      res.status(404).json({
        errorMessage: {
          message: [`Placement batch data not found!`],
        },
      });
      return;
    }
    // Delete
    const deletedBatch = await PlacementBatch.findOneAndDelete({
      _id: batchFound?._id,
    });
    res.status(201).json({
      successMessage: "Placement batch deleted successfully!",
      deletedBatch,
    });
  } catch (error) {
    res.status(500).json({
      errorMessage: {
        message: [`Internal Server Error!`],
      },
    });
  }
};
