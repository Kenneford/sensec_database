const ProgramDivision = require("../../../models/academics/programmes/divisions/ProgramDivisionModel");
const Program = require("../../../models/academics/programmes/ProgramsModel");
const Subject = require("../../../models/academics/subjects/SubjectModel");
const User = require("../../../models/user/UserModel");

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
      res.status(201).json({
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
      res.status(201).json({
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
      res.status(201).json({
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
  try {
    //Find Admin
    const adminFound = await User.findOne({ _id: data?.updatedBy });

    if (!adminFound || !currentUser?.roles?.includes("admin")) {
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
    const existingSubjectFound = await Subject.findOne({ name: data?.name });
    if (!existingSubjectFound) {
      const updatedSubject = await Subject.findOneAndUpdate(
        subjectFound?._id,
        {
          subjectName: data?.name,
          lastUpdatedBy: data?.updatedBy,
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
  const { subjectId, adminId } = req.params;
  try {
    // Get all users
    const allUsersData = await User.find({});
    const filteredStudents = allUsersData.filter(
      (user) => user && user?.roles?.includes("student")
    );
    const checkSubject = await Subject.findOne({ _id: subjectId });
    //Find subject teachers
    const teachersFound = allUsersData.filter(
      (user) =>
        user &&
        user?.roles?.includes("teacher") &&
        user?.teacherSchoolData?.teachingSubjects?.includes(checkSubject?._id)
    );
    const adminTakingAction = await User.findOne({ _id: currentUser?.id });
    if (!adminTakingAction) {
      res.status(403).json({
        errorMessage: {
          message: [`Operation Denied! You're Not An Admin!`],
        },
      });
      return;
    }
    if (checkSubject) {
      const deletedSubject = await Subject.findByIdAndDelete({
        _id: checkSubject?._id,
      });
      if (deletedSubject) {
        try {
          if (deletedSubject?.electiveSubInfo?.isElectiveSubject) {
            const programFound = await Program.findOne({
              _id: deletedSubject?.electiveSubInfo?.programId,
            });
            const programDivisionsFound = await ProgramDivision.find({
              programId: deletedSubject?.electiveSubInfo?.programId,
            });
            if (programFound?.electiveSubjects?.includes(deletedSubject?._id)) {
              programFound.electiveSubjects.pull(deletedSubject?._id);
              await programFound.save();
            }
            if (
              programFound?.optionalElectiveSubjects?.includes(
                deletedSubject?._id
              )
            ) {
              programFound.optionalElectiveSubjects.pull(deletedSubject?._id);
              await programFound.save();
            }
            if (programDivisionsFound) {
              programDivisionsFound?.forEach(async (program) => {
                if (
                  program &&
                  program?.electiveSubjects?.includes(deletedSubject?._id)
                ) {
                  program.electiveSubjects.pull(deletedSubject?._id);
                  await program.save();
                }
                if (
                  program &&
                  program?.optionalElectiveSubjects?.includes(
                    deletedSubject?._id
                  )
                ) {
                  program.optionalElectiveSubjects.pull(deletedSubject?._id);
                  await program.save();
                }
              });
            }
          }
          if (
            adminTakingAction &&
            adminTakingAction?.adminActionsData?.subjects?.includes(
              deletedSubject?._id
            )
          ) {
            await User.findOneAndUpdate(
              adminTakingAction?._id,
              { $pull: { "adminActionsData.subjects": deletedSubject?._id } },
              { new: true }
            );
          }
          if (teachersFound) {
            teachersFound?.forEach(async (teacher) => {
              if (
                teacher &&
                teacher?.teacherSchoolData?.teachingSubjects?.includes(
                  deletedSubject?._id
                )
              ) {
                teacher.teacherSchoolData.teachingSubjects.pull(
                  deletedSubject?._id
                );
                await teacher.save();
              }
            });
          }
          if (deletedSubject?.electiveSubInfo) {
            filteredStudents?.forEach(async (std) => {
              if (
                std &&
                std?.studentSchoolData?.electiveSubjects?.includes(
                  deletedSubject?._id
                )
              ) {
                await User.findOneAndUpdate(
                  std?._id,
                  {
                    $pull: {
                      "studentSchoolData.electiveSubjects": deletedSubject?._id,
                    },
                  },
                  { new: true }
                );
              }
            });
          }
          if (deletedSubject?.coreSubInfo) {
            filteredStudents?.forEach(async (std) => {
              if (
                std &&
                std?.studentSchoolData?.coreSubjects?.includes(
                  deletedSubject?._id
                )
              ) {
                await User.findOneAndUpdate(
                  std?._id,
                  {
                    $pull: {
                      "studentSchoolData.coreSubjects": deletedSubject?._id,
                    },
                  },
                  { new: true }
                );
              }
            });
          }
        } catch (error) {
          res.status(500).json({
            errorMessage: {
              message: ["Internal Server Error!"],
            },
          });
        }
      }
      res.status(201).json({
        successMessage: "Subject deleted successfully",
        deletedSubject,
      });
    } else {
      res.status(404).json({
        errorMessage: {
          message: ["Subject data not found!"],
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
