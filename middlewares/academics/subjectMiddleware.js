const User = require("../../models/user/UserModel");
const Subject = require("../../models/academics/subjects/SubjectModel");
const Program = require("../../models/academics/programmes/ProgramsModel");
const ProgramDivision = require("../../models/academics/programmes/divisions/ProgramDivisionModel");
const ClassLevel = require("../../models/academics/class/ClassLevelModel");
const mongoose = require("mongoose");

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
async function subjectLecturers(req, res, next) {
  const currentUser = req.user;
  const { subjectId } = req.params;
  console.log("subjectId: ", subjectId);

  try {
    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(403).json({
        errorMessage: {
          message: ["Invalid object ID detected!"],
        },
      });
    }
    //Find Admin
    const adminFound = await User.findOne({ _id: currentUser?.id });
    if (!adminFound || !currentUser?.roles?.includes("Admin")) {
      res.status(403).json({
        errorMessage: {
          message: ["Operation Denied! You're not an admin!"],
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
    //Find existing subject lecturers
    const existingSubjectLecturers = await User.find(
      {
        $or: [
          {
            "lecturerSchoolData.teachingSubjects.electives": {
              $elemMatch: {
                subject: subjectFound?._id,
              },
            },
          },
          {
            "lecturerSchoolData.teachingSubjects.cores": {
              $elemMatch: {
                subject: subjectFound?._id,
              },
            },
          },
        ],
      },
      {
        // Project only required fields
        // name: 1,
        uniqueId: 1,
        personalInfo: 1,
        "lecturerSchoolData.teachingSubjects.electives": 2,
        "lecturerSchoolData.teachingSubjects.cores": 2,
      }
    ).populate([
      {
        path: "lecturerSchoolData.teachingSubjects.electives.students", // Path to populate
        // model: "User", // Model to reference
        // match: { active: true }, // (Optional) Filter students if needed
        select:
          "_id uniqueId personalInfo.profilePicture personalInfo.fullName", // (Optional) Specify fields to include
      },
      {
        path: "lecturerSchoolData.teachingSubjects.electives.subject", // Path to populate
        select: "subjectName subjectInfo",
      },
      {
        path: "lecturerSchoolData.teachingSubjects.cores.students", // Path to populate
        // model: "User", // Model to reference
        // match: { active: true }, // (Optional) Filter students if needed
        select:
          "_id uniqueId personalInfo.profilePicture personalInfo.fullName", // (Optional) Specify fields to include
      },
      {
        path: "lecturerSchoolData.teachingSubjects.cores.subject", // Path to populate
        select: "subjectName subjectInfo",
      },
      {
        path: "lecturerSchoolData.teachingSubjects.electives.classLevel", // Path to populate
        select: "name",
      },
      {
        path: "lecturerSchoolData.teachingSubjects.electives.program", // Path to populate
        select: "name",
      },
      {
        path: "lecturerSchoolData.teachingSubjects.electives.programDivision", // Path to populate
        select: "divisionName",
      },
      {
        path: "lecturerSchoolData.teachingSubjects.cores.classLevel", // Path to populate
        select: "name",
      },
      {
        path: "lecturerSchoolData.teachingSubjects.cores.programmes.programId", // Path to populate
        select: "name",
      },
      // {
      //   path: "lecturerSchoolData.teachingSubjects.cores.programDivision", // Path to populate
      //   select: "divisionName",
      // },
    ]);
    // Filter and format response to only include electives matching the subjectId
    const formattedLecturers = existingSubjectLecturers?.map((lecturer) => {
      const matchingElectives =
        lecturer?.lecturerSchoolData?.teachingSubjects?.electives?.filter(
          (elective) => elective?.subject?._id.toString() === subjectId
        );
      const matchingCores =
        lecturer?.lecturerSchoolData?.teachingSubjects?.cores?.filter(
          (core) => core?.subject?._id.toString() === subjectId
        );

      return {
        uniqueId: lecturer.uniqueId,
        name: lecturer.personalInfo?.fullName,
        gender: lecturer.personalInfo?.gender,
        profilePicture: lecturer.personalInfo?.profilePicture?.url,
        electives: matchingElectives?.map((elective) => ({
          _id: elective?._id,
          classLevel: elective?.classLevel?.name || "N/A",
          program:
            elective.program?.name || elective?.programDivision?.divisionName,
          subject: elective?.subject?.subjectName || "N/A",
          isElectiveSubject: elective?.subject?.subjectInfo?.isElectiveSubject,
          isCoreSubject: elective?.subject?.subjectInfo?.isCoreSubject,
          isOptionalSubject: elective?.subject?.subjectInfo?.isOptional,
        })),
        cores: matchingCores?.map((core) => ({
          _id: core?._id,
          classLevel: core?.classLevel?.name || "N/A",
          programmes: core.programmes,
          subject: core?.subject?.subjectName || "N/A",
          isCoreSubject: core?.subject?.subjectInfo?.isCoreSubject,
          isCoreSubject: core?.subject?.subjectInfo?.isCoreSubject,
          isOptionalSubject: core?.subject?.subjectInfo?.isOptional,
        })),
      };
    });
    // console.log("L-139: ", formattedLecturers);

    req.lecturersData = { lecturersFound: formattedLecturers };
    next();
  } catch (error) {
    console.log(error);

    res.status(500).json({
      errorMessage: {
        message: ["Something went wrong!", error?.message],
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
        "subjectInfo.isCoreSubject": true,
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
        "subjectInfo.isCoreSubject": true,
        createdBy: adminFound?._id,
      });
      // Push core subject into each student's core subjects✅
      // for (const student of allStudents) {
      //   // Find student
      //   const studentFound = await User.findOne({ _id: student?._id });
      //   if (
      //     !studentFound?.studentSchoolData?.coreSubjects?.includes(
      //       subjectCreated?._id
      //     )
      //   ) {
      //     await User.findOneAndUpdate(
      //       studentFound?._id,
      //       {
      //         $push: {
      //           "studentSchoolData.coreSubjects": subjectCreated?._id,
      //         },
      //       },
      //       { upsert: true }
      //     );
      //   }
      // }
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
  // console.log(data);

  try {
    // Find division programme
    const divisionProgramFound = await ProgramDivision.findOne({
      _id: data?.program,
    });
    const programFound = await Program.findOne({
      _id: data?.program,
    });
    // Find main programme
    if (!programFound && !divisionProgramFound) {
      res.status(404).json({
        errorMessage: {
          message: [`Subject's programme not found!`],
        },
      });
      return;
    }
    if (programFound) {
      //Find all students this programme
      const allStudents = await User.find({
        "studentSchoolData.program.programId": programFound?._id,
      });
      //check if subject exist
      const subject = await Subject.findOne({
        subjectName: data?.subjectName,
        "subjectInfo.program.programId": data?.programId,
        "subjectInfo.isOptional": data?.isOptional,
      });
      if (subject) {
        res.status(400).json({
          errorMessage: {
            message: [`Elective subject already exists!`],
          },
        });
        return;
      }
      const program = {
        programId: programFound?._id,
        type: "Program",
      };
      //create new subject
      const subjectCreated = await Subject.create({
        subjectName: data?.subjectName,
        "subjectInfo.program": program,
        "subjectInfo.isOptional":
          data?.isOptional === null ? false : data?.isOptional,
        "subjectInfo.isElectiveSubject": true,
        "subjectInfo.isCoreSubject": false,
        createdBy: adminFound?._id,
      });
      // Push subject into main program's elective subjects array✅
      if (
        subjectCreated &&
        !programFound.electiveSubjects.includes(subjectCreated?._id)
      ) {
        programFound.electiveSubjects.push(subjectCreated?._id);
        await programFound.save();
      }
      //If it's an optional subject, push into main program's optional subject's array
      // if (
      //   subjectCreated?.electiveSubInfo?.isOptional &&
      //   !programFound?.optionalElectiveSubjects?.includes(subjectCreated?._id)
      // ) {
      //   programFound.optionalElectiveSubjects.push(subjectCreated?._id);
      //   await programFound.save();
      // }
      // Push non-optional elective subject into each student's elective subjects✅
      if (subjectCreated && !subjectCreated?.subjectInfo?.isOptional) {
        for (const student of allStudents) {
          const studentFound = await User.findOne({ _id: student?._id });
          if (
            !studentFound?.studentSchoolData?.subjects?.includes(
              subjectCreated?._id
            )
          ) {
            // student?.studentSchoolData?.subjects?.push(subjectCreated?._id);
            await User.findOneAndUpdate(
              studentFound?._id,
              {
                $push: {
                  "studentSchoolData.subjects": subjectCreated?._id,
                },
              },
              { upsert: true }
            );
          }
        }
      }
      req.subjectCreated = subjectCreated;
      next();
    } else {
      req.divisionProgramFound = divisionProgramFound;
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
  const divisionProgramFound = req.divisionProgramFound;

  try {
    // Find division programme
    // const divisionProgramFound = await ProgramDivision.findOne({
    //   _id: data?.program,
    // });
    // if (!divisionProgramFound) {
    //   res.status(404).json({
    //     errorMessage: {
    //       message: [`Elective subject's programme not found!`],
    //     },
    //   });
    //   return;
    // }
    if (divisionProgramFound) {
      //Find all students in this programme
      const allStudents = await User.find({
        "studentSchoolData.program.programId": divisionProgramFound?._id,
      });
      //check if subject exist
      const subject = await Subject.findOne({
        subjectName: data?.subjectName,
        // "electiveSubInfo.programId": data?.programId,
        "subjectInfo.program.programId": divisionProgramFound?._id,
        "subjectInfo.isOptional": data?.isOptional,
      });
      if (subject) {
        res.status(400).json({
          errorMessage: {
            message: [`Elective subject already exists!`],
          },
        });
        return;
      }
      const program = {
        programId: divisionProgramFound?._id,
        type: "ProgramDivision",
      };
      //create new subject
      const subjectCreated = await Subject.create({
        subjectName: data?.subjectName,
        // "electiveSubInfo.programId": data?.programId,
        "subjectInfo.program": program,
        "subjectInfo.isOptional":
          data?.isOptional === "" ? false : data?.isOptional,
        "subjectInfo.isElectiveSubject": true,
        "subjectInfo.isCoreSubject": false,
        createdBy: adminFound?._id,
      });
      // Push subject into division program's elective subjects✅
      if (
        subjectCreated &&
        divisionProgramFound &&
        !divisionProgramFound.electiveSubjects.includes(subjectCreated?._id)
      ) {
        divisionProgramFound.electiveSubjects.push(subjectCreated?._id);
        await divisionProgramFound.save();
      }
      //If optional subject, push into division program's optional subject's array
      // if (
      //   subjectCreated?.electiveSubInfo?.isOptional &&
      //   divisionProgramFound &&
      //   !divisionProgramFound?.optionalElectiveSubjects?.includes(
      //     subjectCreated?._id
      //   )
      // ) {
      //   divisionProgramFound.optionalElectiveSubjects.push(subjectCreated?._id);
      //   await divisionProgramFound.save();
      // }
      // Push non optional elective subject into each student's elective subjects✅
      if (!subjectCreated?.subjectInfo?.isOptional) {
        allStudents?.forEach(async (student) => {
          if (
            !student?.studentSchoolData?.subjects?.includes(subjectCreated?._id)
          ) {
            await User.findOneAndUpdate(
              student?._id,
              {
                $push: {
                  "studentSchoolData.subjects": subjectCreated?._id,
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
  console.log(data);
  console.log(subjectId);
  try {
    if (
      !mongoose.Types.ObjectId.isValid(subjectId) ||
      !mongoose.Types.ObjectId.isValid(data?.currentTeacher) ||
      !mongoose.Types.ObjectId.isValid(data.classLevel) ||
      (data?.program && !mongoose.Types.ObjectId.isValid(data?.program))
    ) {
      return res.status(403).json({
        errorMessage: {
          message: ["Invalid ID detected!"],
        },
      });
    }
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
    //Check if class level exists
    const classLevel = await ClassLevel.findOne({ _id: data?.classLevel });
    if (!classLevel) {
      res.status(404).json({
        errorMessage: {
          message: [`Class level data not found!`],
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
    // Validate subject's isCoreSubject or isElectiveSubject
    if (
      !subjectFound?.subjectInfo?.isCoreSubject &&
      !subjectFound?.subjectInfo?.isElectiveSubject
    ) {
      res.status(404).json({
        errorMessage: {
          message: ["Subject data not found!"],
        },
      });
      return;
    }
    if (subjectFound?.subjectInfo?.isElectiveSubject) {
      //Find existing subject lecturer
      const existingSubjectLecturer = await User.findOne({
        "lecturerSchoolData.teachingSubjects.electives": {
          $elemMatch: {
            subject: subjectFound?._id,
            classLevel: classLevel?._id,
            $or: [{ program: data.program }, { programDivision: data.program }],
          },
        },
      });
      if (existingSubjectLecturer) {
        res.status(403).json({
          errorMessage: {
            message: ["Lecturer already assigned for this subject!"],
          },
        });
        return;
      }
      const allUsers = await User.find({});
      const mainProgram = await Program.findOne({ _id: data?.program });
      const divisionProgram = await ProgramDivision.findOne({
        _id: data?.program,
      });
      //Filter Students
      // const electiveStudentsFound = allUsers.filter(
      //   (std) =>
      //     (std?.studentSchoolData?.electiveSubjects?.includes(
      //       subjectFound?._id
      //     ) &&
      //       std?.studentSchoolData?.currentClassLevel === data?.classLevel &&
      //       std?.studentSchoolData?.divisionProgram === data?.programId) ||
      //     std?.studentSchoolData?.program === data?.programId
      // );

      if (divisionProgram) {
        // Now, find all students whose subject matches this lecturer's elective
        const students = await User.find({
          "studentSchoolData.program.programId": data?.program,
          "studentSchoolData.currentClassLevel": data?.classLevel,
          "studentSchoolData.subjects": {
            $in: [subjectFound?._id],
          },
          roles: {
            $in: ["Student"],
          },
        });
        // Update current Teacher's teachingSubjects data
        const updatedLecturer = await User.findOneAndUpdate(
          { _id: lecturerFound?._id }, // Correct filter for the lecturer
          {
            $push: {
              "lecturerSchoolData.teachingSubjects.electives": {
                subject: subjectFound?._id, // Elective subject ID
                classLevel: classLevel?._id, // Class Level ID
                programDivision: data?.program || null, // Program Division ID (optional)
                // students: students || [], // Array of student IDs (can be empty if not provided)
              },
            },
          },
          { new: true } // Return the updated document
        );

        if (!updatedLecturer) {
          console.error("Failed to update lecturer teachingSubjects!");
          return res.status(500).json({
            errorMessage: {
              message: ["Failed to update lecturer teachingSubjects!"],
            },
          });
        }
      } else if (mainProgram) {
        // Now, find all students whose subject matches this lecturer's elective
        const students = await User.find({
          "studentSchoolData.program.programId": data?.program,
          "studentSchoolData.currentClassLevel": data?.classLevel,
          "studentSchoolData.subjects": {
            $in: [subjectFound?._id],
          },
          roles: {
            $in: ["Student"],
          },
        });
        // Update current Teacher's teachingSubjects data
        const updatedLecturer = await User.findOneAndUpdate(
          { _id: lecturerFound?._id }, // Correct filter for the lecturer
          {
            $push: {
              "lecturerSchoolData.teachingSubjects.electives": {
                subject: subjectFound?._id, // Elective subject ID
                classLevel: classLevel?._id, // Class Level ID
                program: data?.program || null, // Program ID
                // students: students || [], // Array of student IDs (can be empty if not provided)
              },
            },
          },
          { new: true } // Return the updated document
        );

        if (!updatedLecturer) {
          console.error("Failed to update lecturer teachingSubjects!");
          return res.status(500).json({
            errorMessage: {
              message: ["Failed to update lecturer teachingSubjects!"],
            },
          });
        }
      }

      // Push lecturer into subjects teachers array
      if (
        subjectFound &&
        !subjectFound?.teachers?.includes(lecturerFound?._id)
      ) {
        subjectFound.teachers.push(lecturerFound?._id);
        await subjectFound.save();
      }
      // Push lecturer into subjects teachers array
      if (
        lecturerFound &&
        !lecturerFound?.lecturerSchoolData?.classLevels?.includes(
          classLevel?._id
        )
      ) {
        lecturerFound.lecturerSchoolData.classLevels.push(classLevel?._id);
        await lecturerFound.save();
      }
      req.assignSubjectLecturerData = {
        subjectFound,
        lecturerFound,
        classLevel,
        adminFound,
      };
      next();
    } else {
      req.assignSubjectLecturerData = {
        subjectFound,
        lecturerFound,
        classLevel,
        adminFound,
      };
      next();
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      errorMessage: {
        message: ["Something went wrong!", error?.message],
      },
    });
  }
}
async function removeElectiveSubject(req, res, next) {
  const currentUser = req.user;
  const data = req.body;
  const { subjectId } = req.params;
  try {
    if (
      !mongoose.Types.ObjectId.isValid(subjectId) ||
      (data.program && !mongoose.Types.ObjectId.isValid(data.program))
    ) {
      return res.status(403).json({
        errorMessage: {
          message: ["Invalid ID detected!"],
        },
      });
    }
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
    //Check if class level exists
    const classLevel = await ClassLevel.findOne({ name: data?.classLevel });
    if (!classLevel) {
      res.status(404).json({
        errorMessage: {
          message: [`Class level data not found!`],
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
    //Find Lecturer
    const lecturerFound = await User.findOne({
      uniqueId: data?.currentTeacher,
    });
    if (!lecturerFound) {
      res.status(404).json({
        errorMessage: {
          message: ["Lecturer data not found!"],
        },
      });
      return;
    }
    if (subjectFound?.subjectInfo?.isElectiveSubject) {
      //Find existing subject lecturer
      const existingSubjectLecturer = await User.findOne({
        _id: lecturerFound?._id,
        "lecturerSchoolData.teachingSubjects.electives": {
          $elemMatch: {
            subject: subjectFound?._id,
            classLevel: classLevel?._id,
            $or: [{ program: data.program }, { programDivision: data.program }],
            // programId: data.program,
          },
        },
      });
      if (!existingSubjectLecturer) {
        res.status(404).json({
          errorMessage: {
            message: ["Subject data not found!"],
          },
        });
        return;
      }
      const mainProgram = await Program.findOne({ _id: data?.program });
      const divisionProgram = await ProgramDivision.findOne({
        _id: data?.program,
      });
      if (divisionProgram) {
        const lecturerMultiElectiveSubjectsData =
          lecturerFound?.lecturerSchoolData?.teachingSubjects?.electives?.filter(
            (electiveData) =>
              electiveData?.subject?.toString() ===
              subjectFound?._id?.toString()
          );

        const lecturerElectiveSubjData =
          lecturerFound?.lecturerSchoolData?.teachingSubjects?.electives?.find(
            (electiveData) =>
              electiveData?.subject?.toString() ===
                subjectFound?._id?.toString() &&
              electiveData?.classLevel?.toString() ===
                classLevel?._id?.toString() &&
              electiveData?.programDivision?.toString() ===
                divisionProgram?._id?.toString()
          );
        // Update current Teacher's teachingSubjects data
        await User.findOneAndUpdate(
          { _id: lecturerFound?._id }, // Correct filter for the lecturer
          {
            $pull: {
              "lecturerSchoolData.teachingSubjects.electives": {
                _id: lecturerElectiveSubjData?._id,
              },
            },
          }
        );
        let updatedLecturer;
        // Remove lecturer from subject teachers array
        if (
          subjectFound?.teachers?.includes(lecturerFound?._id) &&
          lecturerMultiElectiveSubjectsData?.length <= 1
        ) {
          subjectFound?.teachers?.pull(lecturerFound?._id);
          await subjectFound.save();
          // updatedLecturer = await Subject.findOneAndUpdate(
          //   { _id: subjectFound?._id }, // Correct filter for the lecturer
          //   {
          //     $pull: { teachers: lecturerFound?._id },
          //   },
          //   { new: true }
          // );
        }
        req.removedSubjectLecturerData = {
          lecturerRemoved: updatedLecturer,
        };
        next();
      } else if (mainProgram) {
        const lecturerMultiElectiveSubjectsData =
          lecturerFound?.lecturerSchoolData?.teachingSubjects?.electives?.filter(
            (electiveData) =>
              electiveData?.subject?.toString() ===
              subjectFound?._id?.toString()
          );
        const lecturerElectiveSubjData =
          lecturerFound?.lecturerSchoolData?.teachingSubjects?.electives?.find(
            (electiveData) =>
              electiveData?.subject?.toString() ===
                subjectFound?._id?.toString() &&
              electiveData?.classLevel?.toString() ===
                classLevel?._id?.toString() &&
              electiveData?.program?.toString() === mainProgram?._id?.toString()
          );
        // Update current Teacher's teachingSubjects data
        await User.findOneAndUpdate(
          { _id: lecturerFound?._id },
          {
            $pull: {
              "lecturerSchoolData.teachingSubjects.electives": {
                _id: lecturerElectiveSubjData?._id,
              },
            },
          },
          { new: true }
        );
        let updatedLecturer;
        // Remove lecturer from subject teachers array
        if (
          subjectFound?.teachers?.includes(lecturerFound?._id) &&
          lecturerMultiElectiveSubjectsData?.length <= 1
        ) {
          subjectFound?.teachers?.pull(lecturerFound?._id);
          await subjectFound.save();
          // updatedLecturer = await Subject.findOneAndUpdate(
          //   { _id: subjectFound?._id },
          //   {
          //     $pull: { teachers: lecturerFound?._id },
          //   },
          //   { new: true }
          // );
        }
        req.removedSubjectLecturerData = {
          lecturerRemoved: updatedLecturer,
        };
        next();
      }
    } else {
      next();
    }
  } catch (error) {
    console.log(error);

    res.status(500).json({
      errorMessage: {
        message: ["Something went wrong!", error?.message],
      },
    });
  }
}
async function assignCoreSubject(req, res, next) {
  const currentUser = req.user;
  const data = req.body;
  const { subjectId } = req.params;
  const { subjectFound, lecturerFound, classLevel, adminFound } =
    req.assignSubjectLecturerData;
  // console.log("data: ", data);
  try {
    if (subjectFound?.subjectInfo?.isCoreSubject) {
      // Extract program IDs and their types
      const programIds = data?.programmes?.map((p) => p?.programId) || [];
      console.log("programIds: ", programIds);

      //Find existing subject lecturer
      const existingSubjectLecturer = await User.findOne({
        "lecturerSchoolData.teachingSubjects.cores": {
          $elemMatch: {
            subject: subjectFound?._id,
            classLevel: classLevel?._id,
            programmes: {
              $elemMatch: {
                programId: { $in: programIds }, // Match any programId
              },
            },
          },
        },
      });
      if (existingSubjectLecturer) {
        // Extract the matching programIds
        let matchedProgramIds = [];
        // existingSubjectLecturer.lecturerSchoolData.teachingSubjects
        //   .flatMap((subject) => subject.cores)
        //   .filter(
        //     (core) =>
        //       core.subject.equals(subjectFound?._id) &&
        //       core.classLevel.equals(classLevel?._id)
        //   )
        //   .flatMap((core) => core.programmes)
        //   .map((program) => program.programId)
        //   .filter((programId) => programIds.includes(programId)); // Ensure it's in the original list

        for (const subject of existingSubjectLecturer?.lecturerSchoolData
          ?.teachingSubjects?.cores) {
          // if (subject) {
          //   subject?.programmes?.forEach((program) => {
          //     if (programIds.includes(program.programId?.toString())) {
          //       matchedProgramIds.push(program.programId);
          //     }
          //   });
          // }
          for (const program of subject?.programmes) {
            // console.log("program of subject?.programmes", program);
            // console.log(subject?.programmes);

            if (programIds.includes(program?.programId?.toString())) {
              matchedProgramIds.push(program);
            }
          }
        }
        console.log(matchedProgramIds);

        res.status(403).json({
          errorMessage: {
            message: [
              matchedProgramIds
                ? `Existing subject programme found!`
                : `Lecturer already assigned for this subject!`,
            ],
            programmes: matchedProgramIds,
          },
        });
        return;
      }
      // Find General Science Program
      const generalScienceProgram = await Program.findOne({
        name: "General Science",
      });

      // Now, find all students whose subject matches this lecturer's elective
      const allStudents = await User.find({
        roles: { $in: ["Student"] },
      });
      const filteredStudents = await User.find({
        "studentSchoolData.program.programId": {
          $ne: generalScienceProgram?._id,
        },
        roles: { $in: ["Student"] },
      });
      // Update current Teacher's teachingSubjects data
      const updatedLecturer = await User.findOneAndUpdate(
        { _id: lecturerFound?._id }, // Correct filter for the lecturer
        {
          $push: {
            "lecturerSchoolData.teachingSubjects.cores": {
              subject: subjectFound?._id, // Elective subject ID
              classLevel: classLevel?._id, // Class Level ID
              programmes: data?.programmes || null,
              // students:
              //   subjectFound?.subjectName !== "Science"
              //     ? allStudents
              //     : filteredStudents, // Array of student IDs (can be empty if not provided)
            },
          },
        },
        { new: true } // Return the updated document
      );

      if (!updatedLecturer) {
        console.error("Failed to update lecturer teachingSubjects!");
        return res.status(500).json({
          errorMessage: {
            message: ["Failed to update lecturer teachingSubjects!"],
          },
        });
      }
      // Push lecturer into subjects teachers array
      if (
        subjectFound &&
        !subjectFound?.teachers?.includes(lecturerFound?._id)
      ) {
        subjectFound.teachers.push(lecturerFound?._id);
        await subjectFound.save();
      }
      // Push classLevel into lecturers classLevels array
      if (
        lecturerFound &&
        !lecturerFound?.lecturerSchoolData?.classLevels?.includes(
          classLevel?._id
        )
      ) {
        lecturerFound.lecturerSchoolData.classLevels.push(classLevel?._id);
        await lecturerFound.save();
      }
      req.assignSubjectLecturerData = {
        subjectFound,
        lecturerFound,
      };
      next();
    } else {
      next();
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      errorMessage: {
        message: ["Something went wrong!", error?.message],
      },
    });
  }
}
async function removeCoreSubject(req, res, next) {
  const currentUser = req.user;
  const data = req.body;
  const { subjectId } = req.params;
  try {
    if (
      !mongoose.Types.ObjectId.isValid(subjectId) ||
      (data.program && !mongoose.Types.ObjectId.isValid(data.program))
    ) {
      return res.status(403).json({
        errorMessage: {
          message: ["Invalid ID detected!"],
        },
      });
    }
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
    //Check if class level exists
    const classLevel = await ClassLevel.findOne({ name: data?.classLevel });
    if (!classLevel) {
      res.status(404).json({
        errorMessage: {
          message: [`Class level data not found!`],
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
    //Find Lecturer
    const lecturerFound = await User.findOne({
      uniqueId: data?.currentTeacher,
    });
    if (!lecturerFound) {
      res.status(404).json({
        errorMessage: {
          message: ["Lecturer data not found!"],
        },
      });
      return;
    }
    if (subjectFound?.subjectInfo?.isCoreSubject) {
      // Extract program IDs and their types
      const programIds = data?.programmes?.map((p) => p?.programId) || [];
      //Find existing subject lecturer
      const existingSubjectLecturer = await User.findOne({
        "lecturerSchoolData.teachingSubjects.cores": {
          $elemMatch: {
            subject: subjectFound?._id,
            classLevel: classLevel?._id,
            "programmes.programId": { $all: programIds }, // Ensure all programIds exist
          },
        },
        "lecturerSchoolData.teachingSubjects.cores.programmes": {
          $size: programIds.length, // Ensure no extra programmes
        },
      });
      if (!existingSubjectLecturer) {
        res.status(404).json({
          errorMessage: {
            message: ["Subject data not found!"],
          },
        });
        return;
      }
      const lecturerMultiCoreSubjectsData =
        lecturerFound?.lecturerSchoolData?.teachingSubjects?.cores?.filter(
          (coreData) =>
            coreData?.subject?.toString() === subjectFound?._id?.toString()
        );

      const lecturerCoreSubjData =
        lecturerFound?.lecturerSchoolData?.teachingSubjects?.cores?.find(
          (coreData) => {
            return (
              coreData?.subject?.toString() === subjectFound?._id?.toString() &&
              coreData?.classLevel?.toString() ===
                classLevel?._id?.toString() &&
              // Strictly match all program IDs
              coreData?.programmes?.length === programIds.length && // Ensure same length
              coreData?.programmes?.every(
                (prog) => programIds?.includes(prog.programId.toString()) // Check if every stored programId exists in programIds
              )
            );
          }
        );
      console.log("lecturerCoreSubjData: ", lecturerCoreSubjData);

      // Update current Teacher's teachingSubjects data
      await User.findOneAndUpdate(
        { _id: lecturerFound?._id }, // Correct filter for the lecturer
        {
          $pull: {
            "lecturerSchoolData.teachingSubjects.cores": {
              _id: lecturerCoreSubjData?._id,
            },
          },
        }
      );
      let updatedLecturer;
      // Remove lecturer from subject teachers array
      if (
        subjectFound?.teachers?.includes(lecturerFound?._id) &&
        lecturerMultiCoreSubjectsData?.length <= 1
      ) {
        subjectFound?.teachers?.pull(lecturerFound?._id);
        await subjectFound.save();
      }
      req.removedSubjectLecturerData = {
        lecturerRemoved: updatedLecturer,
      };
      next();
    } else {
      next();
    }
  } catch (error) {
    console.log(error);

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
  removeElectiveSubject,
  removeCoreSubject,
  assignCoreSubject,
  subjectLecturers,
};
