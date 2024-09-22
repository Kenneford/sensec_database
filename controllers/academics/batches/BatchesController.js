const Batch = require("../../../models/academics/batch/BatchesModel");
const User = require("../../../models/user/UserModel");

// Create academic batch ✅
module.exports.createBatch = async (req, res) => {
  const currentUser = req.user;
  const data = req.body;
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
    if (currentUser?.id !== data?.createdBy) {
      res.status(403).json({
        errorMessage: {
          message: ["Operation Denied! You're Not An Admin!"],
        },
      });
      return;
    }
    if (!data?.fromYear) {
      res.status(403).json({
        errorMessage: {
          message: ["Batch beginning year required!"],
        },
      });
      return;
    }
    if (!data?.toYear) {
      res.status(403).json({
        errorMessage: {
          message: ["Batch ending year required!"],
        },
      });
      return;
    }
    const existingBatch = await Batch.findOne({
      fromYear: data?.fromYear,
      toYear: data?.toYear,
    });
    if (existingBatch) {
      res.status(400).json({
        errorMessage: {
          message: [`${existingBatch.yearRange} batch already exists!`],
        },
      });
    } else {
      const newBatch = await Batch.create({
        fromYear: data?.fromYear,
        toYear: data?.toYear,
        createdBy: data?.createdBy,
      });
      if (
        newBatch &&
        !adminFound?.adminActionsData?.batches?.includes(newBatch?._id)
      ) {
        // await User.findOneAndUpdate(adminFound?._id,{ _id: currentUser?.id });
        adminFound.adminActionsData.batches.push(newBatch?._id);
        await adminFound.save();
      }
      res.status(201).json({
        successMessage: " Batch created successfully!",
        batch: newBatch,
      });
    }
  } catch (error) {
    res.status(500).json({
      errorMessage: {
        message: [`Internal Server Error!`],
      },
    });
    return;
  }
};
// Get academic batches ✅
module.exports.fetchAllBatches = async (req, res) => {
  try {
    const batchesFound = await Batch.find({});
    if (!batchesFound) {
      res.status(404).json({
        errorMessage: {
          message: [`No batch data found!`],
        },
      });
      return;
    }
    if (batchesFound) {
      res.status(200).json({
        successMessage: "All batches fetched successfully!",
        batchesFound,
      });
    }
  } catch (error) {
    res.status(500).json({
      errorMessage: {
        message: [`Internal Server Error!`],
      },
    });
    return;
  }
};
// Get academic batch ✅
module.exports.fetchSingleBatch = async (req, res) => {
  const { batchId } = req.params;
  try {
    const batchFound = await Batch.findOne({
      _id: batchId,
    });
    if (!batchFound) {
      res.status(404).json({
        errorMessage: {
          message: [`Batch data found!`],
        },
      });
      return;
    }
    if (batchFound) {
      res.status(200).json({
        successMessage: "Batch fetched successfully!",
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
// Update academic batch ✅
module.exports.updateBatch = async (req, res) => {
  const currentUser = req.user;
  const data = req.body;
  const { batchId } = req.params;
  try {
    // Find admin
    const adminFound = await User.findOne({ _id: currentUser?.id });
    if (!adminFound || !adminFound?.roles?.includes("admin")) {
      res.status(403).json({
        errorMessage: { message: ["Operation denied! You're not an admin!"] },
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
    //Find academic batch to update
    const academicBatchFound = await Batch.findOne({
      _id: batchId,
    });
    if (!academicBatchFound) {
      res.status(404).json({
        errorMessage: {
          message: ["Academic batch data not found!"],
        },
      });
      return;
    }
    // Check if academic batch exists
    const existingAcademicBatch = await Batch.findOne({
      fromYear: data?.fromYear,
      toYear: data?.toYear,
    });
    if (!existingAcademicBatch) {
      const updatedAcademicBatch = await Batch.findOneAndUpdate(
        academicBatchFound?._id,
        {
          fromYear: data?.fromYear,
          toYear: data?.toYear,
          lastUpdatedBy: data?.lastUpdatedBy,
        },
        {
          new: true,
        }
      );
      if (updatedAcademicBatch) {
        updatedAcademicBatch.yearRange = `${data?.fromYear}-${data?.toYear}`;
        updatedAcademicBatch.description = `${data?.fromYear}-${data?.toYear} academic batch`;
        await updatedAcademicBatch.save();
      }
      res.status(201).json({
        successMessage: "Academic batch updated successfully!",
        updatedAcademicBatch,
      });
    } else {
      res.status(403).json({
        errorMessage: {
          message: ["Academic batch already exists!"],
        },
      });
    }
  } catch (error) {
    res.status(500).json({
      errorMessage: {
        message: ["Internal Server Error!"],
      },
    });
    return;
  }
};
// Delete academic batch ✅
module.exports.deleteBatch = async (req, res) => {
  const currentUser = req.user;
  const { batchId } = req.params;
  try {
    // Find admin
    const adminFound = await User.findOne({ _id: currentUser?.id });
    if (!adminFound || !adminFound?.roles?.includes("admin")) {
      res.status(403).json({
        errorMessage: { message: ["Operation denied! You're not an admin!"] },
      });
      return;
    }
    //Find academic batch to delete
    const academicBatchFound = await Batch.findOne({
      _id: batchId,
    });
    if (!academicBatchFound) {
      res.status(404).json({
        errorMessage: {
          message: ["Academic batch data not found!"],
        },
      });
      return;
    } else {
      // Delete batch
      const deletedAcademicBatch = await Batch.findOneAndDelete({
        _id: academicBatchFound?._id,
      });
      if (
        deletedAcademicBatch &&
        adminFound?.adminActionsData?.batches?.includes(
          deletedAcademicBatch?._id
        )
      ) {
        adminFound.adminActionsData.batches.pull(deletedAcademicBatch?._id);
        await adminFound.save();
      }
      res.status(201).json({
        successMessage: "Batch deleted successfully!",
        deletedAcademicBatch,
      });
    }
  } catch (error) {}
};
