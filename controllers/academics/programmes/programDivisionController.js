const ProgramDivision = require("../../../models/academics/programmes/divisions/ProgramDivisionModel");
const Program = require("../../../models/academics/programmes/ProgramsModel");
const User = require("../../../models/user/UserModel");

// Create Program Division ✅
module.exports.createDivisionProgram = async (req, res) => {
  const currentUser = req.user;
  const { data } = req.body;
  console.log(data);
  try {
    //Find Admin
    const adminFound = await User.findOne({ _id: data?.createdBy });
    if (!adminFound || !currentUser?.roles?.includes("admin")) {
      res.status(403).json({
        errorMessage: {
          message: ["Operation denied! You're not an admin!"],
        },
      });
      return;
    }
    if (currentUser?.id !== data?.createdBy) {
      res.status(403).json({
        errorMessage: {
          message: ["Operation denied! You're not an admin!"],
        },
      });
      return;
    }
    //Find program
    const program = await Program.findOne({ _id: data?.programId });
    if (!program) {
      res.status(500).json({
        errorMessage: {
          message: ["Selected programme does not exist!"],
        },
      });
      return;
    }
    //Check if division programme exists
    const existingProgram = await ProgramDivision.findOne({
      programId: data?.programId,
      divisionName: data?.divisionName,
    });
    if (existingProgram) {
      res.status(500).json({
        errorMessage: {
          message: ["Division programme already exists!"],
        },
      });
      return;
    }
    const newDivisionProgram = await ProgramDivision.create({
      programName: data?.programName,
      programId: data?.programId,
      divisionName: data?.divisionName,
      createdBy: data?.createdBy,
    });
    // Push newly created division programme into its mother-programme divisionPrograms array✅
    if (
      program &&
      !program?.programDivisions?.includes(newDivisionProgram?._id)
    ) {
      program.programDivisions.push(newDivisionProgram?._id);
      await program.save();
    }
    if (newDivisionProgram) {
      await Program.findOneAndUpdate(
        { _id: program?._id },
        { hasDivisions: true },
        { new: true }
      );
    }
    res.status(201).json({
      successMessage: "Division programme created successfully!",
      newDivisionProgram,
    });
    console.log("Division programme created successfully!");
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      errorMessage: {
        message: ["Something went wrong!"],
      },
    });
  }
};
// Fetch all division Programmes By Program ID ✅
exports.getAllDivisionPrograms = async (req, res) => {
  const { programId } = req.params;
  try {
    const program = await Program.findOne({ _id: programId });
    if (program) {
      const divisionProgramsFound = await ProgramDivision.find({
        programId,
      }).populate([
        { path: "optionalElectiveSubjects" },
        { path: "electiveSubjects" },
      ]);
      res.status(200).json({
        successMessage: "Division programs fetched successfully...",
        programs: divisionProgramsFound,
      });
    } else {
      res.status(404).json({
        errorMessage: {
          message: ["Programme data not found!"],
        },
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      errorMessage: {
        message: ["Something went wrong!"],
      },
    });
  }
};
// Fetch all created division Programmes ✅
exports.getAllCreatedDivisionPrograms = async (req, res) => {
  try {
    const divisionProgramsFound = await ProgramDivision.find({}).populate([
      { path: "optionalElectiveSubjects" },
      { path: "electiveSubjects" },
    ]);
    res.status(200).json({
      successMessage: "Division programs fetched successfully...",
      divisionProgramsFound,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      errorMessage: {
        message: ["Something went wrong!"],
      },
    });
  }
};
// Get single division program ✅
exports.getSingleDivisionProgram = async (req, res) => {
  const { programId } = req.params;
  try {
    const program = await ProgramDivision.findOne({
      _id: programId,
    }).populate([
      {
        path: "electiveSubjects",
      },
      {
        path: "optionalElectiveSubjects",
      },
      {
        path: "createdBy",
      },
      {
        path: "lastUpdatedBy",
      },
    ]);
    if (program) {
      res.status(201).json({
        successMessage: "Program fetched successfully!",
        program,
      });
    } else {
      res.status(404).json({
        errorMessage: {
          message: ["Program data not found!"],
        },
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      errorMessage: {
        message: ["Something went wrong!"],
      },
    });
  }
};
// Update division program ✅
exports.updateDivisionProgram = async (req, res) => {
  const { programId } = req.params;
  const { name, lastUpdatedBy } = req.body;
  try {
    //Find Program To Update
    const programFound = await ProgramDivision.findOne({ _id: programId });
    if (!programFound) {
      res.status(404).json({
        errorMessage: {
          message: ["Programme data not found!"],
        },
      });
      return;
    }
    //Find Existing Program
    const existingProgramFound = await ProgramDivision.findOne({
      _id: programId,
      divisionName: name,
    });
    if (existingProgramFound) {
      res.status(404).json({
        errorMessage: {
          message: [`${name} Programme already exists!`],
        },
      });
      return;
    }
    const adminFound = await User.findOne({ _id: lastUpdatedBy });
    if (adminFound) {
      const updatedProgram = await ProgramDivision.findOneAndUpdate(
        programFound?._id,
        {
          divisionName: name,
          lastUpdatedBy,
        },
        {
          new: true,
        }
      );
      res.status(201).json({
        successMessage: "Programme updated successfully!",
        updatedProgram,
      });
    } else {
      res.status(404).json({
        errorMessage: {
          message: ["Operation Denied! You're Not An Admin!"],
        },
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      errorMessage: {
        message: ["Something went wrong!"],
      },
    });
  }
};
// Delete  Program ✅
exports.deleteDivisionProgram = async (req, res) => {
  const { programId } = req.params;
  const { deletedBy } = req.body;
  try {
    const programToDelete = await ProgramDivision.findOne({ _id: programId });
    if (!programToDelete) {
      return res.status(404).json({
        errorMessage: {
          message: ["Program data not found!"],
        },
      });
    }
    const programFound = await Program.findOne({
      _id: programToDelete?.programId,
    });
    //Find all students school data having program with id same as programId
    // const allStudents = await User.find({
    //   "studentSchoolData.program": programId,
    // });
    //Find Admin
    const foundAdmin = await User.findOne({ _id: deletedBy });
    if (!foundAdmin) {
      return res.status(403).json({
        errorMessage: {
          message: ["Operation Denied! You're Not An Admin!"],
        },
      });
    } else {
      const deletedProgram = await ProgramDivision.findByIdAndDelete({
        _id: programId,
      });
      if (
        programFound &&
        programFound?.programDivisions?.includes(deletedProgram?._id)
      ) {
        await Program.findOneAndUpdate(
          programFound?._id,
          { $pull: { programDivisions: deletedProgram?._id } },
          { new: true }
        );
      }
      if (
        deletedProgram &&
        foundAdmin &&
        foundAdmin?.adminActionsData?.programs?.includes(deletedProgram?._id)
      ) {
        await User.findOneAndUpdate(
          foundAdmin?._id,
          { $pull: { "adminActionsData.programs": deletedProgram?._id } },
          { new: true }
        );
      }
      res.status(201).json({
        successMessage: "Academic Programme Deleted Successfully",
        deletedProgram,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      errorMessage: {
        message: ["Something went wrong!"],
      },
    });
  }
};
