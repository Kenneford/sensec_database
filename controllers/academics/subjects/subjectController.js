const mongoose = require("mongoose");
const ProgramDivision = require("../../../models/academics/programmes/divisions/ProgramDivisionModel");
const Program = require("../../../models/academics/programmes/ProgramsModel");
const Subject = require("../../../models/academics/subjects/SubjectModel");
const User = require("../../../models/user/UserModel");
const ClassLevel = require("../../../models/academics/class/ClassLevelModel");

// Create subject ✅
module.exports.createSubject = async (req, res) => {
  const subjectCreated = req.subjectCreated;
  try {
    res.status(201).json({
      successMessage: "Subject created successfully!",
      subject: subjectCreated,
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
// Get all subjects ✅
exports.getAllSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({}).populate([
      { path: "electiveSubInfo.programId" },
      { path: "electiveSubInfo.divisionProgramId" },
      { path: "createdBy" },
      { path: "lastUpdatedBy" },
    ]);
    if (subjects) {
      res.status(201).json({
        successMessage: "Subjects fetched successfully...",
        subjects,
      });
    } else {
      res.status(400).json({
        errorMessage: {
          message: ["Subjects fetching failed!"],
        },
      });
    }
  } catch (error) {
    res.status(500).json({
      errorMessage: {
        message: ["Something went wrong!"],
      },
    });
  }
};
// Assign subject lecturer ✅
exports.getAllSubjectLecturers = async (req, res) => {
  const { lecturersFound } = req.lecturersData;

  try {
    res.status(201).json({
      successMessage: "Subject lecturers fetched successfully!",
      lecturersFound,
    });
  } catch (error) {
    res.status(500).json({
      errorMessage: {
        message: ["Something went wrong!", error?.message],
      },
    });
  }
};
// Assign subject students ✅
exports.getAllSubjectStudents = async (req, res) => {
  const currentUser = req.user;
  const data = req.body;

  try {
    if (
      !mongoose.Types.ObjectId.isValid(data?.subjectId) ||
      !mongoose.Types.ObjectId.isValid(data?.classLevel)
    ) {
      return res.status(403).json({
        errorMessage: {
          message: ["Invalid object ID detected!"],
        },
      });
    }
    //Find Admin
    const authUserFound = await User.findOne({ _id: currentUser?.id });
    if (
      !authUserFound ||
      (!currentUser?.roles?.includes("Lecturer") &&
        !currentUser?.roles?.includes("Admin"))
    ) {
      res.status(403).json({
        errorMessage: {
          message: ["Operation denied! You're not a Lecturer!"],
        },
      });
      return;
    }
    //Find subject by ID
    const subjectFound = await Subject.findOne({ _id: data?.subjectId });
    if (!subjectFound) {
      res.status(404).json({
        errorMessage: {
          message: ["Subject data not found!"],
        },
      });
      return;
    }
    //Find classLevel by ID
    const classLevelFound = await ClassLevel.findOne({ _id: data?.classLevel });
    if (!classLevelFound) {
      res.status(404).json({
        errorMessage: {
          message: ["Class level data not found!"],
        },
      });
      return;
    }
    //Find all students this programme
    const allSubjectStudents = await User.find({
      "studentSchoolData.subjects": { $in: [subjectFound?._id] },
      "studentSchoolData.currentClassLevel": classLevelFound?._id,
    });
    // console.log("L-139: ", formattedLecturers);

    res.status(200).json({
      successMessage: "Subject students fetched successfully!",
      allSubjectStudents,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      errorMessage: {
        message: ["Something went wrong!", error?.message],
      },
    });
  }
};
// Get single subject ✅
exports.getSingleSubject = async (req, res) => {
  const { subjectId } = req.params;
  try {
    const subject = await Subject.findOne({
      _id: subjectId,
    }).populate([
      // { path: "teachers" },
      { path: "createdBy" },
      { path: "lastUpdatedBy" },
    ]);
    if (subject) {
      res.status(200).json({
        successMessage: "Subject fetched successfully!",
        subject,
      });
    } else {
      res.status(403).json({
        errorMessage: {
          message: ["Unknown Subject!"],
        },
      });
    }
  } catch (error) {
    res.status(500).json({
      errorMessage: {
        message: ["Something went wrong!"],
      },
    });
  }
};
// Get all elective subjects for a programme ✅
exports.getAllProgramElectiveSubjects = async (req, res) => {
  const { programId } = req.params;
  try {
    const programFound = await Program.findOne({
      _id: programId,
    });
    if (!programFound) {
      res.status(404).json({
        errorMessage: {
          message: ["Programme data not found!"],
        },
      });
      return;
    }
    const subjectsFound = await Subject.find({
      "electiveSubInfo.programId": programId,
    }).populate([
      { path: "electiveSubInfo.programId" },
      { path: "teachers" },
      {
        path: "createdBy",
      },
      {
        path: "lastUpdatedBy",
      },
    ]);
    if (subjectsFound) {
      res.status(200).json({
        successMessage: "Programme Elective Subjects Fetched Successfully...",
        subjectsFound,
      });
    } else {
      res.status(404).json({
        errorMessage: {
          message: ["No Subjects found under selected programme!"],
        },
      });
    }
  } catch (error) {
    res.status(500).json({
      errorMessage: {
        message: ["Something went wrong!"],
      },
    });
  }
};
// Get all optional elective subjects for a programme ✅
exports.getAllProgramOptionalElectiveSubjects = async (req, res) => {
  const { programId } = req.params;
  try {
    const programFound = await Program.findOne({
      _id: programId,
    });
    if (!programFound) {
      res.status(404).json({
        errorMessage: {
          message: ["Programme data not found!"],
        },
      });
      return;
    }
    const subjectsFound = await Subject.find({
      "electiveSubInfo.programId": programId,
      "electiveSubInfo.isOptional": true,
    }).populate([
      { path: "electiveSubInfo.programId" },
      { path: "teachers" },
      {
        path: "createdBy",
      },
      {
        path: "lastUpdatedBy",
      },
    ]);
    if (subjectsFound) {
      res.status(200).json({
        successMessage: "Optional Elective Subjects Fetched Successfully!",
        subjectsFound,
      });
    } else {
      res.status(404).json({
        errorMessage: {
          message: ["No Subjects found under selected programme!"],
        },
      });
    }
  } catch (error) {
    res.status(500).json({
      errorMessage: {
        message: ["Something went wrong!"],
      },
    });
  }
};
// Update  subject ✅
exports.updateSubject = async (req, res) => {
  const currentUser = req.user;
  const data = req.body;
  const { subjectId } = req.params;
  console.log("Update Subject Data: ", data);
  console.log("subjectId: ", subjectId);

  try {
    //Find Admin
    const adminFound = await User.findOne({ _id: data?.lastUpdatedBy });

    if (!adminFound || !currentUser?.roles?.includes("Admin")) {
      res.status(403).json({
        errorMessage: {
          message: ["Operation Denied! You're Not An Admin!"],
        },
      });
      return;
    }
    //Find subject by ID
    const subjectFound = await Subject.findOne({ _id: subjectId });
    if (!subjectFound) {
      res.status(403).json({
        errorMessage: {
          message: ["Subject data not found!"],
        },
      });
      return;
    }
    //check if subject name exists
    const existingSubjectFound = await Subject.findOne({
      _id: subjectId,
      subjectName: data?.updatedSubjectName,
    });
    if (!existingSubjectFound) {
      const updatedSubject = await Subject.findOneAndUpdate(
        subjectFound?._id,
        {
          subjectName: data?.updatedSubjectName,
          lastUpdatedBy: data?.lastUpdatedBy,
          previouslyUpdateDate: subjectFound?.lastUpdatedBy,
          previouslyUpdateDate: subjectFound?.updatedAt,
        },
        {
          new: true,
        }
      );
      res.status(201).json({
        successMessage: "Subject updated successfully!",
        updatedSubject,
      });
    } else {
      res.status(403).json({
        errorMessage: {
          message: ["Subject already exists!"],
        },
      });
    }
  } catch (error) {
    res.status(500).json({
      errorMessage: {
        message: ["Something went wrong!"],
      },
    });
  }
};
// Assign subject lecturer ✅
exports.assignSubjectLecturer = async (req, res) => {
  const { lecturerFound } = req.assignSubjectLecturerData;

  try {
    res.status(201).json({
      successMessage: "Subject lecturer assigned successfully!",
      lecturerFound,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      errorMessage: {
        message: ["Something went wrong!", error?.message],
      },
    });
  }
};
// Remove subject lecturer ✅
exports.removeSubjectLecturer = async (req, res) => {
  const { lecturerRemoved } = req.removedSubjectLecturerData;
  try {
    res.status(201).json({
      successMessage: "Subject lecturer removed successfully!",
      lecturerRemoved,
    });
  } catch (error) {
    res.status(500).json({
      errorMessage: {
        message: ["Something went wrong!", error?.message],
      },
    });
  }
};
// Delete  subject ✅
exports.deleteSubject = async (req, res) => {
  const currentUser = req.user;
  const { subjectId } = req.params;
  try {
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
    // Find subject
    const subjectFound = await Subject.findOne({ _id: subjectId });
    if (!subjectFound) {
      res.status(404).json({
        errorMessage: {
          message: ["Subject data not found!"],
        },
      });
      return;
    }
    // Delete subject
    const subjectDeleted = await Subject.findOneAndDelete({ _id: subjectId });
    // Get all Students
    const studentsFound = await User.find({
      roles: {
        $in: ["Student"],
      },
      "studentSchoolData.subjects": {
        $in: [subjectDeleted?._id],
      },
    });
    // Find main Program
    const mainProgramFound = await Program.findOne({
      electiveSubjects: {
        $in: [subjectDeleted?._id],
      },
    });
    // Find division Program
    const divisionProgramFound = await ProgramDivision.findOne({
      electiveSubjects: {
        $in: [subjectDeleted?._id],
      },
    });

    //Find existing subject lecturers
    const existingSubjectLecturers = await User.find({
      "lecturerSchoolData.teachingSubjects.electives": {
        $elemMatch: {
          subject: subjectFound?._id,
        },
      },
    });
    if (subjectDeleted) {
      // Remove subject from lecturer's teaching subjects
      if (existingSubjectLecturers) {
        existingSubjectLecturers?.forEach((lecturer) => {
          const lecturerElectiveSubjectsData =
            lecturer?.lecturerSchoolData?.teachingSubjects?.electives?.filter(
              (electiveData) =>
                electiveData?.subject?.toString() ===
                subjectDeleted?._id?.toString()
            );
          console.log(
            "lecturerElectiveSubjectsData: ",
            lecturerElectiveSubjectsData
          );
          if (lecturerElectiveSubjectsData) {
            lecturerElectiveSubjectsData?.forEach(async (subjectData) => {
              await User.findOneAndUpdate(
                { _id: lecturer?._id }, // Correct filter for the lecturer
                {
                  $pull: {
                    "lecturerSchoolData.teachingSubjects.electives": {
                      _id: subjectData?._id,
                    },
                  },
                }
              );
            });
          }
        });
      }
      // Delete subject from each student's subjects array
      if (studentsFound) {
        studentsFound?.forEach(async (std) => {
          if (
            std &&
            std?.studentSchoolData?.subjects?.includes(subjectDeleted?._id)
          ) {
            await User.findOneAndUpdate(
              std?._id,
              {
                $pull: {
                  "studentSchoolData.subjects": subjectDeleted?._id,
                },
              },
              { new: true }
            );
          }
        });
      }
      // Delete subject from either main program or sub-division program
      if (
        mainProgramFound &&
        mainProgramFound?.electiveSubjects?.includes(subjectDeleted?._id)
      ) {
        await Program.findOneAndUpdate(
          mainProgramFound?._id,
          {
            $pull: {
              electiveSubjects: subjectDeleted?._id,
            },
          },
          { new: true }
        );
      }
      if (
        divisionProgramFound &&
        divisionProgramFound?.electiveSubjects?.includes(subjectDeleted?._id)
      ) {
        await ProgramDivision.findOneAndUpdate(
          divisionProgramFound?._id,
          {
            $pull: {
              electiveSubjects: subjectDeleted?._id,
            },
          },
          { new: true }
        );
      }
    }
    res.status(201).json({
      successMessage: "Subject deleted successfully!",
      subjectDeleted,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      errorMessage: {
        message: ["Something went wrong!", error?.message],
      },
    });
  }
};
