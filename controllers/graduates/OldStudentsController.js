const Batch = require("../../models/academics/batch/BatchesModel");
const OldStudents = require("../../models/graduates/OldStudentsModel");
const User = require("../../models/user/UserModel");

// Create old students group ✅
module.exports.createOldStudentsGroup = async (req, res) => {
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
    if (!data?.yearOfGraduation) {
      res.status(400).json({
        errorMessage: {
          message: [`Year Group Required!`],
        },
      });
      return;
    }
    const batchFound = await Batch.findOne({
      toYear: data?.yearOfGraduation,
    });
    if (!batchFound) {
      res.status(404).json({
        errorMessage: {
          message: [`Batch data not found!`],
        },
      });
      return;
    }
    //Check if Old Students Group already exist
    const sensosan = await OldStudents.findOne({
      yearOfGraduation: data?.yearOfGraduation,
    });
    if (sensosan) {
      res.status(403).json({
        errorMessage: {
          message: [
            `Sensosan group of ${sensosan.yearOfGraduation} already exists`,
          ],
        },
      });
      return;
    }
    //create
    const sensosanCreated = await OldStudents.create({
      yearOfGraduation: data?.yearOfGraduation,
      createdBy: adminFound?._id,
    });
    //Push Old Students Group Created Into Admin's oldStudentsGroups array
    if (
      !adminFound?.adminActionsData?.oldStudentsGroups.includes(
        sensosanCreated._id
      )
    ) {
      await User.findOneAndUpdate(
        adminFound._id,
        {
          $push: {
            "adminActionsData.oldStudentsGroups": sensosanCreated?._id,
          },
        },
        { upsert: true }
      );
    }
    res.status(201).json({
      successMessage: "Sensosan group created successfully!",
      sensosanCreated,
    });
  } catch (error) {
    res.status(500).json({
      errorMessage: {
        message: ["Internal Server Error!"],
      },
    });
    return;
  }
};
// Get old students groups ✅
module.exports.fetchAllGraduates = async (req, res) => {
  try {
    const sensosans = await User.find({
      "studentStatusExtend.isGraduated": true,
    });
    if (sensosans) {
      res.status(200).json({
        successMessage: "Graduates data fetched successfully!",
        allGraduatesFound: sensosans,
      });
    }
  } catch (error) {
    return res.status(500).json({
      errorMessage: {
        message: ["Internal Server Error"],
      },
    });
  }
};
// Get old students groups ✅
module.exports.getOldStudentsGroups = async (req, res) => {
  try {
    const sensosans = await OldStudents.find({});
    if (sensosans) {
      res.status(200).json({
        successMessage: "All old students groups fetched successfully!",
        sensosans,
      });
    } else {
      return res.status(404).json({
        errorMessage: {
          message: ["No old students group found!"],
        },
      });
    }
  } catch (error) {
    return res.status(500).json({
      errorMessage: {
        message: ["Internal Server Error"],
      },
    });
  }
};
// Get single old students group ✅
module.exports.getSingleOldStudentsGroup = async (req, res) => {
  const { sensosanId } = req.params;
  try {
    const sensosanGroup = await OldStudents.findOne({ _id: sensosanId });
    if (sensosanGroup) {
      res.status(200).json({
        successMessage: "Old students group fetched successfully!",
        sensosanGroup,
      });
    } else {
      res.status(404).json({
        errorMessage: {
          message: ["No old students group found!"],
        },
      });
    }
  } catch (error) {
    res.status(400).json({
      errorMessage: {
        message: ["Internal Server Error"],
      },
    });
  }
};
// Update old students group ✅
module.exports.updateOldStudentsGroup = async (req, res) => {
  const currentUser = req.user;
  const data = req.body;
  const { sensosanId } = req.params;
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
    const batchFound = await Batch.findOne({
      toYear: data?.yearOfGraduation,
    });
    if (!batchFound) {
      res.status(404).json({
        errorMessage: {
          message: [`Batch data not found!`],
        },
      });
      return;
    }
    // Find group to update
    const sensosanFound = await OldStudents.findOne({
      _id: sensosanId,
    });
    if (!sensosanFound) {
      res.status(404).json({
        errorMessage: {
          message: [`Old students group data not found!`],
        },
      });
      return;
    }
    //Check if Old Students Group already exist
    const sensosan = await OldStudents.findOne({
      yearOfGraduation: data?.yearOfGraduation,
    });
    if (sensosan) {
      res.status(403).json({
        errorMessage: {
          message: [
            `Sensosan group of ${sensosan.yearOfGraduation} already exists`,
          ],
        },
      });
      return;
    }
    // Update
    const sensosanCreated = await OldStudents.findOneAndUpdate(
      sensosanFound?._id,
      {
        yearOfGraduation: data?.yearOfGraduation,
        description: `This is ${data.yearOfGraduation} old students`,
        lastUpdatedBy: adminFound?._id,
      },
      { new: true }
    );
    res.status(201).json({
      successMessage: "Sensosan group updated successfully!",
      sensosanCreated,
    });
  } catch (error) {
    res.status(500).json({
      errorMessage: {
        message: ["Internal Server Error!"],
      },
    });
    return;
  }
};
// Delete old students group ✅
module.exports.deleteOldStudentsGroup = async (req, res) => {
  const currentUser = req.user;
  const { sensosanId } = req.params;
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
    // Find sensosan group to delete
    const batchFound = await OldStudents.findOne({
      _id: sensosanId,
    });
    if (!batchFound) {
      res.status(404).json({
        errorMessage: {
          message: [`Old students group data not found!`],
        },
      });
      return;
    }
    // Delete
    const deletedSensosan = await OldStudents.findOneAndDelete({
      _id: batchFound?._id,
    });
    if (deletedSensosan) {
      //Push Old Students Group Created Into Admin's oldStudentsGroups array
      if (
        adminFound?.adminActionsData?.oldStudentsGroups.includes(
          deletedSensosan._id
        )
      ) {
        await User.findOneAndUpdate(
          adminFound._id,
          {
            $pull: {
              "adminActionsData.oldStudentsGroups": deletedSensosan?._id,
            },
          },
          { new: true }
        );
      }
    }
    res.status(201).json({
      successMessage: "Old students group deleted successfully!",
      deletedSensosan,
    });
  } catch (error) {
    res.status(500).json({
      errorMessage: {
        message: ["Internal Server Error!"],
      },
    });
    return;
  }
};
