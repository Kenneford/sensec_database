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
  console.log(subjectId);

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
        "lecturerSchoolData.teachingSubjects.electives": {
          $elemMatch: {
            subject: subjectFound?._id,
          },
        },
      },
      {
        // Project only required fields
        // name: 1,
        uniqueId: 1,
        personalInfo: 1,
        "lecturerSchoolData.teachingSubjects.electives": 1,
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
    ]);
    // console.log("L-92: ", existingSubjectLecturers);

    if (existingSubjectLecturers?.length === 0) {
      res.status(404).json({
        errorMessage: {
          message: ["No lecturers found teaching the specified subject!"],
        },
      });
      return;
    }

    // Filter and format response to only include electives matching the subjectId
    const formattedLecturers = existingSubjectLecturers?.map((lecturer) => {
      const matchingElectives =
        lecturer?.lecturerSchoolData?.teachingSubjects?.electives?.filter(
          (elective) => elective?.subject?._id.toString() === subjectId
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
        "subjectInfo.programId": data?.programId,
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
      //create new subject
      const subjectCreated = await Subject.create({
        subjectName: data?.subjectName,
        "subjectInfo.programId": data?.programId,
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
      if (!subjectCreated?.subjectInfo?.isOptional) {
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
      //Find all students in this programme
      const allStudents = await User.find({
        "studentSchoolData.divisionProgram": divisionProgramFound?._id,
      });
      //check if subject exist
      const subject = await Subject.findOne({
        subjectName: data?.subjectName,
        // "electiveSubInfo.programId": data?.programId,
        "subjectInfo.divisionProgramId": data?.divisionProgramId,
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
      //create new subject
      const subjectCreated = await Subject.create({
        subjectName: data?.subjectName,
        // "electiveSubInfo.programId": data?.programId,
        "subjectInfo.divisionProgramId": data?.divisionProgramId,
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
  console.log(data);
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
    //Find existing subject lecturer Lecturer
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
    if (subjectFound?.subjectInfo?.isElectiveSubject) {
      const allUsers = await User.find({});
      const mainProgram = await Program.findOne({ _id: data?.program });
      const divisionProgram = await ProgramDivision.findOne({
        _id: data?.program,
      });
      //Filter Students
      const electiveStudentsFound = allUsers.filter(
        (std) =>
          (std?.studentSchoolData?.electiveSubjects?.includes(
            subjectFound?._id
          ) &&
            std?.studentSchoolData?.currentClassLevel === data?.classLevel &&
            std?.studentSchoolData?.divisionProgram === data?.programId) ||
          std?.studentSchoolData?.program === data?.programId
      );

      if (divisionProgram) {
        // Now, find all students whose subject matches this lecturer's elective
        const students = await User.find({
          "studentSchoolData.divisionProgram": data?.program,
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
                students: students || [], // Array of student IDs (can be empty if not provided)
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
          "studentSchoolData.program": data?.program,
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
                students: students || [], // Array of student IDs (can be empty if not provided)
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
async function removeElectiveSubject(req, res, next) {
  const currentUser = req.user;
  const data = req.body;
  const { subjectId } = req.params;
  console.log(data);
  try {
    if (
      !mongoose.Types.ObjectId.isValid(subjectId) ||
      !mongoose.Types.ObjectId.isValid(data?.currentTeacher) ||
      !mongoose.Types.ObjectId.isValid(data.classLevel) ||
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
    //Find existing subject lecturer Lecturer
    const existingSubjectLecturer = await User.findOne({
      _id: lecturerFound?._id,
      "lecturerSchoolData.teachingSubjects.electives": {
        $elemMatch: {
          subject: subjectFound?._id,
          classLevel: classLevel?._id,
          $or: [{ program: data.program }, { programDivision: data.program }],
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
    if (subjectFound?.subjectInfo?.isElectiveSubject) {
      const mainProgram = await Program.findOne({ _id: data?.program });
      const divisionProgram = await ProgramDivision.findOne({
        _id: data?.program,
      });
      if (divisionProgram) {
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
        console.log("L-582: ", lecturerElectiveSubjData);
        // Update current Teacher's teachingSubjects data
        const updatedLecturer = await User.findOneAndUpdate(
          { _id: lecturerFound?._id }, // Correct filter for the lecturer
          {
            $pull: {
              "lecturerSchoolData.teachingSubjects.electives": {
                _id: lecturerElectiveSubjData?._id,
              },
            },
          }
        );
        if (!updatedLecturer) {
          return res.status(404).json({
            errorMessage: {
              message: [
                `Operation failed! Subject data not found or already deleted.`,
              ],
            },
          });
        }
        req.removedSubjectLecturerData = {
          lecturerRemoved: updatedLecturer,
        };
        next();
      } else if (mainProgram) {
        const lecturerElectiveSubjData =
          lecturerFound?.lecturerSchoolData?.teachingSubjects?.electives?.find(
            (electiveData) =>
              electiveData?.subject?.toString() ===
                subjectFound?._id?.toString() &&
              electiveData?.classLevel?.toString() ===
                classLevel?._id?.toString() &&
              electiveData?.program?.toString() === mainProgram?._id?.toString()
          );
        console.log(lecturerElectiveSubjData);
        // Update current Teacher's teachingSubjects data
        const updatedLecturer = await User.findOneAndUpdate(
          { _id: lecturerFound?._id }, // Correct filter for the lecturer
          {
            $pull: {
              "lecturerSchoolData.teachingSubjects.electives": {
                _id: lecturerElectiveSubjData?._id,
              },
            },
          }
        );
        if (!updatedLecturer) {
          return res.status(404).json({
            errorMessage: {
              message: [
                `Operation failed! Subject data not found or already deleted.`,
              ],
            },
          });
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
  console.log(data);
  try {
    if (
      !mongoose.Types.ObjectId.isValid(subjectId) ||
      !mongoose.Types.ObjectId.isValid(data?.currentTeacher) ||
      !mongoose.Types.ObjectId.isValid(data.classLevel)
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
    // Extract program IDs and their types
    const programIds = data?.programmes.map((p) => p.program);
    //Find existing subject lecturer Lecturer
    const existingSubjectLecturer = await User.findOne({
      "lecturerSchoolData.teachingSubjects.cores": {
        $elemMatch: {
          subject: subjectFound?._id,
          classLevel: classLevel?._id,
          programmes: {
            $elemMatch: {
              program: { $in: programIds }, // Match any programId
            },
          },
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
    if (subjectFound?.subjectInfo?.isCoreSubject) {
      // Find General Science Program
      const generalScienceProgram = await Program.findOne({
        name: "General Science",
      });

      // Now, find all students whose subject matches this lecturer's elective
      const allStudents = await User.find({
        roles: { $in: ["Student"] },
      });
      const filteredStudents = await User.find({
        "studentSchoolData.program": { $ne: generalScienceProgram?._id },
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
              students:
                subjectFound?.subjectName !== "Science"
                  ? allStudents
                  : filteredStudents, // Array of student IDs (can be empty if not provided)
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
      };
      next();
    } else {
      res.status(403).json({
        errorMessage: {
          message: ["Failed to assign lecturer!"],
        },
      });
      return;
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
  removeElectiveSubject,
  assignCoreSubject,
  subjectLecturers,
};
