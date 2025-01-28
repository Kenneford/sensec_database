const ProgramDivision = require("../../../models/academics/programmes/divisions/ProgramDivisionModel");
const Program = require("../../../models/academics/programmes/ProgramsModel");
const User = require("../../../models/user/UserModel");

// Create program ✅
module.exports.createProgram = async (req, res) => {
  const data = req.body;
  const user = req.user;
  // console.log(data);
  try {
    //Find Admin
    const foundAdmin = await User.findOne({ _id: data?.createdBy });

    if (!foundAdmin || !user?.roles?.includes("Admin")) {
      res.status(403).json({
        errorMessage: {
          message: ["Operation Denied! You're not an admin!"],
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
// Get all Program Students ✅
exports.getAllProgramStudents = async (req, res) => {
  const { programId } = req.params;
  console.log(programId);

  try {
    const programFound = await Program.findOne({ _id: programId });
    if (!programFound) {
      return res.status(404).json({
        errorMessage: {
          message: ["Program data not found!"],
        },
      });
    }
    let students;

    if (!programFound?.programDivisions?.length > 0) {
      // Query students directly linked to the standalone programme
      students = await User.find({
        "studentSchoolData.program.programId": programId,
      });
    } else {
      // Query subdivisions linked to the main programme
      const subdivisions = await ProgramDivision.find({ programId });
      console.log("subdivisions: ", subdivisions);

      // Extract all subdivision IDs
      const subdivisionIds = subdivisions?.map((sub) => sub?._id);

      // Query students linked to subdivisions
      students = await User.find({
        "studentSchoolData.program.programId": { $in: subdivisionIds },
      });
    }

    res.status(201).json({
      successMessage: "Programs fetched successfully...",
      programStudentFound: students,
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
        populate: [
          {
            path: "electiveSubjects", // Nested populate for programDivisions
          },
          {
            path: "optionalElectiveSubjects", // Another nested populate
          },
        ],
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
  const data = req.body;
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
      name: data?.updatedProgramName,
    });
    if (existingProgramFound) {
      res.status(404).json({
        errorMessage: {
          message: [`${name} Programme already exists!`],
        },
      });
      return;
    }
    const adminFound = await User.findOne({ _id: data?.lastUpdatedBy });
    if (adminFound) {
      const updatedProgram = await Program.findOneAndUpdate(
        programFound?._id,
        {
          name: data?.updatedProgramName,
          lastUpdatedBy: data?.lastUpdatedBy,
          previouslyUpdatedBy: programFound?.lastUpdatedBy,
          previousUpdateDate: programFound?.updatedAt,
          description: `This is ${data?.updatedProgramName} programme`,
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
  const currentUser = req.user;
  const { programId } = req.params;
  const { deletedBy } = req.body;
  try {
    const programToDelete = await Program.findOne({ _id: programId });
    const mainProgram = await Program.findOne({ _id: programId });
    const divisionProgram = await ProgramDivision.findOne({ _id: programId });
    if (!mainProgram && !divisionProgram) {
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
    const adminFound = await User.findOne({ _id: currentUser?.id });
    if (!adminFound || !currentUser?.roles?.includes("Admin")) {
      res.status(403).json({
        errorMessage: {
          message: ["Operation denied! You're not an admin!"],
        },
      });
      return;
    }
    let deletedProgram;
    if (mainProgram) {
      deletedProgram = await Program.findByIdAndDelete({
        _id: programId,
      });
    }
    if (divisionProgram) {
      deletedProgram = await ProgramDivision.findByIdAndDelete({
        _id: programId,
      });
    }
    res.status(201).json({
      successMessage: "Programme deleted successfully!",
      deletedProgram,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      errorMessage: {
        message: ["Something went wrong!"],
      },
    });
  }
};
