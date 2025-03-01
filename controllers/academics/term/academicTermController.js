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
    if (!adminFound || !adminFound?.roles?.includes("Admin")) {
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
      from: new Date(academicTermData?.from),
      to: new Date(academicTermData?.to),
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
    const academicTerms = await AcademicTerm.find({}).populate([
      {
        path: "createdBy",
        select:
          "uniqueId personalInfo.gender personalInfo.lastName personalInfo.profilePicture",
      },
      { path: "lastUpdatedBy", select: "uniqueId personalInfo" },
    ]);
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
module.exports.setAcademicTermStatus = async (req, res) => {
  const { semesterId } = req.params;
  const currentUser = req.user;
  const data = req.body;

  console.log("startDate: ", data?.startDate);
  console.log("endDate: ", data?.endDate);

  try {
    if (!data) {
      res.status(403).json({
        errorMessage: {
          message: ["Semester update data not provided!"],
        },
      });
      return;
    }
    //Find admin
    const adminFound = await User.findOne({ _id: data?.lastUpdatedBy });
    if (!adminFound || !currentUser?.roles?.includes("Admin")) {
      res.status(403).json({
        errorMessage: {
          message: ["Operation Denied! You're not an admin!"],
        },
      });
      return;
    }
    // Find semester
    const semesterToUpdateStatus = await AcademicTerm.findOne({
      _id: semesterId,
    });
    if (!semesterToUpdateStatus) {
      res.status(404).json({
        errorMessage: {
          message: ["Semester data not found!"],
        },
      });
      return;
    }
    // if (!data?.changeSemesterName) {
    // Find all semesters
    const allAcademicSemesters = await AcademicTerm.find({
      status: data?.status,
    });
    // console.log("allAcademicSemesters: ", allAcademicSemesters);

    const filteredSemesters = allAcademicSemesters?.filter(
      (semester) =>
        semester?._id?.toString() !== semesterToUpdateStatus?._id?.toString()
    );
    // console.log("filteredSemesters: ", filteredSemesters);
    if (filteredSemesters?.length > 0) {
      for (const semester of filteredSemesters) {
        await AcademicTerm.findOneAndUpdate(
          { _id: semester?._id },
          {
            status: "isPending",
            lastUpdatedBy: data?.lastUpdatedBy ? data?.lastUpdatedBy : null,
          },
          { new: true }
        );
      }
    }
    // }

    // Step 1: Ensure all other semesters' `isNext` is set to false
    // await AcademicTerm.updateMany({}, { $set: { isNext: false } });

    // Step 2: Set the selected semester new status
    const updatedSemesterStatus = await AcademicTerm.findOneAndUpdate(
      { _id: semesterToUpdateStatus?._id },
      {
        name: data?.newSemesterName,
        from: data?.startDate,
        to: data?.endDate,
        status: data?.status,
        lastUpdatedBy: data?.lastUpdatedBy ? data?.lastUpdatedBy : null,
      },
      { new: true }
    );

    res.status(200).json({
      successMessage: `${updatedSemesterStatus?.name} is now marked as ${
        data?.status === "isCurrent"
          ? "current"
          : data?.status === "isNext"
          ? "next"
          : "pending"
      }.`,
      updatedSemesterStatus,
      // allAcademicSemesters,
      // filteredSemesters,
    });
  } catch (error) {
    console.log(error);

    res.status(404).json({
      errorMessage: {
        message: ["Error updating semester!", error?.message],
      },
    });
    return;
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
    if (!adminFound || !adminFound?.roles?.includes("Admin")) {
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
    if (!adminFound || !adminFound?.roles?.includes("Admin")) {
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
    res.status(200).json({
      successMessage: "Academic semester deleted successfully!",
      deletedAcademicTerm,
    });
  } catch (error) {
    res.status(403).json({
      errorMessage: { message: ["Internal Server Error!"] },
    });
    return;
  }
};
