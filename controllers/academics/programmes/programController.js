const Program = require("../../../models/academics/programmes/ProgramsModel");
const User = require("../../../models/user/UserModel");

// Create program ✅
module.exports.createProgram = async (req, res) => {
  const data = req.body;
  // const user = req.user;
  const user = { roles: ["admin"] }; //❓Will Be Deleted After Users Can Login❓
  console.log(data);
  try {
    //Find Admin
    const foundAdmin = await User.findOne({ _id: data?.createdBy });

    if (!foundAdmin || !user?.roles?.includes("admin")) {
      res.status(403).json({
        errorMessage: {
          message: ["Operation Denied! You're Not An Admin!"],
        },
      });
      return;
    }
    if (!data?.name) {
      res.status(403).json({
        errorMessage: {
          message: ["Programme's name required!"],
        },
      });
      return;
    }
    //check if exists
    const program = await Program.findOne({ name: data?.name });
    if (program) {
      res.status(500).json({
        errorMessage: {
          message: ["Program already exists!"],
        },
      });
      return;
    }
    const programmeCreated = await Program.create({
      name: data?.name,
      createdBy: data?.createdBy,
    });
    try {
      //   push program into admin's programs array✅
      if (
        foundAdmin &&
        !foundAdmin?.adminActionsData?.programs?.includes(programmeCreated?._id)
      ) {
        await User.findOneAndUpdate(
          foundAdmin?._id,
          {
            $push: {
              "adminActionsData.programs": programmeCreated?._id,
            },
          },
          { upsert: true }
        );
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        errorMessage: {
          message: ["Internal Server Error!"],
        },
      });
    }
    res.status(201).json({
      successMessage: "Program Created Successfully",
      programme: programmeCreated,
    });
    console.log("Program Created Successfully");
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      errorMessage: {
        message: ["Something went wrong!"],
      },
    });
  }
};

// Get all Programs ✅
exports.getAllPrograms = async (req, res) => {
  try {
    const programs = await Program.find({}).populate([
      {
        path: "electiveSubjects",
      },
      {
        path: "optionalElectiveSubjects",
      },
      {
        path: "programDivisions",
      },
      {
        path: "createdBy",
      },
      {
        path: "lastUpdatedBy",
      },
    ]);
    res.status(201).json({
      successMessage: "Programs fetched successfully...",
      programs,
    });
  } catch (error) {
    return res.status(400).json({
      errorMessage: {
        message: ["Programs fetching failed!"],
      },
    });
  }
};
// Get all Programs ✅
exports.getAllFlattenedProgrammes = async (req, res) => {
  try {
    const programs = await Program.find({}).populate([
      {
        path: "electiveSubjects",
      },
      {
        path: "optionalElectiveSubjects",
      },
      {
        path: "programDivisions",
      },
      {
        path: "createdBy",
      },
      {
        path: "lastUpdatedBy",
      },
    ]);
    const flattenedProgrammes = programs.flatMap((programme) => {
      if (!programme?.hasDivisions) {
        // If no subdivisions, include the standalone programme
        return programme;
      } else {
        // If subdivisions exist, include only the subdivisions
        return programme.programDivisions.map((sub) => sub);
      }
    });
    // Result: Flattened list of programmes
    // console.log(flattenedProgrammes);
    res.status(201).json({
      successMessage: "Programs fetched successfully...",
      flattenedProgrammes,
    });
  } catch (error) {
    return res.status(400).json({
      errorMessage: {
        message: ["Programs fetching failed!"],
      },
    });
  }
};

// Get single Program ✅
exports.getSingleProgram = async (req, res) => {
  const { programId } = req.params;
  try {
    const program = await Program.findOne({
      _id: programId,
    }).populate([
      {
        path: "electiveSubjects",
      },
      {
        path: "optionalElectiveSubjects",
      },
      {
        path: "programDivisions",
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

// Update Program ✅
exports.updateProgram = async (req, res) => {
  const { programId } = req.params;
  const { name, lastUpdatedBy } = req.body;
  try {
    //Find Program To Update
    const programFound = await Program.findOne({ _id: programId });
    if (!programFound) {
      res.status(404).json({
        errorMessage: {
          message: ["Programme data not found!"],
        },
      });
      return;
    }
    //Find Existing Program
    const existingProgramFound = await Program.findOne({
      _id: programId,
      name,
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
      const updatedProgram = await Program.findOneAndUpdate(
        programFound?._id,
        {
          name,
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
exports.deleteProgram = async (req, res) => {
  const { programId } = req.params;
  const { deletedBy } = req.body;
  try {
    const programToDelete = await Program.findOne({ _id: programId });
    if (!programToDelete) {
      return res.status(404).json({
        errorMessage: {
          message: ["Program data not found!"],
        },
      });
    }
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
      const deletedProgram = await Program.findByIdAndDelete({
        _id: programId,
      });
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
