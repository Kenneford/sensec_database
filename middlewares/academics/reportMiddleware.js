const AcademicGrade = require("../../models/academics/grades/AcademicGradesModel");
const Subject = require("../../models/academics/subjects/SubjectModel");
const DraftReport = require("../../models/reports/DraftReportModel");
const Report = require("../../models/reports/ReportModel");
const StudentReport = require("../../models/reports/StudentReportModel");
const User = require("../../models/user/UserModel");

async function multiElectiveReport(req, res, next) {
  const currentUser = req.user;
  const { data } = req.body;
  // console.log(data);
  try {
    if (!data) {
      return res.status(500).json({
        errorMessage: {
          message: ["No data to search for!"],
        },
      });
    }
    if (!data?.students?.length > 0) {
      return res.status(403).json({
        errorMessage: {
          message: ["No student data selected!"],
        },
      });
    }
    //Find Lecturer
    const lecturerFound = await User.findOne({ _id: currentUser?.id });
    if (!lecturerFound || !currentUser?.roles?.includes("Lecturer")) {
      res.status(403).json({
        errorMessage: {
          message: ["Operation Denied! You're not a lecturer!"],
        },
      });
      return;
    }
    if (currentUser?.id !== data?.lecturer) {
      res.status(403).json({
        errorMessage: {
          message: ["Operation Denied! You're not a lecturer!"],
        },
      });
      return;
    }
    //Find Subject
    const subjectFound = await Subject.findOne({ _id: data?.subject });
    // If Elective Subject
    if (subjectFound?.subjectInfo?.isElectiveSubject) {
      // Find existing draft data
      const existingDraftData = await DraftReport.findOne({
        classLevel: data?.classLevel,
        semester: data?.semester,
        subject: data?.subject,
        lecturer: data?.lecturer,
      });
      // Find existing multiStudentsReport data
      const existingMultiStudentsReport = await Report.findOne({
        classLevel: data?.classLevel,
        semester: data?.semester,
        subject: data?.subject,
        lecturer: data?.lecturer,
        year: data?.year,
      });
      if (existingMultiStudentsReport) {
        await DraftReport.findOneAndDelete({
          _id: existingDraftData?._id,
        });
        return res.status(403).json({
          errorMessage: {
            message: ["Report already exist!"],
          },
        });
      }
      if (data?.students?.length > 0) {
        for (const student of data?.students) {
          if (student) {
            if (!student?.classScore || !student?.examScore) {
              return res.status(403).json({
                errorMessage: {
                  message: ["Please fill all students reports!"],
                },
              });
            }
            // Create Multi Students Report
            const multiStudentsReport = await Report.create({
              classLevel: data?.classLevel,
              semester: data?.semester,
              subject: data?.subject,
              lecturer: data?.lecturer,
              year: data?.year,
            });
            //Find Lecturer
            const lecturerFound = await User.findOne({ _id: currentUser?.id });
            // Fetch the grade based on score
            const gradeFound = await AcademicGrade.findOne({
              minScore: { $lte: student?.totalScore },
              maxScore: { $gte: student?.totalScore },
            });
            // Find existing student report
            const existingReport = await StudentReport.findOne({
              studentId: student?.studentId,
              classLevel: data?.classLevel,
              semester: data?.semester,
              subject: data?.subject,
              year: data?.year,
            });
            if (!existingReport) {
              // Create Single Student Report
              const newStudentReport = await StudentReport.create({
                studentId: student?.studentId,
                classLevel: data?.classLevel,
                semester: data?.semester,
                subject: data?.subject,
                classScore: student?.classScore,
                examScore: student?.examScore,
                totalScore: student?.totalScore,
                grade: gradeFound?.grade,
                remark: gradeFound?.remark,
                lecturerRemark: data?.remark,
                lecturer: lecturerFound?._id,
                year: data?.year,
              });
              if (
                newStudentReport &&
                multiStudentsReport &&
                !multiStudentsReport?.students?.includes(newStudentReport?._id)
              ) {
                await Report.findOneAndUpdate(
                  multiStudentsReport?._id,
                  {
                    $push: {
                      students: newStudentReport?._id,
                    },
                  },
                  { upsert: true }
                );
              }
            } else {
              const updatedReport = await StudentReport.findOneAndUpdate(
                existingReport?._id,
                {
                  studentId: student?.studentId,
                  classLevel: data?.classLevel,
                  semester: data?.semester,
                  subject: data?.subject,
                  classScore: student?.classScore,
                  examScore: student?.examScore,
                  totalScore: student?.totalScore,
                  grade: gradeFound?.grade,
                  remark: gradeFound?.remark,
                  lecturerRemark: data?.remark,
                  lecturer: data?.lecturer,
                  year: data?.year,
                },
                { new: true }
              );
              if (
                updatedReport &&
                multiStudentsReport &&
                !multiStudentsReport?.students?.includes(updatedReport?._id)
              ) {
                await Report.findOneAndUpdate(
                  multiStudentsReport?._id,
                  {
                    $push: {
                      students: updatedReport?._id,
                    },
                  },
                  { upsert: true }
                );
              }
            }
            req.multiReportData = {
              multiStudentsReport,
              existingDraftData,
              lecturerFound,
            };
            next();
          }
        }
      }
    } else {
      req.multiReportData = {
        lecturerFound,
      };
      next();
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      errorMessage: {
        message: ["Internal Server Error!", error?.message],
      },
    });
  }
}
async function multiCoreReport(req, res, next) {
  const currentUser = req.user;
  const { data } = req.body;
  const { lecturerFound } = req.multiReportData;
  console.log(data);
  try {
    //Find Subject
    const subjectFound = await Subject.findOne({ _id: data?.subject });
    // If Elective Subject
    if (subjectFound?.subjectInfo?.isCoreSubject) {
      if (!data) {
        return res.status(500).json({
          errorMessage: {
            message: ["No data to search for!"],
          },
        });
      }
      if (!data?.programmes?.length > 0) {
        return res.status(403).json({
          errorMessage: {
            message: ["No program data selected!"],
          },
        });
      }
      // Extract program IDs and their types
      const programIds = data?.programmes?.map((p) => p?.programId);
      // Find existing draft data
      const existingDraftData = await DraftReport.findOne({
        classLevel: data?.classLevel, // Match classLevel
        semester: data?.semester, // Match semester
        subject: subjectFound?._id, // Match subject
        lecturer: lecturerFound?._id, // Match lecturer
        programmes: {
          $all: programIds?.map((programId) => ({
            $elemMatch: { programId: programId }, // Ensure all programIds exist
          })),
          $size: programIds.length,
        },
        year: data?.year,
      });
      // Find existing multiStudentsReport data
      const existingMultiStudentsReport = await Report.findOne({
        classLevel: data?.classLevel,
        semester: data?.semester,
        subject: data?.subject,
        lecturer: lecturerFound?._id,
        "programmes.programId": { $all: programIds },
        // programmes: {
        //   $all: programIds?.map((programId) => ({
        //     $elemMatch: { programId: programId }, // Ensure all programIds exist
        //   })),
        // },
        year: data?.year,
      });
      if (existingMultiStudentsReport) {
        await DraftReport.findOneAndDelete({
          _id: existingDraftData?._id,
        });
        return res.status(403).json({
          errorMessage: {
            message: ["Report already exist!"],
          },
        });
      }
      if (data?.students?.length > 0) {
        // Create Multi Students Report
        const multiStudentsReport = await Report.create({
          classLevel: data?.classLevel,
          semester: data?.semester,
          subject: data?.subject,
          lecturer: lecturerFound?._id,
          programmes: data?.programmes,
          year: data?.year,
        });
        for (const student of data?.students) {
          if (student) {
            if (!student?.classScore || !student?.examScore) {
              return res.status(403).json({
                errorMessage: {
                  message: ["Please fill all students reports!"],
                },
              });
            }
            //Find Lecturer
            const lecturerFound = await User.findOne({ _id: currentUser?.id });
            // Fetch the grade based on score
            const gradeFound = await AcademicGrade.findOne({
              minScore: { $lte: student?.totalScore },
              maxScore: { $gte: student?.totalScore },
            });
            // Find existing student report
            const existingReport = await StudentReport.findOne({
              studentId: student?.studentId,
              classLevel: data?.classLevel,
              semester: data?.semester,
              subject: data?.subject,
              // programmes: {
              //   $all: programIds?.map((programId) => ({
              //     $elemMatch: { program: programId }, // Ensure all programIds exist
              //   })),
              // },
              year: data?.year,
            });
            if (!existingReport) {
              // Create Single Student Report
              const newStudentReport = await StudentReport.create({
                studentId: student?.studentId,
                classLevel: data?.classLevel,
                semester: data?.semester,
                subject: data?.subject,
                classScore: student?.classScore,
                examScore: student?.examScore,
                totalScore: student?.totalScore,
                grade: gradeFound?.grade,
                remark: gradeFound?.remark,
                lecturerRemark: data?.remark,
                lecturer: lecturerFound?._id,
                year: data?.year,
              });
              if (
                newStudentReport &&
                multiStudentsReport &&
                !multiStudentsReport?.students?.includes(newStudentReport?._id)
              ) {
                await Report.findOneAndUpdate(
                  multiStudentsReport?._id,
                  {
                    $push: {
                      students: newStudentReport?._id,
                    },
                  },
                  { upsert: true }
                );
              }
            } else {
              const updatedReport = await StudentReport.findOneAndUpdate(
                existingReport?._id,
                {
                  studentId: student?.studentId,
                  classLevel: data?.classLevel,
                  semester: data?.semester,
                  subject: data?.subject,
                  classScore: student?.classScore,
                  examScore: student?.examScore,
                  totalScore: student?.totalScore,
                  grade: gradeFound?.grade,
                  remark: gradeFound?.remark,
                  lecturerRemark: data?.remark,
                  lecturer: lecturerFound?._id,
                  programmes: data?.programmes,
                  year: data?.year,
                },
                { new: true }
              );
              if (
                updatedReport &&
                multiStudentsReport &&
                !multiStudentsReport?.students?.includes(updatedReport?._id)
              ) {
                await Report.findOneAndUpdate(
                  multiStudentsReport?._id,
                  {
                    $push: {
                      students: updatedReport?._id,
                    },
                  },
                  { upsert: true }
                );
              }
            }
            req.multiReportData = {
              multiStudentsReport,
              existingDraftData,
            };
            next();
          }
        }
      }
    } else {
      next();
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      errorMessage: {
        message: ["Internal Server Error!", error?.message],
      },
    });
  }
}
async function fetchMultiElectiveReport(req, res, next) {
  const currentUser = req.user;
  const data = req.body;
  // console.log(data);
  try {
    if (!data) {
      return res.status(500).json({
        errorMessage: {
          message: ["No data to search for!"],
        },
      });
    }
    //Find Lecturer
    const lecturerFound = await User.findOne({ _id: currentUser?.id });
    if (!lecturerFound || !currentUser?.roles?.includes("Lecturer")) {
      res.status(403).json({
        errorMessage: {
          message: ["Operation Denied! You're not a lecturer!"],
        },
      });
      return;
    }
    if (currentUser?.id !== data?.lecturer) {
      res.status(403).json({
        errorMessage: {
          message: ["Operation Denied! You're not a lecturer!"],
        },
      });
      return;
    }
    //Find Subject
    const subjectFound = await Subject.findOne({ _id: data?.subject });

    // If Elective Subject
    if (subjectFound && subjectFound?.subjectInfo?.isElectiveSubject) {
      // Find existing multiStudentsReport data
      const existingMultiStudentsReport = await Report.findOne({
        classLevel: data?.classLevel,
        semester: data?.semester,
        subject: data?.subject,
        lecturer: data?.lecturer,
        year: data?.year,
      })
        .populate([{ path: "students" }])
        .lean();
      // console.log("existingMultiStudentsReport: ", existingMultiStudentsReport);

      if (existingMultiStudentsReport) {
        const allUsers = await User.find({});
        // Map over students to extract the needed fields
        const newStudentsData = existingMultiStudentsReport?.students?.map(
          (std) => {
            const studentData = allUsers?.find(
              (user) => user?.uniqueId === std?.studentId
            );
            const studentObj = {
              studentId: std?.studentId,
              classScore: std?.classScore,
              examScore: std?.examScore,
              totalScore: std?.totalScore,
              grade: std?.grade,
              lecturerRemark: std?.lecturerRemark,
              personalInfo: studentData?.personalInfo,
            };
            return studentObj;
          }
        );

        // Create a new report object with updated students
        const newReportObj = {
          ...existingMultiStudentsReport,
          isExistingReport: true,
          students: newStudentsData, // Override the students field
        };

        // Attach the cleaned object to the request
        req.reportFound = newReportObj;
        next();
      }
    } else {
      return res.status(500).json({
        errorMessage: {
          message: ["Subject data not found!"],
        },
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      errorMessage: {
        message: ["Internal Server Error!", error?.message],
      },
    });
  }
}
async function fetchMultiCoreReport(req, res, next) {
  const currentUser = req.user;
  const data = req.body;
  // console.log("dataFromBody: ",data);
  try {
    if (!data) {
      return res.status(500).json({
        errorMessage: {
          message: ["No data to search for!"],
        },
      });
    }
    if (!data?.programmes?.length > 0) {
      return res.status(403).json({
        errorMessage: {
          message: ["No program data selected!"],
        },
      });
    }
    //Find Lecturer
    const lecturerFound = await User.findOne({ _id: currentUser?.id });
    if (!lecturerFound || !currentUser?.roles?.includes("Lecturer")) {
      res.status(403).json({
        errorMessage: {
          message: ["Operation Denied! You're not a lecturer!"],
        },
      });
      return;
    }
    if (currentUser?.id !== data?.lecturer) {
      res.status(403).json({
        errorMessage: {
          message: ["Operation Denied! You're not a lecturer!"],
        },
      });
      return;
    }
    //Find Subject
    const subjectFound = await Subject.findOne({ _id: data?.subject });
    if (!subjectFound) {
      return res.status(404).json({
        errorMessage: {
          message: ["Subject data not found!"],
        },
      });
    }
    // If Elective Subject
    if (subjectFound && subjectFound?.subjectInfo?.isCoreSubject) {
      // Extract program IDs and their types
      const programIds = data?.programmes?.map((p) => p?.programId);
      // Find existing multiStudentsReport data
      const existingMultiStudentsReport = await Report.findOne({
        classLevel: data?.classLevel,
        semester: data?.semester,
        subject: data?.subject,
        lecturer: lecturerFound?._id,
        "programmes.programId": { $all: programIds },
        // programmes: {
        //   $all: programIds?.map((programId) => ({
        //     $elemMatch: { program: programId }, // Ensure all programIds exist
        //   })),
        // },
        year: data?.year,
      })
        .populate([{ path: "students" }])
        .lean();
      if (existingMultiStudentsReport) {
        const allUsers = await User.find({});
        // Map over students to extract the needed fields
        const newStudentsData = existingMultiStudentsReport.students?.map(
          (std) => {
            const studentData = allUsers?.find(
              (user) => user?.uniqueId === std?.studentId
            );
            const studentObj = {
              studentId: std?.studentId,
              classScore: std?.classScore,
              examScore: std?.examScore,
              totalScore: std?.totalScore,
              grade: std?.grade,
              lecturerRemark: std?.lecturerRemark,
              personalInfo: studentData?.personalInfo,
            };
            return studentObj;
          }
        );

        // Create a new report object with updated students
        const newReportObj = {
          ...existingMultiStudentsReport,
          isExistingReport: true,
          students: newStudentsData, // Override the students field
        };

        // Attach the cleaned object to the request
        req.reportFound = newReportObj;
        next();
      }
    } else {
      return res.status(500).json({
        errorMessage: {
          message: ["Subject data not found!"],
        },
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      errorMessage: {
        message: ["Internal Server Error!", error?.message],
      },
    });
  }
}

module.exports = {
  multiElectiveReport,
  multiCoreReport,
  fetchMultiElectiveReport,
  fetchMultiCoreReport,
};
