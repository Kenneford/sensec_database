const ClassLevelSection = require("../../models/academics/class/ClassLevelSectionModel");
const ProgramDivision = require("../../models/academics/programmes/divisions/ProgramDivisionModel");
const Program = require("../../models/academics/programmes/ProgramsModel");
const User = require("../../models/user/UserModel");

async function validateSubjectData(req, res, next) {}

async function findSectionProgramme(req, res, next) {
  const { data } = req.body;
  console.log(data);

  try {
    let programFound;
    if (data?.divisionProgramId) {
      programFound = await ProgramDivision.findOne({
        _id: data?.divisionProgramId,
      });
      req.sectionProgram = { programFound, isDivisionProgram: true };
      next();
    } else if (data?.programId) {
      programFound = await Program.findOne({
        _id: data?.programId,
      });
      req.sectionProgram = { programFound, isDivisionProgram: false };
      next();
    } else {
      res.status(404).json({
        errorMessage: {
          message: ["No programme data found!"],
        },
      });
      return;
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      errorMessage: {
        message: ["Internal Server Error!"],
      },
    });
  }
}
async function validateClassSection(req, res, next) {
  const { data } = req.body;
  try {
    const classSectionFound = await ClassLevelSection.findOne({
      _id: data?.classSectionId,
    });
    if (!classSectionFound) {
      res.status(404).json({
        errorMessage: {
          message: ["Class section data not found!"],
        },
      });
      return;
    }
    req.classSectionFound = classSectionFound;
    next();
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      errorMessage: {
        message: [`Internal Server Error! ${error?.message}`],
      },
    });
  }
}
async function hasLecturer(req, res, next) {
  const currentUser = req.user;
  const classSectionFound = req.classSectionFound;
  try {
    const classLecturerFound = await User.findOne({
      "lecturerSchoolData.classLevelHandling": classSectionFound?._id,
    });
    if (classLecturerFound) {
      res.status(403).json({
        errorMessage: {
          message: ["Existing class Lecturer found!"],
        },
      });
      return;
    }
    //Find Admin
    const adminFound = await User.findOne({ _id: data?.lecturerAssignedBy });
    if (!adminFound || !currentUser?.roles?.includes("admin")) {
      res.status(403).json({
        errorMessage: {
          message: ["Operation denied! You're not an admin!"],
        },
      });
      return;
    }
    if (currentUser?.id !== data?.lecturerAssignedBy) {
      res.status(403).json({
        errorMessage: {
          message: ["Operation denied! You're not an admin!"],
        },
      });
      return;
    }
    req.adminFound = adminFound;
    next();
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      errorMessage: {
        message: [`Internal Server Error! ${error?.message}`],
      },
    });
  }
}
async function validateLecturer(req, res, next) {
  const { data } = req.body;
  try {
    // Find lecturer
    const lecturerFound = await User.findOne({ uniqueId: data?.lecturerId });
    if (!lecturerFound) {
      res.status(404).json({
        errorMessage: {
          message: [`Lecturer data not found!`],
        },
      });
      return;
    }
    // Check if lecturer's employment has been approved
    if (
      (lecturerFound && !lecturerFound?.lecturerStatusExtend?.isLecturer) ||
      lecturerFound?.employment?.employmentStatus !== "approved"
    ) {
      res.status(404).json({
        errorMessage: {
          message: [`Lecturer not yet approved!`],
        },
      });
      return;
    }
    // Check if lecturer already has a class
    if (
      lecturerFound &&
      lecturerFound?.lecturerSchoolData?.isClassLevelTeacher
    ) {
      res.status(404).json({
        errorMessage: {
          message: [`Lecturer already has a class handling!`],
        },
      });
      return;
    }
    req.lecturerFound = lecturerFound;
    next();
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      errorMessage: {
        message: [`Internal Server Error! ${error?.message}`],
      },
    });
  }
}

module.exports = {
  findSectionProgramme,
  validateClassSection,
  hasLecturer,
  validateLecturer,
};
