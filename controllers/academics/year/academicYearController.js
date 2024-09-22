const AcademicYear = require("../../../models/academics/year/AcademicYearModel");
const User = require("../../../models/user/UserModel");

// Create Academic Year ✅
module.exports.createAcademicYear = async (req, res) => {
  const currentUser = req.user;
  const data = req.body;
  if (currentUser?.id !== data?.createdBy) {
    res.status(403).json({
      errorMessage: { message: ["Operation denied! You're not an admin!"] },
    });
    return;
  }
  const requiredFields = data?.fromYear || data?.toYear || data?.createdBy;
  if (!requiredFields) {
    res.status(403).json({
      errorMessage: { message: ["Fill all required fields!"] },
    });
    return;
  }
  try {
    // Find admin
    const adminFound = await User.findOne({ _id: currentUser?.id });
    if (!adminFound || !adminFound?.roles?.includes("admin")) {
      res.status(403).json({
        errorMessage: { message: ["Operation denied! You're not an admin!"] },
      });
      return;
    }
    // check if exists
    const existingAcademicYear = await AcademicYear.findOne({
      fromYear: data?.fromYear,
      toYear: data?.toYear,
    });
    if (existingAcademicYear) {
      res.status(400).json({
        errorMessage: {
          message: [
            `Academic year ${existingAcademicYear.yearRange} already exists`,
          ],
        },
      });
      return;
    }
    // Create Academic Year
    const academicYearCreated = await AcademicYear.create({
      fromYear: data?.fromYear,
      toYear: data?.toYear,
      createdBy: data?.createdBy,
    });
    if (academicYearCreated) {
      //   push academic year into admin
      try {
        if (
          !adminFound?.adminActionsData?.academicYears.includes(
            academicYearCreated?._id
          )
        ) {
          await User.findOneAndUpdate(
            adminFound._id,
            {
              $push: {
                "adminActionsData.academicYears": academicYearCreated?._id,
              },
            },
            { upsert: true }
          );
        }
      } catch (error) {
        return res.status(500).json({
          errorMessage: {
            message: ["Internal Server Error!"],
          },
        });
      }
      res.status(201).json({
        successMessage: "Academic year created successfully!",
        academicYear: academicYearCreated,
      });
    } else {
      return res.status(403).json({
        errorMessage: {
          message: ["Failed to create Academic Year!"],
        },
      });
    }
  } catch (error) {
    res.status(403).json({
      errorMessage: { message: ["Internal Server Error!"] },
    });
    return;
  }
};
// Get all Academic Years ✅
exports.getAllAcademicYears = async (req, res) => {
  try {
    const academicYears = await AcademicYear.find({});
    if (academicYears) {
      res.status(201).json({
        successMessage: "Academic years fetched successfully!",
        academicYears,
      });
    } else {
      res.status(404).json({
        errorMessage: {
          message: ["No academic year data found!"],
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
//  Get single Academic Year ✅
exports.getSingleAcademicYear = async (req, res) => {
  const { yearId } = req.params;
  try {
    const academicYear = await AcademicYear.findOne({ _id: yearId });
    if (academicYear) {
      res.status(201).json({
        successMessage: "Academic year fetched successfully!",
        academicYear,
      });
    } else {
      res.status(404).json({
        errorMessage: {
          message: ["Academic year data not found!"],
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
// Update  Academic Year ✅
exports.updateAcademicYear = async (req, res) => {
  const currentUser = req.user;
  const data = req.body;
  const { yearId } = req.params;
  try {
    // Find admin
    const adminFound = await User.findOne({ _id: currentUser?.id });
    if (!adminFound || !adminFound?.roles?.includes("admin")) {
      res.status(403).json({
        errorMessage: { message: ["Operation denied! You're not an admin!"] },
      });
      return;
    }
    //Find academic year to update
    const academicYearFound = await AcademicYear.findOne({
      _id: yearId,
    });
    if (!academicYearFound) {
      res.status(404).json({
        errorMessage: {
          message: ["Academic year data not found!"],
        },
      });
      return;
    }
    // Check if academic year exists
    const existingAcademicYear = await AcademicYear.findOne({
      fromYear: data?.fromYear,
      toYear: data?.toYear,
    });
    if (!existingAcademicYear) {
      const updatedAcademicYear = await AcademicYear.findByIdAndUpdate(
        academicYearFound?._id,
        {
          fromYear: data?.fromYear,
          toYear: data?.toYear,
          lastUpdatedBy: data?.lastUpdatedBy,
        },
        {
          new: true,
        }
      );
      if (updatedAcademicYear) {
        updatedAcademicYear.yearRange = `${data?.fromYear}-${data?.toYear}`;
        updatedAcademicYear.description = `This is ${data?.fromYear}-${data?.toYear} academic year`;
        await updatedAcademicYear.save();
      }
      res.status(201).json({
        successMessage: "Academic year updated successfully!",
        updatedAcademicYear,
      });
    } else {
      res.status(403).json({
        errorMessage: {
          message: ["Academic year already exists!"],
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
// Delete  Academic Year ✅
exports.deleteAcademicYear = async (req, res) => {
  const currentUser = req.user;
  const { yearId } = req.params;
  try {
    // Find admin
    const adminFound = await User.findOne({ _id: currentUser?.id });
    if (!adminFound || !adminFound?.roles?.includes("admin")) {
      res.status(403).json({
        errorMessage: { message: ["Operation denied! You're not an admin!"] },
      });
      return;
    }
    const academicYearFound = await AcademicYear.findOne({ _id: yearId });
    if (!academicYearFound) {
      res.status(404).json({
        errorMessage: { message: ["Academic year data not found!"] },
      });
      return;
    }
    const deletedAcademicYear = await AcademicYear.findOneAndDelete({
      _id: academicYearFound?._id,
    });
    res.status(201).json({
      successMessage: "Academic year deleted successfully",
      deletedAcademicYear,
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
