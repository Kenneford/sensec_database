const ProgramDivision = require("../../../models/academics/programmes/divisions/ProgramDivisionModel");
const Program = require("../../../models/academics/programmes/ProgramsModel");
const Subject = require("../../../models/academics/subjects/SubjectModel");
const User = require("../../../models/user/UserModel");

// Create subject ✅
module.exports.createSubject = async (req, res) => {
  const currentUser = req.user;
  const data = req.body;
  console.log(data);

  const requiredFields = data?.subjectName;
  if (!requiredFields) {
    res.status(403).json({
      errorMessage: {
        message: ["Name of subject required!"],
      },
    });
    return;
  }
  try {
    //Find Admin
    const adminFound = await User.findOne({ _id: data?.createdBy });

    if (!adminFound || !currentUser?.roles?.includes("admin")) {
      res.status(403).json({
        errorMessage: {
          message: ["Operation Denied! You're Not An Admin!"],
        },
      });
      return;
    }
    if (data && !data?.isCore) {
      if (!data?.nameOfProgram || !data?.programId) {
        res.status(403).json({
          errorMessage: {
            message: ["Fill all required fields!"],
          },
        });
        return;
      }
      let programFound;
      let divisionProgramFound;
      //Find main programme
      if (data?.programId) {
        programFound = await Program.findOne({
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
      }
      //Find division programme
      if (data?.divisionProgramId) {
        divisionProgramFound = await ProgramDivision.findOne({
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
      }
      //check if subject exist
      const subject = await Subject.findOne({
        subjectName: data?.subjectName,
        "electiveSubInfo.programId": data?.programId,
        "electiveSubInfo.isOptional": data?.isOptional,
      });
      //Find all students
      const allStudents = await User.find({
        "studentSchoolData.program": programFound?._id,
      });
      const allDivisionProgrammeStudents = await User.find({
        "studentSchoolData.divisionProgram": divisionProgramFound?._id,
      });
      if (subject) {
        res.status(400).json({
          errorMessage: {
            message: [`Elective subject already exists!`],
          },
        });
        return;
      } else {
        //create new subject
        const subjectCreated = await Subject.create({
          subjectName: data?.subjectName,
          "electiveSubInfo.nameOfProgram": data?.nameOfProgram,
          "electiveSubInfo.programId": data?.programId,
          "electiveSubInfo.isOptional": data?.isOptional,
          createdBy: data?.createdBy,
        });
        try {
          //   push elective subject into admin's subjects✅
          if (
            subjectCreated &&
            !adminFound?.adminActionsData.subjects.includes(subjectCreated?._id)
          ) {
            await User.findOneAndUpdate(
              adminFound._id,
              { $push: { "adminActionsData.subjects": subjectCreated?._id } },
              { upsert: true }
            );
          }
          //   push elective subject into student's elective subjects✅
          if (subjectCreated && allDivisionProgrammeStudents) {
            allDivisionProgrammeStudents?.forEach(async (student) => {
              if (
                student &&
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
          //   push elective subject into student's elective subjects✅
          if (subjectCreated && allStudents) {
            allStudents?.forEach(async (student) => {
              if (
                student &&
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
          //If not optional subject, push subject into main program's elective subjects✅
          if (
            !subjectCreated?.electiveSubInfo?.isOptional &&
            programFound &&
            !programFound.electiveSubjects.includes(subjectCreated?._id)
          ) {
            programFound.electiveSubjects.push(subjectCreated?._id);
            await programFound.save();
          }
          //If optional subject, push into main program's optional subject's array
          if (
            subjectCreated?.electiveSubInfo?.isOptional &&
            programFound &&
            !programFound?.optionalElectiveSubjects?.includes(
              subjectCreated?._id
            )
          ) {
            programFound.optionalElectiveSubjects.push(subjectCreated?._id);
            await programFound.save();
          }
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
            divisionProgramFound.optionalElectiveSubjects.push(
              subjectCreated?._id
            );
            await divisionProgramFound.save();
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
          successMessage: "Elective subject created successfully",
          subject: subjectCreated,
        });
        console.log("Subject created successfully");
        console.log(subjectCreated);
      }
    } else {
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
      // Get all users
      const allUsersData = await User.find({});
      const filteredStudents = allUsersData.filter(
        (user) => user && user?.roles?.includes("student")
      );
      //create
      const subjectCreated = await Subject.create({
        subjectName: data?.subjectName,
        "coreSubInfo.isCoreSubject": true,
        createdBy: data?.createdBy,
      });
      try {
        //   push core subject into admin's subjects✅
        if (
          subjectCreated &&
          !adminFound?.adminActionsData.subjects.includes(subjectCreated?._id)
        ) {
          await User.findOneAndUpdate(
            adminFound._id,
            { $push: { "adminActionsData.subjects": subjectCreated?._id } },
            { upsert: true }
          );
        }
        //   push core subject into student's core subjects✅
        if (subjectCreated && filteredStudents) {
          filteredStudents?.forEach(async (student) => {
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
        successMessage: "Core Subject Created Successfully",
        subject: subjectCreated,
      });
      console.log("Subject created successfully");
      console.log(subjectCreated);
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
// Get all subjects ✅
exports.getAllSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({}).populate([
      // { path: "teachers" },
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
