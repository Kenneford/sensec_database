const mongoose = require("mongoose");
const AcademicGrade = require("../../../models/academics/grades/AcademicGradesModel");
const Subject = require("../../../models/academics/subjects/SubjectModel");
const DraftReport = require("../../../models/reports/DraftReportModel");
const Report = require("../../../models/reports/ReportModel");
const StudentReport = require("../../../models/reports/StudentReportModel");
const User = require("../../../models/user/UserModel");
const ClassLevel = require("../../../models/academics/class/ClassLevelModel");

module.exports.createStudentReport = async (req, res) => {
  const { studentId } = req.params;
  const currentUser = req.user;
  const { data } = req.body;
  // console.log(data);

  try {
    if (
      !data?.classScore ||
      data?.classScore === null ||
      !data?.examScore ||
      data?.examScore === null
    ) {
      res.status(404).json({
        errorMessage: {
          message: ["Both class and exam scores should be filled!"],
        },
      });
      return;
    }
    if (data?.classScore > 30) {
      res.status(404).json({
        errorMessage: {
          message: ["Class score should not exceed 30 marks!"],
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
    if (!data?.classLevel || data?.classLevel === null) {
      res.status(404).json({
        errorMessage: {
          message: ["Please select valid class level!"],
        },
      });
      return;
    }
    if (!data?.subject || data?.subject === null) {
      res.status(404).json({
        errorMessage: {
          message: ["Please select valid academic subject!"],
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
    if (data?.isDraftSave) {
      // Find existing report
      const reportFound = await StudentReport.findOne({
        studentId: data?.studentId,
        classLevel: data?.classLevel,
        semester: data?.semester,
        subject: data?.subject,
        year: data?.year,
      });
      if (reportFound) {
        const updatedReport = await StudentReport.findOneAndUpdate(
          reportFound?._id,
          {
            studentId: data?.studentId,
            student: studentFound?._id,
            classLevel: data?.classLevel,
            semester: data?.semester,
            subject: data?.subject,
            classScore: data?.classScore,
            examScore: data?.examScore,
            totalScore: data?.totalScore,
            grade: gradeFound?.grade,
            remark: gradeFound?.remark,
            lecturerRemark: data?.remark,
            lecturer: data?.lecturer,
          },
          { new: true }
        );
        res.status(201).json({
          successMessage: "Student's report created successfully!",
          studentReport: updatedReport,
        });
      } else {
        const newReport = await StudentReport.create({
          studentId: data?.studentId,
          student: studentFound?._id,
          classLevel: data?.classLevel,
          semester: data?.semester,
          subject: data?.subject,
          classScore: data?.classScore,
          examScore: data?.examScore,
          totalScore: data?.totalScore,
          grade: gradeFound?.grade,
          remark: gradeFound?.remark,
          lecturerRemark: data?.remark,
          lecturer: data?.lecturer,
          year: new Date().getFullYear(),
        });
        res.status(201).json({
          successMessage: "Student's report created successfully!",
          studentReport: newReport,
        });
      }
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
module.exports.saveDraftReports = async (req, res) => {
  const currentUser = req.user;
  const { data } = req.body;
  console.log(data?.programmes);
  try {
    if (!data) {
      return res.status(404).json({
        errorMessage: {
          message: ["No draft data to process!"],
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
              remark: std?.remark,
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
        subject: subjectFound?._id,
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
      } else {
        newDraftData = await DraftReport.create({
          classLevel: data?.classLevel,
          semester: data?.semester,
          subject: subjectFound?._id,
          lecturer: data?.lecturer,
          students: studentsObject,
          year: new Date().getFullYear(),
        });
      }
      res.status(201).json({
        successMessage: "Draft report data saved successfully!",
        newDraftData,
      });
    }
    // If Core Subject
    else if (subjectFound?.subjectInfo?.isCoreSubject) {
      // Format students data
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
              remark: std?.remark,
            };
          }
          return null; // Optional: Return null for undefined/invalid students
        })
        .filter((student) => student !== null); // Remove any null values
      // Set draft
      let newDraftData;
      // Extract program IDs and their types
      const programIds = data?.programmes.map((p) => p.program);
      // Find existing draft data
      const existingDraftData = await DraftReport.findOne({
        classLevel: data?.classLevel, // Match classLevel
        semester: data?.semester, // Match semester
        subject: subjectFound?._id, // Match subject
        lecturer: data?.lecturer, // Match lecturer
        programmes: {
          $all: programIds.map((programId) => ({
            $elemMatch: { program: programId }, // Ensure all programIds exist
          })),
        },
      });
      if (existingDraftData) {
        await DraftReport.findOneAndUpdate(
          { _id: existingDraftData?._id },
          {
            students: studentsObject,
          },
          { new: true }
        );
      } else {
        newDraftData = await DraftReport.create({
          classLevel: data?.classLevel,
          semester: data?.semester,
          subject: data?.subject,
          programmes: data?.programmes || null,
          lecturer: data?.lecturer,
          students: studentsObject,
          year: new Date().getFullYear(),
        });
      }
      res.status(201).json({
        successMessage: "Draft report data saved successfully!",
        newDraftData,
      });
    } else {
      return res.status(404).json({
        errorMessage: {
          message: ["Subject data not found or invalid!"],
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
};
module.exports.fetchElectiveDraftReport = async (req, res) => {
  try {
    const { user: currentUser, body: data } = req;

    if (!data) {
      return res
        .status(400)
        .json({ errorMessage: { message: ["No data to search for!"] } });
    }

    // Validate Object IDs
    const invalidIds = ["subject", "currentTeacher", "classLevel"].filter(
      (field) => data[field] && !mongoose.Types.ObjectId.isValid(data[field])
    );

    if (invalidIds.length > 0) {
      return res
        .status(400)
        .json({ errorMessage: { message: ["Invalid object ID detected!"] } });
    }

    // Validate User
    const authUserFound = await User.findById(currentUser?.id);
    if (
      !authUserFound ||
      (!currentUser?.roles?.includes("Lecturer") &&
        !currentUser?.roles?.includes("Admin"))
    ) {
      return res.status(403).json({
        errorMessage: {
          message: ["Operation Denied! You're not a lecturer!"],
        },
      });
    }

    // Validate Subject
    const subjectFound = await Subject.findById(data?.subject);
    if (!subjectFound?.subjectInfo?.isElectiveSubject) {
      return res.status(404).json({
        errorMessage: { message: ["Subject data not found or invalid!"] },
      });
    }

    // Find Lecturer
    const lecturerFound = await User.findOne({
      _id: authUserFound?._id,
      "lecturerSchoolData.teachingSubjects.electives": {
        $elemMatch: {
          subject: subjectFound?._id,
          classLevel: data?.classLevel,
        },
      },
    });
    if (!lecturerFound) {
      return res.status(404).json({
        errorMessage: { message: ["You're not the lecturer!"] },
      });
    }
    console.log("lecturerFound: ", lecturerFound);

    // Check if draft report exists
    const existingDraftData = await DraftReport.findOne({
      classLevel: data?.classLevel,
      semester: data?.semester,
      subject: data?.subject,
      lecturer: data?.lecturer,
    });

    if (existingDraftData) {
      return res.status(200).json({
        successMessage: "Draft report data fetched successfully!",
        foundDraftReport: existingDraftData,
      });
    }

    // Fetch Students for the Elective Subject
    const students = await User.find({
      "studentSchoolData.currentClassLevel": data?.classLevel,
      "studentSchoolData.subjects": { $in: [data?.subject] },
    }).select("_id uniqueId personalInfo.profilePicture personalInfo.fullName");

    const studentsObject = students.map((std) => ({
      _id: std._id,
      uniqueId: std.uniqueId,
      personalInfo: std.personalInfo,
    }));

    return res.status(200).json({
      successMessage: "Students data fetched successfully!",
      foundDraftReport: {
        classLevel: data?.classLevel,
        subject: subjectFound?._id,
        students: studentsObject,
      },
    });
  } catch (error) {
    console.error("Error fetching elective draft report:", error);
    return res.status(500).json({
      errorMessage: {
        message: ["Internal Server Error!", error.message],
      },
    });
  }
};
module.exports.fetchCoreDraftReport = async (req, res) => {
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
    if (!data?.programmes?.length > 0) {
      return res.status(403).json({
        errorMessage: {
          message: ["No program data selected!"],
        },
      });
    }
    if (
      (data?.subject && !mongoose.Types.ObjectId.isValid(data?.subject)) ||
      (data?.currentTeacher &&
        !mongoose.Types.ObjectId.isValid(data?.currentTeacher)) ||
      (data.classLevel && !mongoose.Types.ObjectId.isValid(data.classLevel))
    ) {
      return res.status(403).json({
        errorMessage: {
          message: ["Invalid object ID detected!"],
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
    //Find Subject
    const subjectFound = await Subject.findOne({ _id: data?.subject });
    if (subjectFound?.subjectInfo?.isCoreSubject) {
      // Extract program IDs and their types
      const programIds = data?.programmes?.map((p) => p?.programId);
      // Find existing draft data
      const existingDraftData = await DraftReport.findOne({
        classLevel: classLevelFound?._id, // Match classLevel
        semester: data?.semester, // Match semester
        subject: subjectFound?._id, // Match subject
        lecturer: data?.lecturer, // Match lecturer
        programmes: {
          $all: programIds?.map((programId) => ({
            $elemMatch: { programId: programId }, // Ensure all programIds exist
          })),
        },
      });
      // Check programmes length
      if (
        existingDraftData &&
        existingDraftData?.programmes?.length !== data?.programmes?.length
      ) {
        return res.status(403).json({
          errorMessage: {
            message: ["Please select all programmes under this subject!"],
          },
        });
      }

      if (existingDraftData) {
        res.status(200).json({
          successMessage: "Draft report data fetched successfully!",
          foundDraftReport: existingDraftData,
        });
      } else {
        //Find all students this programme
        const students = await User.find({
          "studentSchoolData.program.programId": { $in: programIds },
          "studentSchoolData.currentClassLevel": classLevelFound?._id,
        });
        const studentsObject = students?.map((std) => ({
          _id: std._id,
          uniqueId: std.uniqueId,
          personalInfo: std.personalInfo,
        }));

        const lecturerCoreSubjData =
          lecturerFound?.lecturerSchoolData?.teachingSubjects?.cores?.find(
            (coreData) => {
              return (
                coreData?.subject?.toString() ===
                  subjectFound?._id?.toString() &&
                coreData?.classLevel?.toString() ===
                  classLevelFound?._id?.toString() &&
                // Strictly match all program IDs
                coreData?.programmes?.length === programIds.length && // Ensure same length
                coreData?.programmes?.every(
                  (prog) => programIds?.includes(prog.programId.toString()) // Check if every stored programId exists in programIds
                )
              );
            }
          );
        // console.log(lecturerElectiveSubjData);
        // Check programmes length
        if (!lecturerCoreSubjData) {
          return res.status(403).json({
            errorMessage: {
              message: ["You're not the lecturer!"],
            },
          });
        }
        if (
          lecturerCoreSubjData &&
          lecturerCoreSubjData?.programmes?.length !== programIds?.length
        ) {
          return res.status(403).json({
            errorMessage: {
              message: ["Please select all programmes under this subject!"],
            },
          });
        }

        res.status(200).json({
          successMessage: "Students data fetched successfully!",
          foundDraftReport: {
            classLevel: classLevelFound?._id,
            subject: subjectFound?._id,
            students: studentsObject,
          },
        });
      }
    } else {
      return res.status(404).json({
        errorMessage: {
          message: ["Subject data not found or invalid!"],
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
};
module.exports.createMultiStudentsReports = async (req, res) => {
  const { multiStudentsReport, existingDraftData } = req.multiReportData;
  try {
    await DraftReport.findOneAndDelete({
      _id: existingDraftData?._id,
    });
    res.status(201).json({
      successMessage: "Report data saved successfully!",
      multiStudentsReport,
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
            grade: studentReport.grade, // Example report-specific data
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
module.exports.fetchSubjectMultiStudentsReport = async (req, res) => {
  const reportFound = req.reportFound;
  console.log(reportFound);

  try {
    if (reportFound) {
      res.status(201).json({
        successMessage: "Reports data fetched successfully!",
        foundReports: reportFound,
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
// Not In Use❓
module.exports.fetchReportStudents = async (req, res) => {
  const data = req.body;
  // console.log(data);

  try {
    const lecturer = await User.findOne({ _id: data?.lecturerId }).populate([
      {
        path: "lecturerSchoolData.teachingSubjects.electives.students", // Path to populate
        // model: "User", // Model to reference
        // match: { active: true }, // (Optional) Filter students if needed
        select:
          "_id uniqueId personalInfo.profilePicture personalInfo.fullName", // (Optional) Specify fields to include
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
      },
    ]);
    if (!lecturer) {
      return res.status(404).json({
        errorMessage: {
          message: [`Operation Failed! Lecturer data not found!`],
        },
      });
    }
    let lecturerElectiveSubjData;
    if (data?.divisionProgram) {
      lecturerElectiveSubjData =
        lecturer?.lecturerSchoolData?.teachingSubjects?.electives?.find(
          (electiveData) =>
            electiveData?.subject?.toString() === data?.subject &&
            electiveData?.classLevel?.toString() === data?.classLevel &&
            electiveData?.programDivision?.toString() ===
              data?.divisionProgram &&
            electiveData
        );
    } else {
      lecturerElectiveSubjData =
        lecturer?.lecturerSchoolData?.teachingSubjects?.electives?.find(
          (electiveData) =>
            electiveData?.subject?.toString() === data?.subject &&
            electiveData?.classLevel?.toString() === data?.classLevel &&
            electiveData?.program?.toString() === data?.program &&
            electiveData
        );
    }
    console.log("Lecturer Elective Data:", lecturerElectiveSubjData);

    if (!lecturerElectiveSubjData) {
      return res.status(404).json({
        errorMessage: {
          message: [`Operation Failed! Data not found!`],
        },
      });
    }
    // Now, find all students whose subject matches this lecturer's elective
    const students = await User.find({
      "studentSchoolData.program": lecturerElectiveSubjData?.program,
      "studentSchoolData.currentClassLevel":
        lecturerElectiveSubjData?.classLevel,
      "studentSchoolData.subjects": {
        $in: [lecturerElectiveSubjData?.subject],
      },
      roles: {
        $in: ["Student"],
      },
    });
    res.status(201).json({
      successMessage: "Students data fetched successfully!",
      students: lecturerElectiveSubjData?.students,
    });
  } catch (error) {
    res.status(500).json({
      errorMessage: {
        message: [`Internal sever error! ${error?.message}`],
      },
    });
    return;
  }
};
module.exports.searchClassReport = async (req, res) => {
  const currentUser = req.user;
  const data = req.body;
  console.log(data, "L-446");
  try {
    const setStartOfDay = (date) => {
      date.setHours(0, 0, 0, 0);
      return date;
    };

    const setEndOfDay = (date) => {
      date.setHours(23, 59, 59, 999);
      return date;
    };
    const parseDate = (dateString) => {
      if (!dateString) return null;
      const [day, month, year] = dateString.split("/").map(Number);
      return new Date(year, month - 1, day); // Convert to valid Date object
    };
    if (!data) {
      res.status(403).json({
        errorMessage: {
          message: [`No data to search for!`],
        },
      });
      return;
    }
    const lecturerFound = await User.findOne({ _id: currentUser?.id });
    if (!lecturerFound || !currentUser?.roles?.includes("Lecturer")) {
      res.status(403).json({
        errorMessage: {
          message: ["Not an authorized user!"],
        },
      });
      return;
    }
    //Search Class Attendance
    let foundClassReports;
    // Search By Year✅
    if (data?.year) {
      const foundReports = await Report.find({
        year: data?.year,
        lecturer: data?.lecturer,
      }).populate([
        {
          path: "lecturer",
          select:
            "_id uniqueId personalInfo.profilePicture personalInfo.fullName",
        },
        {
          path: "students",
          populate: [
            {
              path: "student",
              select:
                "_id uniqueId personalInfo.profilePicture personalInfo.fullName",
              // populate: [{ path: "studentSchoolData.program" }],
            },
          ],
        },
      ]);
      foundClassReports = foundReports;
    }
    // Search By Month✅
    if (data?.monthRange) {
      // Convert date strings to real Date objects
      const monthStart = setStartOfDay(parseDate(data?.monthRange?.start));
      const monthEnd = setEndOfDay(parseDate(data?.monthRange?.end));
      console.log("Month Start:", data?.monthRange?.start);
      console.log("Month End:", data?.monthRange?.end);
      const foundReports = await Report.find({
        lecturer: data?.lecturer,
        createdAt: { $gte: monthStart, $lte: monthEnd },
      }).populate([
        {
          path: "lecturer",
          select:
            "_id uniqueId personalInfo.profilePicture personalInfo.fullName",
        },
        {
          path: "students",
          populate: [
            {
              path: "student",
              select:
                "_id uniqueId personalInfo.profilePicture personalInfo.fullName",
              // populate: [{ path: "studentSchoolData.program" }],
            },
          ],
        },
        {
          path: "classLevel",
          select: "_id name",
        },
        { path: "subject", select: "_id subjectName" },
      ]);
      foundClassReports = foundReports;
    }
    // Search By Week-Range
    if (data?.weekRange) {
      // Convert date strings to real Date objects
      const fromDate = setStartOfDay(parseDate(data?.weekRange?.start));
      const toDate = setEndOfDay(parseDate(data?.weekRange?.end));
      const foundReports = await Report.find({
        lecturer: data?.lecturer,
        createdAt: { $gte: fromDate, $lte: toDate },
      }).populate([
        {
          path: "lecturer",
          select:
            "_id uniqueId personalInfo.profilePicture personalInfo.fullName",
        },
        {
          path: "students",
          populate: [
            {
              path: "student",
              select:
                "_id uniqueId personalInfo.profilePicture personalInfo.fullName",
              // populate: [{ path: "studentSchoolData.program" }],
            },
          ],
        },
      ]);
      foundClassReports = foundReports;
    }
    // // Search By Date✅
    if (data?.date) {
      const fromDate = setStartOfDay(parseDate(data?.date));
      const toDate = setEndOfDay(parseDate(data?.date));
      const foundReports = await Report.find({
        createdAt: { $gte: fromDate, $lte: toDate },
        lecturer: data?.lecturer,
      }).populate([
        {
          path: "lecturer",
          select:
            "_id uniqueId personalInfo.profilePicture personalInfo.fullName",
        },
        {
          path: "students",
          populate: [
            {
              path: "student",
              select:
                "_id uniqueId personalInfo.profilePicture personalInfo.fullName",
              // populate: [{ path: "studentSchoolData.program" }],
            },
          ],
        },
      ]);
      foundClassReports = foundReports;
    }
    // // Search By Date-Range
    if (data?.dateRange) {
      // Convert date strings to real Date objects
      const fromDate = setStartOfDay(parseDate(data?.dateRange?.from));
      const toDate = setEndOfDay(parseDate(data?.dateRange?.to));

      const foundReports = await Report.find({
        lecturer: data?.lecturer,
        createdAt: { $gte: fromDate, $lte: toDate },
      }).populate([
        {
          path: "lecturer",
          select:
            "_id uniqueId personalInfo.profilePicture personalInfo.fullName",
        },
        {
          path: "students",
          populate: [
            {
              path: "student",
              select:
                "_id uniqueId personalInfo.profilePicture personalInfo.fullName",
              // populate: [{ path: "studentSchoolData.program" }],
            },
          ],
        },
      ]);
      foundClassReports = foundReports;
    }
    // // Search By Semester
    if (data?.semester) {
      const foundReports = await Report.find({
        semester: data?.semester,
        lecturer: data?.lecturer,
      }).populate([
        {
          path: "lecturer",
          select:
            "_id uniqueId personalInfo.profilePicture personalInfo.fullName",
        },
        {
          path: "students",
          populate: [
            {
              path: "student",
              select:
                "_id uniqueId personalInfo.profilePicture personalInfo.fullName",
              // populate: [{ path: "studentSchoolData.program" }],
            },
          ],
        },
        { path: "classLevel" },
        { path: "subject" },
      ]);
      foundClassReports = foundReports;
    }
    res.status(200).json({
      successMessage: "Class report fetched successfully!",
      foundClassReports,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      errorMessage: {
        message: [`Internal Sever Error!`, error?.message],
      },
    });
    return;
  }
};
