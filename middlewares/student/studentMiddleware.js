const mongoose = require("mongoose");
const ClassLevel = require("../../models/academics/class/ClassLevelModel");
const ClassLevelSection = require("../../models/academics/class/ClassLevelSectionModel");
const House = require("../../models/academics/house/HouseModel");
const ProgramDivision = require("../../models/academics/programmes/divisions/ProgramDivisionModel");
const Program = require("../../models/academics/programmes/ProgramsModel");
const OldStudents = require("../../models/graduates/OldStudentsModel");
const PlacementStudent = require("../../models/PlacementStudent/PlacementStudentModel");
const User = require("../../models/user/UserModel");
const { cloudinary } = require("../cloudinary/cloudinary");

// For New Students Enrollment
async function validateStudentPlacementData(req, res, next) {
  const newStudentData = req.body;

  try {
    // Find placement student✅
    const placementStudentFound = await PlacementStudent.findOne({
      jhsIndexNo: newStudentData?.jhsIndexNo,
    });

    // Validate placement student data
    if (!placementStudentFound) {
      res.status(404).json({
        errorMessage: {
          message: [`Placement data not found!`],
        },
      });
      return;
    }
    // Validate student's JHS completion year
    if (placementStudentFound?.yearGraduated !== newStudentData?.completedJhs) {
      res.status(400).json({
        errorMessage: {
          message: [`Please provide the right year of completion!`],
        },
      });
      return;
    }
    // Validate student's JHS attended
    if (placementStudentFound?.jhsAttended !== newStudentData?.jhsAttended) {
      res.status(400).json({
        errorMessage: {
          message: [`Please provide the right JHS attended!`],
        },
      });
      return;
    }
    // Validate student's gender
    if (placementStudentFound?.gender !== newStudentData?.gender) {
      res.status(400).json({
        errorMessage: {
          message: [
            `Gender status selected does not match the one on your placement data!`,
          ],
        },
      });
      return;
    }
    // Validate student's selected residentialStatus
    if (
      placementStudentFound?.boardingStatus !==
      newStudentData?.residentialStatus
    ) {
      res.status(400).json({
        errorMessage: {
          message: [
            `Residential status selected does not match your boarding status!`,
          ],
        },
      });
      return;
    }
    // Validate student's date of birth
    // Convert both placement dates (from frontend data & backend) to string before validating
    const placementDOB = placementStudentFound?.dateOfBirth
      .toISOString()
      .split("T")[0];
    const inputDOB = new Date(newStudentData?.dateOfBirth)
      .toISOString()
      .split("T")[0];

    if (placementDOB && inputDOB && inputDOB !== placementDOB) {
      res.status(400).json({
        errorMessage: {
          message: [
            `Date of birth does not match the one on your placement data!`,
          ],
        },
      });
      return;
    }
    // Validate student's contact
    if (placementStudentFound?.smsContact !== newStudentData?.mobile) {
      res.status(400).json({
        errorMessage: {
          message: [
            `Contact number does not match the one on your placement data!`,
          ],
        },
      });
      return;
    }
    // Validate student's name
    if (
      placementStudentFound?.firstName !== newStudentData?.firstName ||
      placementStudentFound?.lastName !== newStudentData?.lastName
    ) {
      res.status(400).json({
        errorMessage: {
          message: [`It looks like some name credentials are incorrect!`],
        },
      });
      return;
    }
    if (!placementStudentFound?.placementVerified) {
      res.status(400).json({
        errorMessage: {
          message: [`Your placement is not yet verified!`],
        },
      });
      return;
    }
    req.placementStudent = placementStudentFound;
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({
      errorMessage: {
        message: ["Internal Server Error!"],
      },
    });
  }
}
async function studentProgramme(req, res, next) {
  const newStudentData = req.body;
  const placementStudentFound = req.placementStudent;

  try {
    //Find student's Program✅
    const mainProgramFound = await Program.findOne({
      _id: newStudentData?.program,
    }).populate([{ path: "electiveSubjects" }]);
    //Find student's Division Program✅
    const studentDivisionProgramFound = await ProgramDivision.findOne({
      _id: newStudentData?.program,
    }).populate([{ path: "electiveSubjects" }]);

    if (studentDivisionProgramFound) {
      // Find linked program
      const linkedProgramFound = await Program.findOne({
        _id: studentDivisionProgramFound?.programId,
      });
      // Validate student's selected program✅
      if (
        placementStudentFound &&
        placementStudentFound?.programme !== linkedProgramFound?.name
      ) {
        res.status(400).json({
          errorMessage: {
            message: [
              `Programme selected does not match your placement programme!`,
            ],
          },
        });
        return;
      }
      const filteredOptionalSubjects =
        studentDivisionProgramFound?.electiveSubjects?.filter(
          (subj) =>
            subj?.subjectInfo?.isElectiveSubject &&
            subj?.subjectInfo?.isOptional
        );
      if (
        filteredOptionalSubjects?.length > 0 &&
        !newStudentData?.optionalElectiveSubject
      ) {
        res.status(404).json({
          errorMessage: {
            message: [`Selection of one optional elective subject required!`],
          },
        });
        return;
      }
      req.program = {
        studentDivisionProgramFound,
        // coreSubjects,
        isDivisionProgram: true,
      };
      next();
    } else if (mainProgramFound) {
      // Validate student's selected program✅
      if (
        placementStudentFound &&
        placementStudentFound?.programme !== mainProgramFound?.name
      ) {
        res.status(400).json({
          errorMessage: {
            message: [
              `Programme selected does not match your placement programme!`,
            ],
          },
        });
        return;
      }
      const filteredOptionalSubjects =
        mainProgramFound?.electiveSubjects?.filter(
          (subj) =>
            subj?.subjectInfo?.isElectiveSubject &&
            subj?.subjectInfo?.isOptional
        );
      if (
        filteredOptionalSubjects?.length > 0 &&
        !newStudentData?.optionalElectiveSubject
      ) {
        res.status(404).json({
          errorMessage: {
            message: [`Selection of one optional elective subject required!`],
          },
        });
        return;
      }
      req.program = {
        mainProgramFound,
        isDivisionProgram: false,
      };
      next();
    } else {
      res.status(404).json({
        errorMessage: {
          message: ["No programme data found!"],
        },
      });
      return;
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      errorMessage: {
        message: ["Internal Server Error!"],
      },
    });
  }
}
async function studentClass(req, res, next) {
  const newStudentData = req.body;
  const program = req.program;
  try {
    // find student's class level
    const studentClassLevel = await ClassLevel.findOne({
      _id: newStudentData?.currentClassLevel,
    });
    if (!studentClassLevel) {
      res.status(404).json({
        errorMessage: {
          message: [`Student's Class Level Not Found!`],
        },
      });
      return;
    }
    let classSectionFound;
    if (program?.isDivisionProgram) {
      // find student's class level section✅
      classSectionFound = await ClassLevelSection.findOne({
        classLevelId: newStudentData?.currentClassLevel,
        // program:newStudentData?.program,
        divisionProgram: program?.studentDivisionProgramFound?._id,
      });
      req.studentClassInfo = { studentClassLevel, classSectionFound };
      next();
    } else if (!program?.isDivisionProgram) {
      // find student's class level section✅
      classSectionFound = await ClassLevelSection.findOne({
        classLevelId: newStudentData?.currentClassLevel,
        program: program?.mainProgramFound?._id,
      });
      req.studentClassInfo = { studentClassLevel, classSectionFound };
      next();
    } else {
      res.status(404).json({
        errorMessage: {
          message: [`Student's class section not found!`],
        },
      });
      return;
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      errorMessage: {
        message: ["Internal Server Error!"],
      },
    });
  }
}
const selectStudentHouse = async (foundStudent) => {
  //Find a house for student who wants to enroll
  const allHouses = await House.find({ isFull: false });
  if (allHouses && !foundStudent?.studentSchoolData?.house) {
    let selectedHouse = Math.floor(Math.random() * allHouses?.length);
    // console.log(allHouses[selectedHouse]?._id);
    const houseFound = await House.findOne({
      _id: allHouses[selectedHouse]?._id,
    });
    if (
      foundStudent &&
      houseFound &&
      !houseFound?.students?.includes(foundStudent?._id)
    ) {
      houseFound.students.push(foundStudent?._id);
      await houseFound.save();
    }
    if (foundStudent && houseFound) {
      await User.findOneAndUpdate(
        foundStudent?._id,
        {
          "studentSchoolData.house": houseFound?._id,
        },
        { new: true }
      );
    }
    if (
      houseFound &&
      houseFound?.students?.length === 30 &&
      houseFound.isFull === false
    ) {
      houseFound.isFull = true;
      await houseFound.save();
    }
  }
  return foundStudent;
};
// For Enrollment Approvals
async function updateApprovedStudentData(req, res, next) {
  const currentUser = req.user;
  const { studentId } = req.params;
  const { enrollmentApprovedBy } = req.body;

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
    if (currentUser?.id !== enrollmentApprovedBy) {
      res.status(403).json({
        errorMessage: {
          message: ["Operation Denied! You're not an admin!"],
        },
      });
      return;
    }
    //Find student
    const studentFound = await User.findOne({ uniqueId: studentId });
    // console.log(studentFound, "L-240");
    if (studentFound?.studentStatusExtend?.enrollmentStatus === "approved") {
      res.status(400).json({
        errorMessage: {
          message: ["Enrollment already approved!"],
        },
      });
      return;
    }
    // Push classLevel into students classLevels array ✅
    if (
      !studentFound?.studentSchoolData?.classLevels?.includes(
        studentFound?.studentSchoolData?.currentClassLevel
      )
    ) {
      studentFound.studentSchoolData.classLevels.push(
        studentFound?.studentSchoolData?.currentClassLevel
      );
      await studentFound.save();
    }
    // push current academic year into students academic years array ✅
    if (
      !studentFound?.studentSchoolData?.academicYears?.includes(
        studentFound?.studentSchoolData?.currentAcademicYear
      )
    ) {
      studentFound.studentSchoolData.academicYears.push(
        studentFound?.studentSchoolData?.currentAcademicYear
      );
      await studentFound.save();
    }
    req.enrollmentApprovalData = { studentFound, adminFound };
    next();
  } catch (error) {
    res.status(500).json({
      errorMessage: {
        message: [`Internal Server Error!`],
      },
    });
    return;
  }
}
async function updateMultiApprovedStudentData(req, res, next) {
  const currentUser = req.user;
  const { students, enrollmentApprovedBy } = req.body;

  try {
    //Check if students data is greater than 0
    if (!students || students?.length === 0) {
      return res.status(404).json({
        errorMessage: {
          message: [`No student data selected!`],
        },
      });
    }
    //Find Admin
    const adminFound = await User.findOne({ _id: currentUser?.id });
    if (!adminFound || !currentUser?.roles?.includes("Admin")) {
      return res.status(403).json({
        errorMessage: {
          message: ["Operation denied! You're not an admin!"],
        },
      });
    }
    if (currentUser?.id !== enrollmentApprovedBy) {
      return res.status(403).json({
        errorMessage: {
          message: ["Operation denied! You're not an admin!"],
        },
      });
    }
    req.multiEnrollmentApprovalData = { students, adminFound };
    next();
    // });
  } catch (error) {
    res.status(500).json({
      errorMessage: {
        message: [`Internal Server Error!`],
      },
    });
    return;
  }
}
// For Students Promotions
async function validatePromotionData(req, res, next) {
  const { studentId } = req.params;
  const { students, lastPromotedBy } = req.body;
  const authAdmin = req.user;
  try {
    //Find admin taking action
    const adminFound = await User.findOne({ _id: lastPromotedBy });
    // Validate admin's ID
    if (!adminFound) {
      res.status(404).json({
        errorMessage: {
          message: ["Operation denied! You're not an authorized admin"],
        },
      });
      return;
    }
    if (authAdmin && authAdmin?.id !== lastPromotedBy) {
      res.status(404).json({
        errorMessage: {
          message: ["Operation denied! You're not an authorized admin"],
        },
      });
      return;
    }
    //Find student to be promoted
    const studentFound = await User.findOne({ uniqueId: studentId }).populate([
      { path: "studentSchoolData.currentClassLevel" },
    ]);
    if (studentFound) {
      if (
        studentFound?.studentSchoolData?.currentClassLevel?.name === "Level 100"
      ) {
        req.promotionData = { studentFound, level100Student: true, adminFound };
        next();
      }
      if (
        studentFound?.studentSchoolData?.currentClassLevel?.name === "Level 200"
      ) {
        req.promotionData = { studentFound, level200Student: true, adminFound };
        next();
      }
      if (
        studentFound?.studentSchoolData?.currentClassLevel?.name === "Level 300"
      ) {
        req.promotionData = { studentFound, level300Student: true, adminFound };
        next();
      }
    } else {
      res.status(404).json({
        errorMessage: {
          message: ["Student data not found!"],
        },
      });
      return;
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
async function level100Promotion(req, res, next) {
  const { studentFound, level100Student, adminFound } = req.promotionData;
  try {
    if (level100Student) {
      //Find Student Current Class Level
      const studentCurrentClassLevel = await ClassLevel.findOne({
        _id: studentFound?.studentSchoolData?.currentClassLevel?._id,
      });
      if (!studentCurrentClassLevel) {
        res.status(404).json({
          errorMessage: {
            message: ["Student's current class level data not found!"],
          },
        });
        return;
      }
      //Find Student Next Class Level
      const studentNextClassLevel = await ClassLevel.findOne({
        name: "Level 200",
      });
      if (!studentNextClassLevel) {
        res.status(404).json({
          errorMessage: {
            message: ["Student's next class level data not found!"],
          },
        });
        return;
      }
      // Extract student's programme ID
      const programId =
        studentFound?.studentSchoolData?.program?.programId instanceof
        mongoose.Types.ObjectId
          ? studentFound.studentSchoolData.program.programId
          : new mongoose.Types.ObjectId(
              studentFound?.studentSchoolData?.program?.programId?.toString()
            );
      let studentNextClassSection;
      //Find Student Next Class Section
      if (
        studentFound?.studentSchoolData?.program?.type === "ProgramDivision"
      ) {
        studentNextClassSection = await ClassLevelSection.findOne({
          classLevelName: "Level 200",
          divisionProgram: programId,
        });
      } else {
        studentNextClassSection = await ClassLevelSection.findOne({
          classLevelName: "Level 200",
          program: programId,
        });
      }
      if (!studentNextClassSection) {
        res.status(404).json({
          errorMessage: {
            message: ["Student's next class section data not found!"],
          },
        });
        return;
      }
      // Find student's next class teacher✅
      const level200TeacherFound = await User.findOne({
        _id: studentNextClassSection?.currentTeacher,
      });
      //Update student's currentClassLevel✅
      //update his/her current classLevelSection✅
      //Update student's next class-level-section teacher✅
      //Update Student's Promotion Status Data✅
      const promotedStudent = await User.findOneAndUpdate(
        studentFound?._id,
        {
          "studentSchoolData.currentClassLevel": studentNextClassLevel?._id,
          "studentSchoolData.currentClassLevelSection":
            studentNextClassSection?._id,
          "studentSchoolData.currentClassTeacher":
            level200TeacherFound?._id || null,
          "studentStatusExtend.isPromoted": true,
          "studentStatusExtend.isPromotedToLevel200": true,
          "studentStatusExtend.lastPromotedBy": adminFound?._id,
          "studentStatusExtend.promotionDate": new Date().toISOString(),
        },
        { new: true }
      );
      // Push student's current class-level into his/her classLevels array
      if (
        !studentFound?.studentSchoolData?.classLevels?.includes(
          studentNextClassLevel?._id
        )
      ) {
        studentFound.studentSchoolData.classLevels.push(
          studentNextClassLevel?._id
        );
        await studentFound.save();
      }
      // Push new lecturer into student's classTeachers array
      if (
        level200TeacherFound &&
        !studentFound?.studentSchoolData?.classTeachers?.includes(
          level200TeacherFound?._id
        )
      ) {
        studentFound.studentSchoolData.classTeachers.push(
          level200TeacherFound?._id
        );
        await studentFound.save();
      }
      req.promotedStudent = promotedStudent;
      next();
    } else {
      next();
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      errorMessage: {
        message: [error?.message],
      },
    });
  }
}
async function level200Promotion(req, res, next) {
  const { studentFound, level200Student, adminFound } = req.promotionData;
  try {
    if (level200Student) {
      //Find Student Current Class Level
      const studentCurrentClassLevel = await ClassLevel.findOne({
        _id: studentFound?.studentSchoolData?.currentClassLevel?._id,
      });
      if (!studentCurrentClassLevel) {
        res.status(404).json({
          errorMessage: {
            message: ["Student's current class level data not found!"],
          },
        });
        return;
      }
      //Find Student Next Class Level
      const studentNextClassLevel = await ClassLevel.findOne({
        name: "Level 300",
      });
      if (!studentNextClassLevel) {
        res.status(404).json({
          errorMessage: {
            message: ["Student's next class level data not found!"],
          },
        });
        return;
      }
      // Extract student's programme ID
      const programId =
        studentFound?.studentSchoolData?.program?.programId instanceof
        mongoose.Types.ObjectId
          ? studentFound.studentSchoolData.program.programId
          : new mongoose.Types.ObjectId(
              studentFound?.studentSchoolData?.program?.programId?.toString()
            );
      let studentNextClassSection;
      //Find Student Next Class Section
      if (
        studentFound?.studentSchoolData?.program?.type === "ProgramDivision"
      ) {
        studentNextClassSection = await ClassLevelSection.findOne({
          classLevelName: "Level 300",
          divisionProgram: programId,
        });
      } else {
        studentNextClassSection = await ClassLevelSection.findOne({
          classLevelName: "Level 300",
          program: programId,
        });
      }
      // if (!studentNextClassSection) {
      //   res.status(404).json({
      //     errorMessage: {
      //       message: ["Student's next class section data not found!"],
      //     },
      //   });
      //   return;
      // }
      // Find student's next class teacher✅
      const level300TeacherFound = await User.findOne({
        _id: studentNextClassSection?.currentTeacher,
      });
      //Update student's currentClassLevel✅
      //update his/her current classLevelSection✅
      //Update student's next class-level-section teacher✅
      //Update Student's Promotion Status Data✅
      const promotedStudent = await User.findOneAndUpdate(
        studentFound?._id,
        {
          "studentSchoolData.currentClassLevel": studentNextClassLevel?._id,
          "studentSchoolData.currentClassLevelSection":
            studentNextClassSection?._id,
          "studentSchoolData.currentClassTeacher":
            level300TeacherFound?._id || null,
          "studentStatusExtend.isPromoted": true,
          "studentStatusExtend.isPromotedToLevel300": true,
          "studentStatusExtend.lastPromotedBy": adminFound?._id,
          "studentStatusExtend.promotionDate": new Date().toISOString(),
        },
        { new: true }
      );
      // Push student's current class-level into his/her classLevels array
      if (
        !studentFound?.studentSchoolData?.classLevels?.includes(
          studentNextClassLevel?._id
        )
      ) {
        studentFound.studentSchoolData.classLevels.push(
          studentNextClassLevel?._id
        );
        await studentFound.save();
      }
      // Push new lecturer into student's classTeachers array
      if (
        level300TeacherFound &&
        !studentFound?.studentSchoolData?.classTeachers?.includes(
          level300TeacherFound?._id
        )
      ) {
        studentFound.studentSchoolData.classTeachers.push(
          level300TeacherFound?._id
        );
        await studentFound.save();
      }
      req.promotedStudent = promotedStudent;
      next();
    } else {
      next();
    }
  } catch (error) {
    return res.status(500).json({
      errorMessage: {
        message: [error?.message],
      },
    });
  }
}
async function level300Promotion(req, res, next) {
  const { studentFound, level300Student, adminFound } = req.promotionData;
  try {
    if (level300Student) {
      const getCurrentYear = new Date().getFullYear();
      //Find Student's House
      const studentHouse = await House.findOne({
        _id: studentFound?.studentSchoolData?.house,
      });
      // Find student placement Data
      const studentPlacementData = await PlacementStudent.findOne({
        enrollmentId: studentFound?.uniqueId,
      });

      //Find Student batch
      let oldStudentsBatchFound;
      if (getCurrentYear) {
        const batchFound = await OldStudents.findOne({
          yearOfGraduation: getCurrentYear,
        });
        if (batchFound) {
          oldStudentsBatchFound = batchFound;
        } else {
          oldStudentsBatchFound = await OldStudents.create({
            yearOfGraduation: getCurrentYear,
            isAutoCreated: true,
          });
        }
      }
      //Update student's currentClassLevel to null✅
      //update his/her current classLevelSection to null✅
      //update his/her currentAcademicYear state to null✅
      //Update student's class teacher to null✅
      //Update Student's Promotion Status Data✅
      const graduatedStudent = await User.findOneAndUpdate(
        studentFound?._id,
        {
          "studentSchoolData.currentClassLevel": null,
          "studentSchoolData.currentClassLevelSection": null,
          "studentSchoolData.currentAcademicYear": null,
          "studentSchoolData.currentClassTeacher": null,
          "studentStatusExtend.isGraduated": true,
          "studentStatusExtend.enrollmentStatus": "graduated",
          "studentStatusExtend.yearGraduated": new Date().getFullYear(),
          "studentStatusExtend.isStudent": false,
          "studentStatusExtend.graduatedBy": adminFound?._id,
          "studentStatusExtend.dateGraduated": new Date().toISOString(),
        },
        { new: true }
      );
      // Remove Student from house
      if (studentHouse?.students?.includes(studentFound?._id)) {
        studentHouse.students.pull(studentFound?._id);
        await studentHouse.save();
      }
      // Update Student's isGraduated to true
      if (studentPlacementData) {
        studentPlacementData.isGraduated = true;
        await studentPlacementData.save();
      }
      // Add Student to his year group sensosa
      if (
        oldStudentsBatchFound &&
        !oldStudentsBatchFound?.students?.includes(studentFound?._id)
      ) {
        oldStudentsBatchFound.students.push(studentFound?._id);
        await oldStudentsBatchFound.save();
      }
      req.promotedStudent = graduatedStudent;
      next();
    } else {
      next();
    }
  } catch (error) {
    return res.status(500).json({
      errorMessage: {
        message: [error?.message],
      },
    });
  }
}
async function validateMultiStudentsPromotionData(req, res, next) {
  const { students, classLevel, lastPromotedBy } = req.body;
  const authAdmin = req.user;
  try {
    //Check if students data is greater than 0
    if (!students || students?.length === 0) {
      res.status(404).json({
        errorMessage: {
          message: [`No student data selected!`],
        },
      });
      return;
    }
    //Find admin taking action
    const adminFound = await User.findOne({ _id: lastPromotedBy });
    // Validate admin's ID
    if (!adminFound) {
      res.status(404).json({
        errorMessage: {
          message: ["Operation denied! You're not an authorized admin"],
        },
      });
      return;
    }
    if (authAdmin && authAdmin?.id !== lastPromotedBy) {
      res.status(404).json({
        errorMessage: {
          message: ["Operation denied! You're not an authorized admin"],
        },
      });
      return;
    }
    if (classLevel) {
      if (classLevel === "Level 100") {
        req.promotionData = { students, isLevel100Students: true, adminFound };
        next();
      }
      if (classLevel === "Level 200") {
        req.promotionData = { students, isLevel200Students: true, adminFound };
        next();
      }
      if (classLevel === "Level 300") {
        req.promotionData = { students, isLevel300Students: true, adminFound };
        next();
      }
    } else {
      res.status(404).json({
        errorMessage: {
          message: ["No class-level specified!"],
        },
      });
      return;
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
async function level100MultiStudentsPromotion(req, res, next) {
  const { students, isLevel100Students, adminFound } = req.promotionData;
  try {
    if (isLevel100Students) {
      //Find Students Next Class Level
      const studentNextClassLevel = await ClassLevel.findOne({
        name: "Level 200",
      });
      if (!studentNextClassLevel) {
        res.status(404).json({
          errorMessage: {
            message: ["Student's next class level data not found!"],
          },
        });
        return;
      }
      for (const student of students) {
        // Find Student
        const studentFound = await User.findOne({
          uniqueId: student?.uniqueId,
        });
        // Extract student's programme ID
        const programId =
          student?.studentSchoolData?.program?.programId instanceof
          mongoose.Types.ObjectId
            ? studentFound.studentSchoolData.program.programId
            : new mongoose.Types.ObjectId(
                studentFound?.studentSchoolData?.program?.programId?.toString()
              );
        //Find Student Next Class Section
        let studentNextClassSection;
        //Find Student Next Class Section
        if (
          studentFound?.studentSchoolData?.program?.type === "ProgramDivision"
        ) {
          studentNextClassSection = await ClassLevelSection.findOne({
            classLevelName: "Level 200",
            divisionProgram: programId,
          });
        } else {
          studentNextClassSection = await ClassLevelSection.findOne({
            classLevelName: "Level 200",
            program: programId,
          });
        }
        // if (!studentNextClassSection) {
        //   res.status(404).json({
        //     errorMessage: {
        //       message: ["Student's next class section data not found!"],
        //     },
        //   });
        //   return;
        // }
        // Find student's next class teacher✅
        const level200TeacherFound = await User.findOne({
          _id: studentNextClassSection?.currentTeacher,
        });
        //Update student's currentClassLevel✅
        //update his/her current classLevelSection✅
        //Update student's next class-level-section teacher✅
        //Update Student's Promotion Status Data✅
        await User.findOneAndUpdate(
          studentFound?._id,
          {
            "studentSchoolData.currentClassLevel": studentNextClassLevel?._id,
            "studentSchoolData.currentClassLevelSection":
              studentNextClassSection?._id,
            "studentSchoolData.currentClassTeacher":
              level200TeacherFound?._id || null,
            "studentStatusExtend.isPromoted": true,
            "studentStatusExtend.isPromotedToLevel200": true,
            "studentStatusExtend.lastPromotedBy": adminFound?._id,
            "studentStatusExtend.promotionDate": new Date().toISOString(),
          },
          { new: true }
        );
        // Push student's current class-level into his/her classLevels array
        if (
          !studentFound?.studentSchoolData?.classLevels?.includes(
            studentNextClassLevel?._id
          )
        ) {
          studentFound.studentSchoolData.classLevels.push(
            studentNextClassLevel?._id
          );
          await studentFound.save();
        }
        // Push new lecturer into student's classTeachers array
        if (
          level200TeacherFound &&
          !studentFound?.studentSchoolData?.classTeachers?.includes(
            level200TeacherFound?._id
          )
        ) {
          studentFound.studentSchoolData.classTeachers.push(
            level200TeacherFound?._id
          );
          await studentFound.save();
        }
      }
      // students.forEach(async (student) => {});
      req.promotedStudents = students;
      next();
    } else {
      next();
    }
  } catch (error) {
    return res.status(500).json({
      errorMessage: {
        message: [error?.message],
      },
    });
  }
}
async function level200MultiStudentsPromotion(req, res, next) {
  const { students, isLevel200Students, adminFound } = req.promotionData;
  try {
    if (isLevel200Students) {
      //Find Students Next Class Level
      const studentNextClassLevel = await ClassLevel.findOne({
        name: "Level 300",
      });
      if (!studentNextClassLevel) {
        res.status(404).json({
          errorMessage: {
            message: ["Student's next class level data not found!"],
          },
        });
        return;
      }
      for (const student of students) {
        // Find Student
        const studentFound = await User.findOne({
          uniqueId: student?.uniqueId,
        });
        // Extract student's programme ID
        const programId =
          student?.studentSchoolData?.program?.programId instanceof
          mongoose.Types.ObjectId
            ? studentFound.studentSchoolData.program.programId
            : new mongoose.Types.ObjectId(
                studentFound?.studentSchoolData?.program?.programId?.toString()
              );
        let studentNextClassSection;
        //Find Student Next Class Section
        if (
          studentFound?.studentSchoolData?.program?.type === "ProgramDivision"
        ) {
          studentNextClassSection = await ClassLevelSection.findOne({
            classLevelName: "Level 300",
            divisionProgram: programId,
          });
        } else {
          studentNextClassSection = await ClassLevelSection.findOne({
            classLevelName: "Level 300",
            program: programId,
          });
        }
        // if (!studentNextClassSection) {
        //   res.status(404).json({
        //     errorMessage: {
        //       message: ["Student's next class section data not found!"],
        //     },
        //   });
        //   return;
        // }
        // Find student's next class teacher✅
        const level300TeacherFound = await User.findOne({
          _id: studentNextClassSection?.currentTeacher,
        });
        //Update student's currentClassLevel✅
        //update his/her current classLevelSection✅
        //Update student's next class-level-section teacher✅
        //Update Student's Promotion Status Data✅
        await User.findOneAndUpdate(
          studentFound?._id,
          {
            "studentSchoolData.currentClassLevel": studentNextClassLevel?._id,
            "studentSchoolData.currentClassLevelSection":
              studentNextClassSection?._id,
            "studentSchoolData.currentClassTeacher":
              level300TeacherFound?._id || null,
            "studentStatusExtend.isPromoted": true,
            "studentStatusExtend.isPromotedToLevel300": true,
            "studentStatusExtend.lastPromotedBy": adminFound?._id,
            "studentStatusExtend.promotionDate": new Date().toISOString(),
          },
          { new: true }
        );
        // Push student's current class-level into his/her classLevels array
        if (
          !studentFound?.studentSchoolData?.classLevels?.includes(
            studentNextClassLevel?._id
          )
        ) {
          studentFound.studentSchoolData.classLevels.push(
            studentNextClassLevel?._id
          );
          await studentFound.save();
        }
        // Push new lecturer into student's classTeachers array
        if (
          level300TeacherFound &&
          !studentFound?.studentSchoolData?.classTeachers?.includes(
            level300TeacherFound?._id
          )
        ) {
          studentFound.studentSchoolData.classTeachers.push(
            level300TeacherFound?._id
          );
          await studentFound.save();
        }
      }
      req.promotedStudents = students;
      next();
    } else {
      next();
    }
  } catch (error) {
    return res.status(500).json({
      errorMessage: {
        message: [error?.message],
      },
    });
  }
}
async function level300MultiStudentsPromotion(req, res, next) {
  const { students, isLevel300Students, adminFound } = req.promotionData;
  const getCurrentYear = new Date().getFullYear();
  try {
    //Find Student batch
    let oldStudentsBatchFound;
    if (getCurrentYear) {
      const batchFound = await OldStudents.findOne({
        yearOfGraduation: getCurrentYear,
      });
      if (batchFound) {
        oldStudentsBatchFound = batchFound;
      } else {
        oldStudentsBatchFound = await OldStudents.create({
          yearOfGraduation: getCurrentYear,
        });
      }
    }
    if (isLevel300Students) {
      for (const student of students) {
        // Find Student
        const studentFound = await User.findOne({
          uniqueId: student?.uniqueId,
        });
        //Find Student's House
        const studentHouse = await House.findOne({
          _id: studentFound?.studentSchoolData?.house,
        });
        const studentPlacementData = await PlacementStudent.findOne({
          enrollmentCode: studentFound?.studentSchoolData?.enrollmentCode,
        });
        //Update student's currentClassLevel to null✅
        //update his/her current classLevelSection to null✅
        //update his/her currentAcademicYear state to null✅
        //Update student's class teacher to null✅
        //Update Student's Promotion Status Data✅
        await User.findOneAndUpdate(
          studentFound?._id,
          {
            "studentSchoolData.currentClassLevel": null,
            "studentSchoolData.currentClassLevelSection": null,
            "studentSchoolData.currentAcademicYear": null,
            "studentSchoolData.currentClassTeacher": null,
            "studentStatusExtend.isGraduated": true,
            "studentStatusExtend.enrollmentStatus": "graduated",
            "studentStatusExtend.yearGraduated": new Date().getFullYear(),
            "studentStatusExtend.isStudent": false,
            "studentStatusExtend.graduatedBy": adminFound?._id,
            "studentStatusExtend.dateGraduated": new Date().toISOString(),
          },
          { new: true }
        );
        // Remove Student from house
        if (studentHouse?.students?.includes(studentFound?._id)) {
          studentHouse.students.pull(studentFound?._id);
          await studentHouse.save();
        }
        // Update Student's isGraduated to true
        if (studentPlacementData) {
          studentPlacementData.isGraduated = true;
          await studentPlacementData.save();
        }
        // Add Student to his year group sensosa
        if (
          oldStudentsBatchFound &&
          !oldStudentsBatchFound?.students?.includes(studentFound?._id)
        ) {
          oldStudentsBatchFound.students.push(studentFound?._id);
          await oldStudentsBatchFound.save();
        }
      }
      req.promotedStudents = students;
      next();
    } else {
      next();
    }
  } catch (error) {
    return res.status(500).json({
      errorMessage: {
        message: [error?.message],
      },
    });
  }
}

module.exports = {
  validateStudentPlacementData,
  studentProgramme,
  studentClass,
  selectStudentHouse,
  updateApprovedStudentData,
  updateMultiApprovedStudentData,
  validatePromotionData,
  level100Promotion,
  level200Promotion,
  level300Promotion,
  validateMultiStudentsPromotionData,
  level100MultiStudentsPromotion,
  level200MultiStudentsPromotion,
  level300MultiStudentsPromotion,
};
