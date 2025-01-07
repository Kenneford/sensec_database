const User = require("../../models/user/UserModel");
const Subject = require("../../models/academics/subjects/SubjectModel");
const Program = require("../../models/academics/programmes/ProgramsModel");
const ProgramDivision = require("../../models/academics/programmes/divisions/ProgramDivisionModel");

async function validateSubjectData(req, res, next) {
  const currentUser = req.user;
  const { data } = req.body;
  try {
    //Find Admin
    const adminFound = await User.findOne({ _id: data?.createdBy });
    if (!adminFound || !currentUser?.roles?.includes("Admin")) {
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
    req.data = { data, adminFound };
    next();
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      errorMessage: {
        message: [error?.message],
      },
    });
  }
}
async function coreSubject(req, res, next) {
  const { data, adminFound } = req.data;
  try {
    if (data?.isCore) {
      //check if subject exist
      const subject = await Subject.findOne({
        subjectName: data?.subjectName,
        "coreSubInfo.isCoreSubject": true,
      });
      if (subject) {
        res.status(400).json({
          errorMessage: {
            message: [`Core subject already exists!`],
          },
        });
        return;
      }
      // Get all students
      const allStudents = await User.find({ roles: ["student"] });
      // Create subject
      const subjectCreated = await Subject.create({
        subjectName: data?.subjectName,
        "coreSubInfo.isCoreSubject": true,
        createdBy: adminFound?._id,
      });
      // Push core subject into each student's core subjects✅
      allStudents?.forEach(async (student) => {
        if (
          student &&
          !student?.studentSchoolData?.coreSubjects?.includes(
            subjectCreated?._id
          )
        ) {
          await User.findOneAndUpdate(
            student?._id,
            {
              $push: {
                "studentSchoolData.coreSubjects": subjectCreated?._id,
              },
            },
            { upsert: true }
          );
        }
      });
      req.subjectCreated = subjectCreated;
      next();
    } else {
      next();
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      errorMessage: {
        message: [`Internal Server Error! ${error?.message}`],
      },
    });
  }
}
async function programmeElectiveSubject(req, res, next) {
  const { data, adminFound } = req.data;
  try {
    if (data?.divisionProgramId === "") {
      const programFound = await Program.findOne({
        _id: data?.programId,
      });
      if (!programFound) {
        res.status(404).json({
          errorMessage: {
            message: [`Elective subject's programme not found!`],
          },
        });
        return;
      }
      //Find all students this programme
      const allStudents = await User.find({
        "studentSchoolData.program": programFound?._id,
      });
      //check if subject exist
      const subject = await Subject.findOne({
        subjectName: data?.subjectName,
        "electiveSubInfo.programId": data?.programId,
        "electiveSubInfo.isOptional": data?.isOptional,
      });
      if (subject) {
        res.status(400).json({
          errorMessage: {
            message: [`Elective subject already exists!`],
          },
        });
        return;
      }
      //create new subject
      const subjectCreated = await Subject.create({
        subjectName: data?.subjectName,
        "electiveSubInfo.programId": data?.programId,
        "electiveSubInfo.isOptional":
          data?.isOptional === "" ? false : data?.isOptional,
        createdBy: adminFound?._id,
      });
      //If not an optional subject, push subject into main program's elective subjects array✅
      if (
        !subjectCreated?.electiveSubInfo?.isOptional &&
        !programFound.electiveSubjects.includes(subjectCreated?._id)
      ) {
        programFound.electiveSubjects.push(subjectCreated?._id);
        await programFound.save();
      }
      //If it's an optional subject, push into main program's optional subject's array
      if (
        subjectCreated?.electiveSubInfo?.isOptional &&
        !programFound?.optionalElectiveSubjects?.includes(subjectCreated?._id)
      ) {
        programFound.optionalElectiveSubjects.push(subjectCreated?._id);
        await programFound.save();
      }
      // Push non-optional elective subject into each student's elective subjects✅
      if (!subjectCreated?.electiveSubInfo?.isOptional) {
        allStudents?.forEach(async (student) => {
          if (
            !student?.studentSchoolData?.electiveSubjects?.includes(
              subjectCreated?._id
            )
          ) {
            await User.findOneAndUpdate(
              student?._id,
              {
                $push: {
                  "studentSchoolData.electiveSubjects": subjectCreated?._id,
                },
              },
              { upsert: true }
            );
          }
        });
      }
      req.subjectCreated = subjectCreated;
      next();
    } else {
      next();
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      errorMessage: {
        message: [`Internal Server Error! ${error?.message}`],
      },
    });
  }
}
async function divisionProgrammeElectiveSubject(req, res, next) {
  const { data, adminFound } = req.data;
  try {
    if (data?.divisionProgramId !== "") {
      const divisionProgramFound = await ProgramDivision.findOne({
        _id: data?.divisionProgramId,
      });
      if (!divisionProgramFound) {
        res.status(404).json({
          errorMessage: {
            message: [`Elective subject's programme not found!`],
          },
        });
        return;
      }
      //Find all students this programme
      const allStudents = await User.find({
        "studentSchoolData.divisionProgram": divisionProgramFound?._id,
      });
      //check if subject exist
      const subject = await Subject.findOne({
        subjectName: data?.subjectName,
        // "electiveSubInfo.programId": data?.programId,
        "electiveSubInfo.divisionProgramId": data?.divisionProgramId,
        "electiveSubInfo.isOptional": data?.isOptional,
      });
      if (subject) {
        res.status(400).json({
          errorMessage: {
            message: [`Elective subject already exists!`],
          },
        });
        return;
      }
      //create new subject
      const subjectCreated = await Subject.create({
        subjectName: data?.subjectName,
        "electiveSubInfo.programId": data?.programId,
        "electiveSubInfo.divisionProgramId": data?.divisionProgramId,
        "electiveSubInfo.isOptional": data?.isOptional,
        createdBy: adminFound?._id,
      });
      //If not optional subject, push subject into division program's elective subjects✅
      if (
        !subjectCreated?.electiveSubInfo?.isOptional &&
        divisionProgramFound &&
        !divisionProgramFound.electiveSubjects.includes(subjectCreated?._id)
      ) {
        divisionProgramFound.electiveSubjects.push(subjectCreated?._id);
        await divisionProgramFound.save();
      }
      //If optional subject, push into division program's optional subject's array
      if (
        subjectCreated?.electiveSubInfo?.isOptional &&
        divisionProgramFound &&
        !divisionProgramFound?.optionalElectiveSubjects?.includes(
          subjectCreated?._id
        )
      ) {
        divisionProgramFound.optionalElectiveSubjects.push(subjectCreated?._id);
        await divisionProgramFound.save();
      }
      // Push non0optional elective subject into each student's elective subjects✅
      if (!subjectCreated?.electiveSubInfo?.isOptional) {
        allStudents?.forEach(async (student) => {
          if (
            !student?.studentSchoolData?.electiveSubjects?.includes(
              subjectCreated?._id
            )
          ) {
            await User.findOneAndUpdate(
              student?._id,
              {
                $push: {
                  "studentSchoolData.electiveSubjects": subjectCreated?._id,
                },
              },
              { upsert: true }
            );
          }
        });
      }
      req.subjectCreated = subjectCreated;
      next();
    } else {
      next();
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      errorMessage: {
        message: [`Internal Server Error! ${error?.message}`],
      },
    });
  }
}
async function assignElectiveSubject(req, res, next) {
  const currentUser = req.user;
  const data = req.body;
  const { subjectId } = req.params;
  try {
    //Find Admin
    const adminFound = await User.findOne({ _id: data?.lastUpdatedBy });
    if (!adminFound || !currentUser?.roles?.includes("Admin")) {
      res.status(403).json({
        errorMessage: {
          message: ["Operation Denied! You're not an admin!"],
        },
      });
      return;
    }
    //Find Lecturer
    const lecturerFound = await User.findOne({ _id: data?.currentTeacher });
    if (!lecturerFound) {
      res.status(404).json({
        errorMessage: {
          message: ["Lecturer data not found!"],
        },
      });
      return;
    }
    //Find subject by ID
    const subjectFound = await Subject.findOne({ _id: subjectId });
    if (!subjectFound) {
      res.status(404).json({
        errorMessage: {
          message: ["Subject data not found!"],
        },
      });
      return;
    }
    if (
      subjectFound?.currentTeacher?.toString() ===
      lecturerFound?._id?.toString()
    ) {
      res.status(403).json({
        errorMessage: {
          message: ["Lecturer is subject's current teacher!"],
        },
      });
      return;
    }
    if (subjectFound?.electiveSubInfo) {
      const allUsers = await User.find({});
      //Find Students
      const electiveStudentsFound = allUsers.filter((std) =>
        std?.studentSchoolData?.electiveSubjects?.includes(subjectFound?._id)
      );
      const updatedSubject = await Subject.findOneAndUpdate(
        subjectFound?._id,
        {
          currentTeacher: data?.currentTeacher,
          lastUpdatedBy: data?.lastUpdatedBy,
        },
        {
          new: true,
        }
      );
      if (
        updatedSubject &&
        !updatedSubject?.teachers?.includes(lecturerFound?._id)
      ) {
        updatedSubject.teachers.push(lecturerFound?._id);
        await updatedSubject.save();
      }
      if (
        lecturerFound &&
        !lecturerFound?.lecturerSchoolData?.teachingSubjects?.includes(
          updatedSubject?._id
        )
      ) {
        lecturerFound.lecturerSchoolData.teachingSubjects.push(
          updatedSubject?._id
        );
        await lecturerFound.save();
      }
      if (electiveStudentsFound) {
        electiveStudentsFound?.forEach(async (std) => {
          if (
            std &&
            lecturerFound &&
            !lecturerFound?.lecturerSchoolData?.students?.includes(std?._id)
          ) {
            await User?.findOneAndUpdate(
              lecturerFound?._id,
              {
                $push: { "lecturerSchoolData.students": std?._id },
              },
              { upsert: true }
            );
            // lecturerFound.lecturerSchoolData.students.push(std?._id);
            // await lecturerFound.save();
          }
        });
      }
      req.assignSubjectLecturerData = {
        subjectFound,
        lecturerFound,
        updatedSubject,
      };
      next();
    } else {
      next();
    }
  } catch (error) {
    res.status(500).json({
      errorMessage: {
        message: ["Something went wrong!", error?.message],
      },
    });
  }
}
async function assignCoreSubject(req, res, next) {
  const data = req.body;
  const { subjectFound, lecturerFound, updatedSubject } =
    req.assignSubjectLecturerData;
  try {
    if (
      lecturerFound &&
      subjectFound &&
      subjectFound?.currentTeacher === lecturerFound?._id
    ) {
      res.status(403).json({
        errorMessage: {
          message: ["Lecturer is subject's current teacher!"],
        },
      });
      return;
    }
    if (subjectFound?.coreSubInfo) {
      const allUsers = await User.find({});
      //Find Students
      const electiveStudentsFound = allUsers.filter((std) =>
        std?.studentSchoolData?.coreSubjects?.includes(subjectFound?._id)
      );
      const updatedSubject = await Subject.findOneAndUpdate(
        subjectFound?._id,
        {
          currentTeacher: data?.currentTeacher,
          lastUpdatedBy: data?.lastUpdatedBy,
        },
        {
          new: true,
        }
      );
      // Push lecturer into subjects teachers arrays
      if (
        updatedSubject &&
        !updatedSubject?.teachers?.includes(lecturerFound?._id)
      ) {
        updatedSubject.teachers.push(lecturerFound?._id);
        await updatedSubject.save();
      }
      // Push subject into teachers teaching subjects arrays
      if (
        lecturerFound &&
        !lecturerFound?.lecturerSchoolData?.teachingSubjects?.includes(
          updatedSubject?._id
        )
      ) {
        lecturerFound.lecturerSchoolData.teachingSubjects.push(
          updatedSubject?._id
        );
        await lecturerFound.save();
      }
      // Push found students into teacher's students arrays
      if (electiveStudentsFound) {
        electiveStudentsFound?.forEach(async (std) => {
          if (
            std &&
            lecturerFound &&
            !lecturerFound?.lecturerSchoolData?.students?.includes(std?._id)
          ) {
            await User?.findOneAndUpdate(
              lecturerFound?._id,
              {
                $push: { "lecturerSchoolData.students": std?._id },
              },
              { upsert: true }
            );
            // lecturerFound.lecturerSchoolData.students.push(std?._id);
            // await lecturerFound.save();
          }
        });
      }
      req.assignSubjectLecturerData = {
        subjectFound,
        lecturerFound,
        updatedSubject,
      };
      next();
    } else {
      req.assignSubjectLecturerData = {
        subjectFound,
        lecturerFound,
        updatedSubject,
      };
      next();
    }
  } catch (error) {
    res.status(500).json({
      errorMessage: {
        message: ["Something went wrong!", error?.message],
      },
    });
  }
}
module.exports = {
  validateSubjectData,
  coreSubject,
  programmeElectiveSubject,
  divisionProgrammeElectiveSubject,
  assignElectiveSubject,
  assignCoreSubject,
};
