const { sendEnrollmentApprovalEmail } = require("../../emails/sendEmail");
const { cloudinary } = require("../../middlewares/cloudinary/cloudinary");
const {
  selectStudentHouse,
} = require("../../middlewares/student/studentMiddleware");
const ClassLevelSection = require("../../models/academics/class/ClassLevelSectionModel");
const Program = require("../../models/academics/programmes/ProgramsModel");
const AcademicYear = require("../../models/academics/year/AcademicYearModel");
const User = require("../../models/user/UserModel");

// Student online enrollment ✅
module.exports.studentOnlineEnrolment = async (req, res) => {
  const { data } = req.body;
  const placementStudent = req.placementStudent;
  console.log(placementStudent);

  const program = req.program;
  const studentClassInfo = req.studentClassInfo;
  try {
    // Find existing student data
    const existingStudentFound = await User.findOne({
      "studentSchoolData.jhsIndexNo": placementStudent?.jhsIndexNo,
    });
    if (existingStudentFound) {
      res.status(400).json({
        errorMessage: {
          message: [
            `Existing student found with your index number "${placementStudent?.jhsIndexNo}"!`,
          ],
        },
      });
      return;
    }
    const selectedAcademicYear = await AcademicYear.findOne({
      yearRange: data?.newStudent?.currentAcademicYear,
    });
    if (!selectedAcademicYear) {
      res.status(404).json({
        errorMessage: {
          message: ["Selected academic year data not found!"],
        },
      });
      return;
    }
    // Check for student image upload file
    if (!data?.newStudent?.profilePicture) {
      res.status(400).json({
        errorMessage: {
          message: ["No image selected or image file not supported!"],
        },
      });
      return;
    }
    await cloudinary.uploader.upload(
      data?.newStudent?.profilePicture,
      {
        folder: "Students",
        transformation: [
          { width: 300, height: 400, crop: "fill", gravity: "center" },
          { quality: "auto" },
          { fetch_format: "auto" },
        ],
      },
      async (err, result) => {
        if (err) {
          return res.status(400).json({
            errorMessage: {
              message: ["Something went wrong!"],
            },
          });
        }
        //Create new student enrolment data
        const newStudentData = await User.create({
          uniqueId: data?.studentId,
          "personalInfo.firstName": data?.newStudent?.firstName,
          "personalInfo.lastName": data?.newStudent?.lastName,
          "personalInfo.otherName": data?.newStudent?.otherName,
          "personalInfo.dateOfBirth": data?.newStudent?.dateOfBirth,
          "personalInfo.placeOfBirth": data?.newStudent?.placeOfBirth,
          "personalInfo.nationality": data?.newStudent?.nationality,
          "personalInfo.gender": data?.newStudent?.gender,
          "personalInfo.fullName": `${data?.newStudent?.firstName} ${data?.newStudent?.otherName} ${data?.newStudent?.lastName}`,
          roles: ["student"],
          "personalInfo.profilePicture": {
            public_id: result.public_id,
            url: result.secure_url,
          },
          "studentSchoolData.jhsAttended": data?.newStudent?.jhsAttended,
          "studentSchoolData.completedJhs": data?.newStudent?.completedJhs,
          "studentSchoolData.jhsIndexNo": data?.newStudent?.jhsIndexNo,
          "studentSchoolData.program": program?.mainProgramFound?._id,
          "studentSchoolData.divisionProgram":
            program?.studentDivisionProgramFound?._id,
          "studentSchoolData.currentClassLevel":
            data?.newStudent?.currentClassLevel,
          "studentSchoolData.currentAcademicYear": selectedAcademicYear,
          "studentSchoolData.batch": data?.newStudent?.batch,
          "studentSchoolData.currentClassLevelSection":
            studentClassInfo?.classSectionFound?._id,
          "studentSchoolData.currentClassTeacher":
            studentClassInfo?.classSectionFound?.currentTeacher,
          "status.height": data?.newStudent?.height,
          "status.weight": data?.newStudent?.weight,
          "status.complexion": data?.newStudent?.complexion,
          "status.motherTongue": data?.newStudent?.motherTongue,
          "status.otherTongue": data?.newStudent?.otherTongue,
          "status.residentialStatus": data?.newStudent?.residentialStatus,
          "contactAddress.homeTown": data?.newStudent?.homeTown,
          "contactAddress.district": data?.newStudent?.district,
          "contactAddress.region": data?.newStudent?.region,
          "contactAddress.currentCity": data?.newStudent?.currentCity,
          "contactAddress.residentialAddress":
            data?.newStudent?.residentialAddress,
          "contactAddress.gpsAddress": data?.newStudent?.gpsAddress,
          "contactAddress.mobile": data?.newStudent?.mobile,
          "contactAddress.email": data?.newStudent?.email,
          "studentStatusExtend.enrollmentStatus": "in progress",
        });
        // Add student's elective subjects
        if (program?.isDivisionProgram) {
          program?.studentDivisionProgramFound?.electiveSubjects?.forEach(
            async (subject) => {
              if (
                subject &&
                !newStudentData?.studentSchoolData?.electiveSubjects?.includes(
                  subject?._id
                )
              ) {
                await User.findOneAndUpdate(
                  newStudentData?._id,
                  {
                    $push: {
                      "studentSchoolData.electiveSubjects": subject?._id,
                    },
                  },
                  { upsert: true }
                );
              }
            }
          );
          //push student into division programme's students✅
          // if (
          //   !program?.studentDivisionProgramFound?.students?.includes(
          //     newStudentData?._id
          //   )
          // ) {
          //   program?.studentDivisionProgramFound?.students?.push(
          //     newStudentData?._id
          //   );
          //   await program.studentDivisionProgramFound.save();
          // }
          //push student into main programme's students✅
          // if (
          //   !program?.mainProgramFound?.students?.includes(newStudentData?._id)
          // ) {
          //   program?.mainProgramFound?.students?.push(newStudentData?._id);
          //   await program.mainProgramFound.save();
          // }
        }
        if (!program?.isDivisionProgram) {
          // Add student's elective subjects
          program?.mainProgramFound?.electiveSubjects?.forEach(
            async (subject) => {
              if (
                subject &&
                !newStudentData?.studentSchoolData?.electiveSubjects?.includes(
                  subject?._id
                )
              ) {
                await User.findOneAndUpdate(
                  newStudentData?._id,
                  {
                    $push: {
                      "studentSchoolData.electiveSubjects": subject?._id,
                    },
                  },
                  { upsert: true }
                );
              }
            }
          );
          //push student into main programme's students✅
          // if (
          //   !program?.mainProgramFound?.students?.includes(newStudentData?._id)
          // ) {
          //   program?.mainProgramFound?.students?.push(newStudentData?._id);
          //   await program.mainProgramFound.save();
          // }
        }
        //Push optionalElectiveSubject into student's electiveSubjects array
        if (
          data?.newStudent?.optionalElectiveSubject &&
          !newStudentData?.studentSchoolData?.electiveSubjects?.includes(
            data?.newStudent?.optionalElectiveSubject
          )
        ) {
          await User.findOneAndUpdate(
            newStudentData?._id,
            {
              $push: {
                "studentSchoolData.electiveSubjects":
                  data?.newStudent?.optionalElectiveSubject,
              },
            },
            { upsert: true, new: true }
          );
        }
        //Push student's current teacher into student's teachers array
        if (
          studentClassInfo?.classSectionFound?.currentTeacher &&
          !newStudentData?.studentSchoolData?.classTeachers?.includes(
            studentClassInfo?.classSectionFound?.currentTeacher
          )
        ) {
          await User.findOneAndUpdate(
            newStudentData?._id,
            {
              $push: {
                "studentSchoolData.classTeachers":
                  studentClassInfo?.classSectionFound?.currentTeacher,
              },
            },
            { new: true, upsert: true }
          );
        }
        //Update student's placement enrollmentId✅
        if (placementStudent) {
          placementStudent.enrollmentId = data?.studentId;
          await placementStudent.save();
        }
        res.status(201).json({
          successMessage: "Your enrollment info saved successfully!",
          newStudentData,
        });
        console.log("Your enrollment info saved successfully!");
      }
    );
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      errorMessage: {
        message: ["Internal Server Error!"],
      },
    });
  }
};
// Student enrollment approval ✅
module.exports.approveStudentEnrollment = async (req, res) => {
  const { enrollmentApprovedBy } = req.body;
  const student = req?.enrollmentApprovalData?.studentFound;
  try {
    //Find Student Class Section
    const studentClassSection = await ClassLevelSection.findOne({
      _id: student?.studentSchoolData?.currentClassLevelSection,
    });
    // //Find admin
    const admin = await User.findOne({ _id: enrollmentApprovedBy });
    if (!admin) {
      return res.status(404).json({
        errorMessage: {
          message: [`Operation Failed! You're Not An Admin!`],
        },
      });
    }
    //Update student's approval status✅
    if (
      student &&
      student?.studentStatusExtend?.enrollmentStatus === "pending"
    ) {
      const studentApproved = await User.findOneAndUpdate(
        { _id: student?.id },
        {
          "studentStatusExtend.enrollmentStatus": "approved",
          "studentStatusExtend.isStudent": true,
          "studentStatusExtend.enrollmentApprovedBy": admin?._id,
          // "studentSchoolData.currentClassLevelSection":
          //   studentClassSection?._id,
          // "studentSchoolData.currentClassTeacher":
          //   studentClassSection?.currentTeacher,
          "studentStatusExtend.enrollmentApprovementDate":
            new Date().toISOString(),
        },
        { new: true }
      );
      if (studentApproved && admin) {
        await User.findOneAndUpdate(
          admin?._id,
          {
            $push: {
              "adminActionsData.registeredStudents": studentApproved?._id,
            },
          },
          { upsert: true }
        );
      }
      // Update student's current class section
      if (
        studentClassSection &&
        !studentApproved?.studentSchoolData?.currentClassLevelSection
      ) {
        studentApproved.studentSchoolData.currentClassLevelSection =
          studentClassSection?._id;
        await studentApproved.save();
      }
      // Update student's current class teacher
      if (
        studentClassSection &&
        studentClassSection?.currentTeacher &&
        !studentApproved?.studentSchoolData?.currentClassTeacher
      ) {
        studentApproved.studentSchoolData.currentClassTeacher =
          studentClassSection?.currentTeacher;
        await studentApproved.save();
      }
      // Push student's current class teacher into student's classTeachers array
      if (
        studentClassSection &&
        !studentApproved?.studentSchoolData?.classTeachers?.includes(
          studentClassSection?.currentTeacher
        )
      ) {
        studentApproved.studentSchoolData.classTeachers.push(
          studentClassSection?.currentTeacher
        );
        await studentApproved.save();
      }
      //Send enrolment E-mail to student
      if (studentApproved && studentApproved?.contactAddress?.email !== "") {
        sendEnrollmentApprovalEmail({ foundStudent: studentApproved });
      }
      res.status(200).json({
        successMessage: "Student Approved Successfully!",
        studentApproved,
      });
    }
  } catch (error) {
    return res.status(500).json({
      errorMessage: {
        message: [`Internal Server Error!`],
      },
    });
  }
};
// Works ✅
module.exports.approveMultiStudents = async (req, res) => {
  const { students, adminFound } = req.multiEnrollmentApprovalData;
  try {
    students.forEach(async (student) => {
      //Find student
      const studentFound = await User.findOne({
        uniqueId: student?.uniqueId,
      });
      if (
        studentFound?.studentStatusExtend &&
        studentFound?.studentStatusExtend?.enrollmentStatus === "pending"
      ) {
        //Update student's enrollment data
        const studentApproved = await User.findOneAndUpdate(
          studentFound._id,
          {
            "studentStatusExtend.enrollmentStatus": "approved",
            "studentStatusExtend.isStudent": true,
            "studentStatusExtend.enrollmentApprovedBy": adminFound?._id,
            "studentStatusExtend.enrollmentApprovementDate":
              new Date().toISOString(),
          },
          { new: true }
        );
        if (studentApproved && adminFound) {
          await User.findOneAndUpdate(
            adminFound?._id,
            {
              $push: {
                "adminActionsData.registeredStudents": studentApproved?._id,
              },
            },
            { upsert: true }
          );
        }
        // Push classLevel into his students classLevels array ✅
        // if (
        //   !studentApproved?.studentSchoolData?.classLevels?.includes(
        //     studentApproved?.studentSchoolData?.currentClassLevel
        //   )
        // ) {
        //   studentApproved.studentSchoolData.classLevels.push(
        //     studentApproved?.studentSchoolData?.currentClassLevel
        //   );
        //   await studentApproved.save();
        // }
        // // push current academic year into students academic years array ✅
        // if (
        //   !studentApproved?.studentSchoolData?.academicYears?.includes(
        //     studentApproved?.studentSchoolData?.currentAcademicYear
        //   )
        // ) {
        //   studentApproved.studentSchoolData.academicYears.push(
        //     studentApproved?.studentSchoolData?.currentAcademicYear
        //   );
        //   await studentApproved.save();
        // }
        //Send enrolment E-mail to student
        if (studentApproved && studentApproved?.contactAddress?.email !== "") {
          sendEnrollmentApprovalEmail({ foundStudent: studentApproved });
        }
      }
    });
    res.status(200).json({
      successMessage: "All selected students approved successfully!",
      allApprovedStudents: students,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      errorMessage: {
        message: [error?.message],
      },
    });
  }
};
// Works ✅
module.exports.rejectStudentEnrollment = async (req, res) => {
  const { enrollmentRejectedBy } = req.body;
  const { studentId } = req.params;
  const currentUser = req.user;

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
    if (currentUser?.id !== enrollmentRejectedBy) {
      res.status(403).json({
        errorMessage: {
          message: ["Operation Denied! You're Not An Admin!"],
        },
      });
      return;
    }
    // //Find student
    const studentFound = await User.findOne({ uniqueId: studentId });
    if (!studentFound) {
      res.status(404).json({
        errorMessage: {
          message: ["Student data not found!"],
        },
      });
      return;
    } else {
      const studentRejected = await User.findOneAndUpdate(
        { _id: studentFound?.id },
        {
          "studentStatusExtend.enrollmentStatus": "rejected",
          "studentStatusExtend.isStudent": false,
          "studentStatusExtend.enrollmentRejectedBy": adminFound?._id,
          "studentStatusExtend.enrollmentRejectionDate":
            new Date().toISOString(),
        },
        { new: true }
      );
      //Send enrolment rejection E-mail to student
      // if (studentApproved && studentApproved?.contactAddress?.email !== "") {
      //   sendEnrollmentApprovalEmail({ foundStudent: studentApproved });
      // }
      res.status(200).json({
        successMessage: "Student rejected successfully!",
        studentRejected,
      });
    }
  } catch (error) {
    res.status(404).json({
      errorMessage: {
        message: [`Internal Server Error!`],
      },
    });
  }
};
// Works ✅
module.exports.rejectMultiStudents = async (req, res) => {
  const { students, enrollmentRejectedBy } = req.body;
  const authAdmin = req.user;
  console.log(students);
  console.log(enrollmentRejectedBy);
  console.log(authAdmin?.uniqueId);

  try {
    //Find admin taking action
    const adminFound = await User.findOne({ _id: enrollmentRejectedBy });
    // Validate admin's ID
    if (!adminFound) {
      res.status(404).json({
        errorMessage: {
          message: ["Operation denied! You're not an authorized admin"],
        },
      });
      return;
    }
    if (authAdmin && authAdmin?.id !== enrollmentRejectedBy) {
      res.status(404).json({
        errorMessage: {
          message: ["Operation denied! You're not an authorized admin"],
        },
      });
      return;
    }
    //Check if students data is greater than 0
    if (!students || students.length < 1) {
      res.status(404).json({
        errorMessage: {
          message: [`No student data selected!`],
        },
      });
      return;
    }
    const rejectedStudents = students.forEach(async (student) => {
      //Find student
      const studentFound = await User.findOne({
        uniqueId: student?.uniqueId,
      });
      if (
        studentFound?.studentStatusExtend &&
        studentFound?.studentStatusExtend?.enrollmentStatus === "pending"
      ) {
        //Update student's enrollment data
        await User.findOneAndUpdate(
          studentFound._id,
          {
            "studentStatusExtend.enrollmentStatus": "rejected",
            "studentStatusExtend.isStudent": false,
            "studentStatusExtend.enrollmentRejectedBy": adminFound?._id,
            "studentStatusExtend.enrollmentRejectionDate":
              new Date().toISOString(),
          },
          { new: true }
        );
        //Send enrolment rejection E-mail to student❓
        // if (studentApproved && studentApproved?.contactAddress?.email !== "") {
        //   sendEnrollmentApprovalEmail({ foundStudent: studentApproved });
        // }
      }
    });
    res.status(200).json({
      successMessage: "All selected students rejected successfully!",
      allRejectedStudents: rejectedStudents,
    });
  } catch (error) {
    return res.status(500).json({
      errorMessage: {
        message: [error?.message],
      },
    });
  }
};

module.exports.studentPersonalDataUpdate = async (req, res) => {
  const { userId } = req.params;
  const { updateData } = req.body;
  const foundStudent = req.foundUser;
  console.log(userId);
  console.log(updateData);

  try {
    //Update student Info
    const studentInfoUpdated = await User.findOneAndUpdate(
      foundStudent._id,
      {
        "personalInfo.firstName": updateData?.firstName,
        "personalInfo.lastName": updateData?.lastName,
        "personalInfo.otherName": updateData?.otherName,
        "personalInfo.dateOfBirth": updateData?.dateOfBirth,
        "personalInfo.placeOfBirth": updateData?.placeOfBirth,
        "personalInfo.gender": updateData?.gender,
        "personalInfo.nationality": updateData?.nationality,
        "personalInfo.fullName": `${updateData?.firstName} ${updateData?.otherName} ${updateData?.lastName}`,
        "contactAddress.homeTown": updateData?.homeTown,
        "contactAddress.district": updateData?.district,
        "contactAddress.region": updateData?.region,
        "contactAddress.currentCity": updateData?.currentCity,
        "contactAddress.gpsAddress": updateData?.gpsAddress,
        "contactAddress.residentialAddress": updateData?.residentialAddress,
        "contactAddress.mobile": updateData?.mobile,
        "contactAddress.email": updateData?.email,
        "status.height": updateData?.height,
        "status.weight": updateData?.weight,
        "status.complexion": updateData?.complexion,
        "status.motherTongue": updateData?.motherTongue,
        "status.otherTongue": updateData?.otherTongue,
        lastUpdatedBy: updateData?.lastUpdatedBy,
        previouslyUpdatedBy: foundStudent?.lastUpdatedBy
          ? foundStudent?.lastUpdatedBy
          : null,
        updatedDate: new Date().toISOString(),
      },
      {
        new: true,
      }
    );
    res.status(201).json({
      successMessage: "Student's data updated successfully!",
      updatedStudent: studentInfoUpdated,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      errorMessage: {
        message: [`Student Update Failed! ${error?.message}`],
      },
    });
    return;
  }
};

module.exports.studentSchoolDataUpdate = async (req, res) => {
  const { studentId } = req.params;
  const { updateData } = req.body;
  try {
    const foundStudent = await User.findOne({
      uniqueId: studentId,
    });
    if (!foundStudent) {
      res.status(404).json({
        errorMessage: {
          message: ["Student data not found!"],
        },
      });
      return;
    }
    const foundProgram = await Program.findOne({
      _id: updateData?.program,
    });
    if (!foundProgram) {
      res.status(404).json({
        errorMessage: {
          message: ["Programme Not Found!"],
        },
      });
      return;
    }
    //Update student school data
    if (foundStudent) {
      const studentInfoUpdated = await User.findOneAndUpdate(
        foundStudent._id,
        {
          "studentSchoolData.jhsAttended": updateData?.jhsAttended,
          "studentSchoolData.completedJhs": updateData?.completedJhs,
          "studentSchoolData.program": updateData?.program,
          "studentSchoolData.divisionProgram": updateData?.programDivision,
          "studentSchoolData.currentClassLevel": updateData?.currentClassLevel,
          "studentSchoolData.batch": updateData?.batch,
          "status.residentialStatus": updateData?.residentialStatus,
          lastUpdatedBy: updateData?.lastUpdatedBy,
          previouslyUpdatedBy: foundStudent?.lastUpdatedBy
            ? foundStudent?.lastUpdatedBy
            : null,
          updatedDate: new Date().toISOString(),
        },
        {
          new: true,
        }
      );
      res.status(201).json({
        successMessage: "Student's school data updated successfully!",
        updatedStudent: studentInfoUpdated,
      });
    }
  } catch (error) {
    res.status(500).json({
      errorMessage: {
        message: [`Student school data update failed! ${error?.message}`],
      },
    });
    return;
  }
};
