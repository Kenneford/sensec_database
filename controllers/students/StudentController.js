const cloudinary = require("../../middlewares/cloudinary/cloudinary");
const PlacementStudent = require("../../models/PlacementStudent/PlacementStudentModel");
const User = require("../../models/user/UserModel");

module.exports.studentOnlineEnrolment = async (req, res) => {
  const { data } = req.body;
  console.log(data);

  const requiredFields =
    data?.newStudent?.firstName ||
    data?.newStudent?.lastName ||
    data?.newStudent?.gender ||
    data?.newStudent?.dateOfBirth ||
    data?.newStudent?.placeOfBirth ||
    data?.newStudent?.nationality;

  if (!requiredFields) {
    res.status(400).json({
      errorMessage: {
        message: [`Fill All Required Fields!`],
      },
    });
    return;
  }
  if (!data?.profilePicture) {
    res.status(400).json({
      errorMessage: {
        message: ["No image selected or image file not supported!"],
      },
    });
    return;
  }
  // Validate student's JHS completion year
  if (
    data?.placementStudent &&
    data?.placementStudent?.yearGraduated !== data?.newStudent?.completedJhs
  ) {
    res.status(400).json({
      errorMessage: {
        message: [`Please provide the right year of completion!`],
      },
    });
    return;
  }
  // Validate student's JHS attended
  if (
    data?.placementStudent &&
    data?.placementStudent?.jHSAttended !== data?.newStudent?.jhsAttended
  ) {
    res.status(400).json({
      errorMessage: {
        message: [`Please provide the right JHS attended!`],
      },
    });
    return;
  }
  // Validate student's selected program✅
  if (
    data?.placementStudent &&
    data?.placementStudent?.programme !== data?.newStudent?.programName
  ) {
    res.status(400).json({
      errorMessage: {
        message: [`Programme selected does not match your course programme!`],
      },
    });
    return;
  }
  // Validate student's selected residentialStatus
  if (
    data?.placementStudent &&
    data?.placementStudent?.boardingStatus !==
      data?.newStudent?.residentialStatus
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
  //Find student's Program✅
  const foundProgram = await Program.findOne({
    _id: data?.newStudent?.program,
  }).populate([{ path: "electiveSubjects" }]);
  if (!foundProgram) {
    res.status(404).json({
      errorMessage: {
        message: [`Student's Program Not Found!`],
      },
    });
    return;
  }

  //find core subjects
  const coreSubjects = await Subject?.find({
    classLevel: data?.newStudent?.currentClassLevel,
    "coreSubInfo.isCoreSubject": true,
  });

  //Find student's optional elective subject
  const optionalElectiveSubjectsFound = await Subject?.find({
    "electiveSubInfo.programId": foundProgram?._id,
    "electiveSubInfo.isOptional": true,
  });

  //Find general elective subjects for student
  const electiveSubjectsFound = await Subject?.find({
    "electiveSubInfo.programId": foundProgram?._id,
    "electiveSubInfo.isOptional": false,
    classLevel: data?.newStudent?.currentClassLevel,
  });

  if (
    optionalElectiveSubjectsFound?.length > 1 &&
    !data?.newStudent?.optionalElectiveSubject
  ) {
    res.status(404).json({
      errorMessage: {
        message: [`Selection Of One Optional Elective Subject Required!`],
      },
    });
    return;
  }
  // find student's class level
  const studentClassLevel = await ClassLevel.findOne({
    _id: data?.newStudent?.currentClassLevel,
  });
  if (!studentClassLevel) {
    res.status(404).json({
      errorMessage: {
        message: [`Student's Class Level Not Found!`],
      },
    });
    return;
  }

  // find student's class level section✅
  const placementStudentFound = await PlacementStudent.findOne({
    generatedIndexNumber: data?.placementStudent?.generatedIndexNumber,
  });

  // find student's class level section✅
  const studentClassLevelSectionFound = await ClassLevelSection.findOne({
    classLevelId: data?.newStudent?.currentClassLevel,
    program: data?.newStudent?.program,
  });
  //Find Student's class teacher
  const studentClassTeacherFound = await User.findOne({
    "teacherSchoolData.classLevelHandling": studentClassLevelSectionFound?._id,
  });
  if (!studentClassLevelSectionFound) {
    return res.status(404).json({
      errorMessage: {
        message: [`No Class Found For Student!`],
      },
    });
  }
  await cloudinary.uploader.upload(
    data?.profilePicture,
    {
      folder: "Students",
    },
    async (err, result) => {
      if (err) {
        res.status(400).json({
          errorMessage: {
            message: ["No image file selected or image file not supported!"],
          },
        });
      } else {
        //Create new student personal Info data
        const newStudentData = await User.create({
          uniqueId: data?.uniqueId,
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
          "studentSchoolData.jhsIndexNumber": data?.newStudent?.jhsIndexNumber,
          "studentSchoolData.program": data?.newStudent?.program,
          "studentSchoolData.currentClassLevel":
            data?.newStudent?.currentClassLevel,
          "studentSchoolData.currentAcademicYear":
            data?.newStudent?.currentAcademicYear,
          "studentSchoolData.batch": data?.newStudent?.batch,
          "studentSchoolData.currentClassLevelSection":
            studentClassLevelSectionFound?._id,
          "studentSchoolData.classTeacher": studentClassTeacherFound?._id,

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

        try {
          // addStudentElectiveSubjects(newStudentData, electiveSubjectsFound);
          // addStudentCoreSubjects(newStudentData, coreSubjects);

          //Push optionalElectiveSubject into student's electiveSubjects array
          if (
            newStudentData &&
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
              { new: true, upsert: true }
            );
          }

          //Push teacher into student's teachers array
          if (
            newStudentData &&
            !newStudentData?.studentSchoolData?.classTeachers?.includes(
              studentClassTeacherFound?._id
            )
          ) {
            await User.findOneAndUpdate(
              newStudentData?._id,
              {
                $push: {
                  "studentSchoolData.classTeachers":
                    studentClassTeacherFound?._id,
                },
              },
              { new: true, upsert: true }
            );
          }
          //push student into class level pending students✅
          if (
            studentClassLevel &&
            !studentClassLevel?.pendingStudents?.includes(newStudentData?._id)
          ) {
            studentClassLevel.pendingStudents.push(newStudentData?._id);
            await studentClassLevel.save();
          }
          //push student into class level pending students✅
          if (placementStudentFound) {
            placementStudentFound.enrollmentId = newStudentData?.uniqueId;
            await placementStudentFound.save();
          }
          //Send application E-mail to old student
          // if (
          //   sensosaApplicantInfo &&
          //   sensosaApplicantInfo?.contactAddress?.email !== "" &&
          //   sensosaApplicantInfo?.role === "sensosa"
          // ) {
          //   sensosaApplicationEmailTemplate({
          //     userEmail: sensosaApplicantInfo?.contactAddress?.email,
          //     userInfo: sensosaApplicantInfo,
          //   });
          // }
        } catch (error) {
          console.log(error);
          return res.status(500).json({
            errorMessage: {
              message: ["Internal Server Error!"],
            },
          });
        }

        res.status(201).json({
          successMessage: "Your enrollment info saved successfully!",
          newStudentData,
        });
        console.log("Your enrollment info saved successfully!");
      }
    }
  );
};
