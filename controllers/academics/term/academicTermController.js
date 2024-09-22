const AcademicTerm = require("../../../models/academics/term/AcademicTermModel");
const User = require("../../../models/user/UserModel");

// Create Academic Term ✅
module.exports.createAcademicTerm = async (req, res) => {
  const currentUser = req.user;
  const data = req.body;
  if (currentUser?.id !== data?.createdBy) {
    res.status(403).json({
      errorMessage: { message: ["Operation denied! You're not an admin!"] },
    });
    return;
  }
  const requiredField = data?.name || data?.from || data?.to || data?.createdBy;
  if (!requiredField) {
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
    //check if exists
    const academicTerm = await AcademicTerm.findOne({
      name: data?.name,
    });
    if (academicTerm) {
      res.status(403).json({
        errorMessage: {
          message: ["Academic term already exists!"],
        },
      });
      return;
    }
    //create
    const academicTermCreated = await AcademicTerm.create({
      name: data?.name,
      from: data?.from,
      to: data?.to,
      duration: data?.duration,
      createdBy: data?.createdBy,
    });
    if (academicTermCreated) {
      // Push academic term into admin
      if (
        !adminFound?.adminActionsData?.academicTerms.includes(
          academicTermCreated?._id
        )
      ) {
        await User.findOneAndUpdate(
          adminFound._id,
          {
            $push: {
              "adminActionsData.academicTerms": academicTermCreated?._id,
            },
          },
          { upsert: true }
        );
      }
      res.status(201).json({
        successMessage: "Academic term created successfully!",
        academicTerm: academicTermCreated,
      });
    } else {
      return res.status(400).json({
        errorMessage: {
          message: ["Failed to create academic term!"],
        },
      });
    }
  } catch (error) {
    console.log(error);
    res.status(403).json({
      errorMessage: { message: ["Internal Server Error!"] },
    });
    return;
  }
};
// Get all Academic Terms ✅
exports.getAllAcademicTerms = async (req, res) => {
  try {
    const academicTerms = await AcademicTerm.find({});
    if (academicTerms) {
      res.status(201).json({
        successMessage: "Academic terms fetched successfully...",
        academicTerms,
      });
    } else {
      res.status(404).json({
        errorMessage: {
          message: ["No academic term data found!"],
        },
      });
      return;
    }
  } catch (error) {
    res.status(403).json({
      errorMessage: { message: ["Internal Server Error!"] },
    });
    return;
  }
};
// Get single Academic Term ✅
exports.getSingleAcademicTerm = async (req, res) => {
  const { termId } = req.params;
  try {
    const academicTerm = await AcademicTerm.findOne({ _id: termId });
    if (academicTerm) {
      res.status(201).json({
        successMessage: "Academic term fetched successfully!",
        academicTerm,
      });
    } else {
      res.status(404).json({
        errorMessage: {
          message: ["Academic term data not found!"],
        },
      });
      return;
    }
  } catch (error) {
    res.status(403).json({
      errorMessage: { message: ["Internal Server Error!"] },
    });
    return;
  }
};
// Update  Academic Term ✅
exports.updateAcademicTerm = async (req, res) => {
  const currentUser = req.user;
  const { termId } = req.params;
  const data = req.body;
  try {
    // Find admin
    const adminFound = await User.findOne({ _id: currentUser?.id });
    if (!adminFound || !adminFound?.roles?.includes("admin")) {
      res.status(403).json({
        errorMessage: { message: ["Operation denied! You're not an admin!"] },
      });
      return;
    }
    // Find academic term to update
    const academicTermFound = await AcademicTerm.findOne({
      _id: termId,
    });
    if (!academicTermFound) {
      res.status(404).json({
        errorMessage: {
          message: ["Academic term data not found!"],
        },
      });
      return;
    }
    // Check if academic term exists
    const existingAcademicTerm = await AcademicTerm.findOne({
      _id: academicTermFound?._id,
      name: data?.name,
    });
    if (!existingAcademicTerm) {
      const updatedAcademicTerm = await AcademicTerm.findByIdAndUpdate(
        academicTermFound?._id,
        {
          name: data?.name,
          from: data?.from,
          to: data?.to,
          duration: data?.duration,
          description:
            data?.name && `This is the ${data?.name} of the Academic Year`,
          lastUpdatedBy: data?.lastUpdatedBy,
        },
        {
          new: true,
        }
      );
      res.status(201).json({
        successMessage: "Academic term updated successfully!",
        updatedAcademicTerm,
      });
    } else {
      res.status(403).json({
        errorMessage: {
          message: ["Academic term already exists!"],
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
// Delete  Academic Term ✅
exports.deleteAcademicTerm = async (req, res) => {
  const currentUser = req.user;
  const { termId } = req.params;
  try {
    // Find admin
    const adminFound = await User.findOne({ _id: currentUser?.id });
    if (!adminFound || !adminFound?.roles?.includes("admin")) {
      res.status(403).json({
        errorMessage: { message: ["Operation denied! You're not an admin!"] },
      });
      return;
    }
    const academicTermFound = await AcademicTerm.findOne({
      _id: termId,
    });
    if (!academicTermFound) {
      res.status(404).json({
        errorMessage: {
          message: ["Academic term data not found!"],
        },
      });
      return;
    }
    const deletedAcademicTerm = await AcademicTerm.findOneAndDelete({
      _id: academicTermFound?._id,
    });
    if (deletedAcademicTerm) {
      // Remove academic term from admin academic terms array
      if (
        adminFound?.adminActionsData?.academicTerms.includes(
          deletedAcademicTerm?._id
        )
      ) {
        await User.findOneAndUpdate(
          adminFound._id,
          {
            $pull: {
              "adminActionsData.academicTerms": deletedAcademicTerm?._id,
            },
          },
          { new: true }
        );
      }
    }
    res.status(200).json({
      successMessage: "Academic term deleted successfully!",
      deletedAcademicTerm,
    });
  } catch (error) {
    res.status(403).json({
      errorMessage: { message: ["Internal Server Error!"] },
    });
    return;
  }
};
