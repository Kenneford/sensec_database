const AcademicGrade = require("../../../models/academics/grades/AcademicGradesModel");
const DraftReport = require("../../../models/reports/DraftReportModel");
const Report = require("../../../models/reports/ReportModel");
const StudentReport = require("../../../models/reports/StudentReportModel");
const User = require("../../../models/user/UserModel");

module.exports.createStudentReport = async (req, res) => {
  const { studentId } = req.params;
  const currentUser = req.user;
  const { data } = req.body;
  // console.log(data);

  try {
    if (!data?.classScore && !data?.examScore) {
      res.status(404).json({
        errorMessage: {
          message: ["Both class and exam scores cannot be empty!"],
        },
      });
      return;
    }
    if (data?.classScore > 30) {
      res.status(404).json({
        errorMessage: {
          message: ["Class score should not exceed 30 marks"],
        },
      });
      return;
    }
    if (data?.examScore > 70) {
      res.status(404).json({
        errorMessage: {
          message: ["Exam scores should not exceed 70 marks!"],
        },
      });
      return;
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
    //Find student
    const studentFound = await User.findOne({ uniqueId: studentId });
    if (!studentFound) {
      res.status(404).json({
        errorMessage: {
          message: ["Student data not found!"],
        },
      });
      return;
    }
    // Find existing multiStudentsReport data
    const existingMultiStudentsReport = await Report.findOne({
      classLevel: data?.classLevel,
      semester: data?.semester,
      subject: data?.subject,
      lecturer: data?.lecturer,
      year: data?.year,
    });
    console.log(existingMultiStudentsReport);

    if (existingMultiStudentsReport) {
      await DraftReport.findOneAndDelete({
        classLevel: data?.classLevel,
        semester: data?.semester,
        subject: data?.subject,
        lecturer: data?.lecturer,
      });
      res.status(404).json({
        errorMessage: {
          message: ["Student report data already exist!"],
        },
      });
      return;
    }
    // Fetch the grade based on score
    const gradeFound = await AcademicGrade.findOne({
      minScore: { $lte: data?.totalScore },
      maxScore: { $gte: data?.totalScore },
    });
    if (!gradeFound) {
      res.status(404).json({
        errorMessage: {
          message: ["Grade data not found!"],
        },
      });
      return;
    }
    // if (data?.isDraftSave) {
    //   // Find existing report
    //   const reportFound = await StudentReport.findOne({
    //     studentId: data?.studentId,
    //     classLevel: data?.classLevel,
    //     semester: data?.semester,
    //     subject: data?.subject,
    //     year: data?.year,
    //   });
    //   if (reportFound) {
    //     const updatedReport = await StudentReport.findOneAndUpdate(
    //       reportFound?._id,
    //       {
    //         studentId: data?.studentId,
    //         classLevel: data?.classLevel,
    //         semester: data?.semester,
    //         subject: data?.subject,
    //         classScore: data?.classScore,
    //         examScore: data?.examScore,
    //         totalScore: data?.totalScore,
    //         grade: gradeFound?.grade,
    //         remark: gradeFound?.remark,
    //         lecturer: data?.lecturer,
    //       },
    //       { new: true }
    //     );
    //     res.status(201).json({
    //       successMessage: "Student's report created successfully!",
    //       studentReport: updatedReport,
    //     });
    //   } else {
    //     const newReport = await StudentReport.create({
    //       studentId: data?.studentId,
    //       classLevel: data?.classLevel,
    //       semester: data?.semester,
    //       subject: data?.subject,
    //       classScore: data?.classScore,
    //       examScore: data?.examScore,
    //       totalScore: data?.totalScore,
    //       grade: gradeFound?.grade,
    //       remark: gradeFound?.remark,
    //       lecturer: data?.lecturer,
    //       year: new Date().getFullYear(),
    //     });
    //     res.status(201).json({
    //       successMessage: "Student's report created successfully!",
    //       studentReport: newReport,
    //     });
    //     // res.status(403).json({
    //     //   errorMessage: {
    //     //     message: ["Student report data already exist!"],
    //     //   },
    //     // });
    //     // return;
    //   }
    // }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      errorMessage: {
        message: ["Internal Server Error!", error?.message],
      },
    });
  }
};
module.exports.saveDraftReports = async (req, res) => {
  const currentUser = req.user;
  const { data } = req.body;
  // console.log(data);

  try {
    if (!data) {
      return;
    }
    //Find Lecturer
    const lecturerFound = await User.findOne({ _id: currentUser?.id });
    const studentsObject = data?.students
      ?.map((std) => {
        if (std) {
          return {
            _id: std?._id,
            uniqueId: std?.uniqueId,
            personalInfo: std?.personalInfo,
            classScore: std?.classScore,
            examScore: std?.examScore,
            totalScore: std?.totalScore,
            grade: std?.grade,
          };
        }
        return null; // Optional: Return null for undefined/invalid students
      })
      .filter((student) => student !== null); // Remove any null values
    let newDraftData;
    // Find existing draft data
    const existingDraftData = await DraftReport.findOne({
      classLevel: data?.classLevel,
      semester: data?.semester,
      subject: data?.subject,
      lecturer: data?.lecturer,
    });
    if (existingDraftData) {
      await DraftReport.findOneAndUpdate(
        { _id: existingDraftData?._id },
        {
          students: studentsObject,
        },
        { new: true }
      );
      // newDraftData = await Report.create({
      //   classLevel: data?.classLevel,
      //   semester: data?.semester,
      //   subject: data?.subject,
      //   lecturer: data?.lecturer,
      //   students: studentsObject,
      // });
    } else {
      newDraftData = await DraftReport.create({
        classLevel: data?.classLevel,
        semester: data?.semester,
        subject: data?.subject,
        lecturer: data?.lecturer,
        students: studentsObject,
        year: new Date().getFullYear(),
      });
    }
    res.status(201).json({
      successMessage: "Draft report data saved successfully!",
      newDraftData,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      errorMessage: {
        message: ["Internal Server Error!", error?.message],
      },
    });
  }
};
module.exports.fetchDraftReport = async (req, res) => {
  const { data } = req.body;
  // console.log(data);
  try {
    if (!data) {
      return;
    }
    // Find existing draft data
    const existingDraftData = await DraftReport.findOne({
      classLevel: data?.classLevel,
      semester: data?.semester,
      subject: data?.subject,
      lecturer: data?.lecturer,
    });
    console.log(existingDraftData);

    if (existingDraftData) {
      res.status(200).json({
        successMessage: "Draft report data fetched successfully!",
        foundDraftReport: existingDraftData,
      });
    } else {
      // If no draft, fetch students matching the classLevel and subject
      const students = await User.find({
        "studentSchoolData.currentClassLevel": data?.classLevel,
        $or: [
          { "studentSchoolData.electiveSubjects": data?.subject },
          { "studentSchoolData.coreSubjects": data?.subject },
        ],
      });
      res.status(200).json({
        successMessage: "Students data fetched successfully!",
        foundDraftReport: students,
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
};
module.exports.createMultiStudentsReports = async (req, res) => {
  const currentUser = req.user;
  const { data } = req.body;
  // console.log(data);
  try {
    if (!data?.students?.length > 0) {
      res.status(403).json({
        errorMessage: {
          message: ["No student data selected!"],
        },
      });
      return;
    }
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
      res.status(403).json({
        errorMessage: {
          message: ["Report already exist!"],
        },
      });
      return;
    }
    // Create Multi Students Report
    const multiStudentsReport = await Report.create({
      classLevel: data?.classLevel,
      semester: data?.semester,
      subject: data?.subject,
      lecturer: data?.lecturer,
      year: data?.year,
    });
    if (multiStudentsReport) {
      data?.students?.forEach(async (std) => {
        if (std) {
          //Find Lecturer
          const lecturerFound = await User.findOne({ _id: currentUser?.id });
          //Find student
          const studentFound = await User.findOne({ uniqueId: std?.uniqueId });
          // Fetch the grade based on score
          const gradeFound = await AcademicGrade.findOne({
            minScore: { $lte: std?.totalScore },
            maxScore: { $gte: std?.totalScore },
          });
          // Find existing student report
          const existingReport = await StudentReport.findOne({
            studentId: std?.studentId,
            classLevel: data?.classLevel,
            semester: data?.semester,
            subject: data?.subject,
            year: data?.year,
          });
          if (!existingReport) {
            // Create Single Student Report
            const newStudentReport = await StudentReport.create({
              studentId: std?.studentId,
              classLevel: data?.classLevel,
              semester: data?.semester,
              subject: data?.subject,
              classScore: std?.classScore,
              examScore: std?.examScore,
              totalScore: std?.totalScore,
              grade: gradeFound?.grade,
              remark: gradeFound?.remark,
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
                studentId: std?.studentId,
                classLevel: data?.classLevel,
                semester: data?.semester,
                subject: data?.subject,
                classScore: std?.classScore,
                examScore: std?.examScore,
                totalScore: std?.totalScore,
                grade: gradeFound?.grade,
                remark: gradeFound?.remark,
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
        }
      });
      await DraftReport.findOneAndDelete({
        _id: existingDraftData?._id,
      });
      res.status(201).json({
        successMessage: "Report data saved successfully!",
        multiStudentsReport,
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
};
module.exports.fetchAllReports = async (req, res) => {
  const currentUser = req.user;
  try {
    //Find user
    const userFound = await User.findOne({ _id: currentUser?.id });
    if (
      !userFound ||
      (!currentUser?.roles?.includes("Admin") &&
        !currentUser?.roles?.includes("Lecturer") &&
        !currentUser?.roles?.includes("Headmaster"))
    ) {
      res.status(403).json({
        errorMessage: {
          message: ["Operation Denied! You're not an authorized user!"],
        },
      });
      return;
    }
    // Find reports
    const allReports = await Report.find({}).populate([
      {
        path: "students",
      },
    ]);
    //Find all students
    const allStudents = await User.find({
      "studentStatusExtend.enrollmentStatus": "approved",
      "studentStatusExtend.isStudent": true,
    });
    // console.log(allStudents?.length);
    // Create a lookup map for students array
    const studentMap = new Map(
      allStudents.map((student) => [student?.uniqueId, student])
    );
    console.log("Students MAP: ", studentMap);

    // Process the data
    const studentReports = [];

    allReports.forEach((report) => {
      report.students.forEach((studentReport) => {
        // Get the corresponding student details from the map
        const studentDetails = studentMap.get(studentReport?.studentId);
        console.log("Student Info: ", studentDetails);

        if (studentDetails) {
          // Combine report and student data
          studentReports.push({
            uniqueId: studentReport?.studentId, // Student ID
            fullName: studentDetails?.personalInfo?.fullName, // Student name (from `students` array)
            profilePicture: studentDetails?.personalInfo?.profilePicture?.url, // Student image (from `students` array)
            classScore: studentReport.classScore, // Example report-specific data
            examScore: studentReport.examScore, // Example report-specific data
            totalScore: studentReport.totalScore, // Example report-specific data
            lecturer: studentReport.lecturer, // Example report-specific data
            year: report?.year,
          });
        }
      });
    });
    console.log("All Report Students: ", studentReports);

    if (allReports) {
      res.status(201).json({
        successMessage: "Reports data fetched successfully!",
        allReports: studentReports,
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
};
module.exports.fetchAllStudentReports = async (req, res) => {
  const currentUser = req.user;
  try {
    //Find user
    const userFound = await User.findOne({ _id: currentUser?.id });
    if (
      !userFound ||
      (!currentUser?.roles?.includes("Admin") &&
        !currentUser?.roles?.includes("Lecturer") &&
        !currentUser?.roles?.includes("Student"))
    ) {
      res.status(403).json({
        errorMessage: {
          message: ["Operation Denied! You're not an authorized user!"],
        },
      });
      return;
    }
    // Find reports
    const allReports = await StudentReport.find({});
    if (allReports) {
      res.status(201).json({
        successMessage: "Reports data fetched successfully!",
        allStudentReports: allReports,
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
};
