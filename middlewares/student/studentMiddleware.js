const { handleErrorFunction } = require("../../errors/errorFunction");
const ClassLevel = require("../../models/academics/class/ClassLevelModel");
const ClassLevelSection = require("../../models/academics/class/ClassLevelSectionModel");
const ProgramDivision = require("../../models/academics/programmes/divisions/ProgramDivisionModel");
const Program = require("../../models/academics/programmes/ProgramsModel");
const Subject = require("../../models/academics/subjects/SubjectModel");
const PlacementStudent = require("../../models/PlacementStudent/PlacementStudentModel");
const User = require("../../models/user/UserModel");
const cloudinary = require("../cloudinary/cloudinary");

async function findSectionProgramme(req, res, next) {
  const data = req.body;
  try {
    let programFound;
    if (data?.newStudent?.divisionProgram) {
      programFound = await ProgramDivision.findOne({
        _id: data?.newStudent?.divisionProgram,
      });
      req.sectionProgram = { programFound, isDivisionProgram: true };
      next();
    } else if (data?.newStudent?.program) {
      programFound = await Program.findOne({
        _id: data?.newStudent?.program,
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
async function validateStudentPlacementData(req, res, next) {
  const { data } = req.body;
  console.log(data?.newStudent, "Student");
  console.log(data?.dateOfBirth, "Date Of Birth");

  try {
    // Find placement student✅
    const placementStudentFound = await PlacementStudent.findOne({
      jhsIndexNo: data?.newStudent?.jhsIndexNo,
    });

    // Validate placement student data
    if (!placementStudentFound) {
      res.status(404).json({
        errorMessage: {
          message: [`Placement data not found!`],
        },
      });
      return;
    }
    // Validate student's JHS completion year
    if (
      placementStudentFound?.yearGraduated !== data?.newStudent?.completedJhs
    ) {
      res.status(400).json({
        errorMessage: {
          message: [`Please provide the right year of completion!`],
        },
      });
      return;
    }
    // Validate student's JHS attended
    if (placementStudentFound?.jhsAttended !== data?.newStudent?.jhsAttended) {
      res.status(400).json({
        errorMessage: {
          message: [`Please provide the right JHS attended!`],
        },
      });
      return;
    }
    // Validate student's gender
    if (placementStudentFound?.gender !== data?.newStudent?.gender) {
      res.status(400).json({
        errorMessage: {
          message: [
            `Gender status selected does not match the one on your placement data!`,
          ],
        },
      });
      return;
    }
    // Validate student's selected residentialStatus
    if (
      placementStudentFound?.boardingStatus !==
      data?.newStudent?.residentialStatus
    ) {
      res.status(400).json({
        errorMessage: {
          message: [
            `Residential status selected does not match your boarding status!`,
          ],
        },
      });
      return;
    }
    // Validate student's date of birth
    // Convert both placement dates (from frontend data & backend) to string before validating
    const placementDOB = placementStudentFound?.dateOfBirth
      .toISOString()
      .split("T")[0];
    const inputDOB = new Date(data?.dateOfBirth).toISOString().split("T")[0];

    if (placementDOB && inputDOB && inputDOB !== placementDOB) {
      res.status(400).json({
        errorMessage: {
          message: [
            `Date of birth does not match the one on your placement data!`,
          ],
        },
      });
      return;
    }
    // Validate student's contact
    if (placementStudentFound?.smsContact !== data?.newStudent?.mobile) {
      res.status(400).json({
        errorMessage: {
          message: [
            `Contact number does not match the one on your placement data!`,
          ],
        },
      });
      return;
    }
    // Validate student's name
    if (
      placementStudentFound?.firstName !== data?.newStudent?.firstName ||
      placementStudentFound?.lastName !== data?.newStudent?.lastName
    ) {
      res.status(400).json({
        errorMessage: {
          message: [`It looks like some name credentials are incorrect!`],
        },
      });
      return;
    }
    req.placementStudent = placementStudentFound;
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({
      errorMessage: {
        message: ["Internal Server Error!"],
      },
    });
  }
}
async function studentProgramme(req, res, next) {
  const { data } = req.body;

  try {
    // Find placement student✅
    const placementStudentFound = await PlacementStudent.findOne({
      jhsIndexNo: data?.newStudent?.jhsIndexNo,
    });
    //Find student's Program✅
    const mainProgramFound = await Program.findOne({
      _id: data?.newStudent?.program,
    });
    if (!mainProgramFound) {
      res.status(404).json({
        errorMessage: {
          message: [`Student's Program Not Found!`],
        },
      });
      return;
    }
    // Validate student's selected program✅
    if (
      placementStudentFound &&
      placementStudentFound?.programme !== mainProgramFound?.name
    ) {
      res.status(400).json({
        errorMessage: {
          message: [
            `Programme selected does not match your placement programme!`,
          ],
        },
      });
      return;
    }
    if (data?.newStudent?.divisionProgram) {
      const studentDivisionProgramFound = await ProgramDivision.findOne({
        _id: data?.newStudent?.divisionProgram,
      });
      if (
        studentDivisionProgramFound?.optionalElectiveSubjects?.length > 0 &&
        !data?.newStudent?.optionalElectiveSubject
      ) {
        res.status(404).json({
          errorMessage: {
            message: [`Selection Of One Optional Elective Subject Required!`],
          },
        });
        return;
      }
      req.program = {
        mainProgramFound,
        studentDivisionProgramFound,
        coreSubjects,
        isDivisionProgram: true,
      };
      next();
    } else if (data?.newStudent?.program) {
      if (
        mainProgramFound?.optionalElectiveSubjects?.length > 1 &&
        !data?.newStudent?.optionalElectiveSubject
      ) {
        res.status(404).json({
          errorMessage: {
            message: [`Selection Of One Optional Elective Subject Required!`],
          },
        });
        return;
      }
      req.program = {
        mainProgramFound,
        isDivisionProgram: false,
      };
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
async function studentClass(req, res, next) {
  const { data } = req.body;
  try {
    // find student's class level
    const studentClassLevel = await ClassLevel.findOne({
      _id: data?.newStudent?.currentClassLevel,
    });
    if (!studentClassLevel) {
      res.status(404).json({
        errorMessage: {
          message: [`Student's Class Level Not Found!`],
        },
      });
      return;
    }
    let classSectionFound;
    if (data?.newStudent?.divisionProgram) {
      // find student's class level section✅
      classSectionFound = await ClassLevelSection.findOne({
        classLevelId: data?.newStudent?.currentClassLevel,
        // program:data?.newStudent?.program,
        divisionProgram: data?.newStudent?.divisionProgram,
      });
      req.studentClassInfo = { studentClassLevel, classSectionFound };
      next();
    } else if (data?.newStudent?.program) {
      // find student's class level section✅
      classSectionFound = await ClassLevelSection.findOne({
        classLevelId: data?.newStudent?.currentClassLevel,
        program: data?.newStudent?.program,
      });
      req.studentClassInfo = { studentClassLevel, classSectionFound };
      next();
    } else {
      res.status(404).json({
        errorMessage: {
          message: [`Student's class section not found!`],
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
async function updateApprovedStudentData(req, res, next) {
  const currentUser = req.user;
  const { studentId } = req.params;
  const { enrolmentApprovedBy } = req.body;
  console.log(enrolmentApprovedBy);

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
    if (currentUser?.id !== enrolmentApprovedBy) {
      res.status(403).json({
        errorMessage: {
          message: ["Operation Denied! You're Not An Admingfhj!"],
        },
      });
      return;
    }
    //Find student
    const studentFound = await User.findOne({ uniqueId: studentId });
    // console.log(studentFound, "L-240");
    if (!studentFound) {
      res.status(404).json({
        errorMessage: {
          message: ["Student Data Not Found!"],
        },
      });
      return;
    }
    if (studentFound?.studentStatusExtend?.enrollmentStatus === "approved") {
      res.status(400).json({
        errorMessage: {
          message: ["Enrollment already approved!"],
        },
      });
      return;
    }
    // Push student into his classLevel students array ✅
    if (
      !studentFound?.studentSchoolData?.classLevels?.includes(
        studentFound?.studentSchoolData?.currentClassLevel
      )
    ) {
      studentFound.studentSchoolData.classLevels.push(
        studentFound?.studentSchoolData?.currentClassLevel
      );
      await studentFound.save();
    }
    // push current academic year into students academic years array ✅
    if (
      !studentFound?.studentSchoolData?.academicYears?.includes(
        studentFound?.studentSchoolData?.currentAcademicYear
      )
    ) {
      studentFound.studentSchoolData.academicYears.push(
        studentFound?.studentSchoolData?.currentAcademicYear
      );
      await studentFound.save();
    }
    req.enrollmentApprovalData = { studentFound, adminFound };
    next();
  } catch (error) {
    res.status(500).json({
      errorMessage: {
        message: [`Internal Server Error!`],
      },
    });
    return;
  }
}
module.exports = {
  findSectionProgramme,
  validateStudentPlacementData,
  studentProgramme,
  studentClass,
  updateApprovedStudentData,
};
