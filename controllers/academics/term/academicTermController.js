const AcademicTerm = require("../../../models/academics/term/AcademicTermModel");
const User = require("../../../models/user/UserModel");

// Create Academic Term ✅
module.exports.createAcademicTerm = async (req, res) => {
  const currentUser = req.user;
  const { academicTermData } = req.body;
  console.log(academicTermData);

  try {
    // Find admin
    const adminFound = await User.findOne({ _id: currentUser?.id });
    if (!adminFound || !adminFound?.roles?.includes("admin")) {
      res.status(403).json({
        errorMessage: { message: ["Operation denied! You're not an admin!"] },
      });
      return;
    }
    if (currentUser?.id !== academicTermData?.createdBy) {
      res.status(403).json({
        errorMessage: { message: ["Operation denied! You're not an admin!"] },
      });
      return;
    }
    const requiredField =
      academicTermData?.name ||
      academicTermData?.from ||
      academicTermData?.to ||
      academicTermData?.createdBy;
    if (!requiredField) {
      res.status(403).json({
        errorMessage: { message: ["Fill all required fields!"] },
      });
      return;
    }
    //check if exists
    const academicTerm = await AcademicTerm.findOne({
      name: academicTermData?.name,
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
      name: academicTermData?.name,
      from: academicTermData?.from,
      to: academicTermData?.to,
      duration: academicTermData?.duration,
      createdBy: academicTermData?.createdBy,
    });
    if (academicTermCreated) {
      // Push academic term into admin
      if (
        !adminFound?.adminActionsData?.academicTermsCreated.includes(
          academicTermCreated?._id
        )
      ) {
        await User.findOneAndUpdate(
          adminFound._id,
          {
            $push: {
              "adminActionsData.academicTermsCreated": academicTermCreated?._id,
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
module.exports.getAllAcademicTerms = async (req, res) => {
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
module.exports.getSingleAcademicTerm = async (req, res) => {
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
// Set next academic term ✅
module.exports.setNextAcademicTerm = async (req, res) => {
  const { semesterId } = req.params;

  try {
    // Step 1: Ensure all other semesters' `isNext` is set to false
    await AcademicTerm.updateMany({}, { $set: { isNext: false } });

    // Step 2: Set the selected semester as `isNext`
    const updatedSemester = await AcademicTerm.findOneAndUpdate(
      semesterId,
      { $set: { isNext: true } },
      { new: true }
    );

    if (!updatedSemester) {
      return res
        .status(404)
        .json({ errorMessage: { message: "Semester not found" } });
    }

    res.status(200).json({
      message: `Semester ${updatedSemester.name} is now marked as next.`,
      nextSemester: updatedSemester,
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating semester", error });
  }
};
module.exports.getCurrentAcademicTerm = async (req, res) => {
  const now = new Date();
  try {
    const currentAcademicTerm = await AcademicTerm.findOne({
      from: { $lte: now },
      to: { $gte: now },
      isCurrent: true,
    });
    if (currentAcademicTerm) {
      res.status(201).json({
        successMessage: "Academic semester fetched successfully!",
        currentAcademicTerm,
      });
    } else {
      res.status(404).json({
        errorMessage: {
          message: ["No active semester found!"],
        },
      });
      return;
    }
  } catch (error) {
    res.status(403).json({
      errorMessage: { message: [`Internal Server Error! ${error?.message}`] },
    });
    return;
  }
};
// Update  Academic Term ✅
module.exports.updateAcademicTerm = async (req, res) => {
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
      // Trigger the isCurrent semester update function
      await updateCurrentSemester();

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
module.exports.deleteAcademicTerm = async (req, res) => {
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
