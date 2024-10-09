const { cloudinary } = require("../../middlewares/cloudinary/cloudinary");
const User = require("../../models/user/UserModel");

// Student online enrollment ✅
module.exports.studentOnlineEnrolment = async (req, res) => {
  const { data } = req.body;
  const placementStudent = req.placementStudent;
  const program = req.program;
  const studentClassInfo = req.studentClassInfo;
  try {
    // Check for student image upload file
    if (!data?.profilePicture) {
      res.status(400).json({
        errorMessage: {
          message: ["No image selected or image file not supported!"],
        },
      });
      return;
    }
    await cloudinary.uploader.upload(
      data?.profilePicture,
      {
        folder: "Students",
      },
      async (err, result) => {
        if (err) {
          return res.status(400).json({
            errorMessage: {
              message: ["Something went wrong!"],
            },
          });
        } else {
          //Create new student enrolment data
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
            "studentSchoolData.jhsIndexNumber":
              data?.newStudent?.jhsIndexNumber,
            "studentSchoolData.program": program?.mainProgramFound?._id,
            "studentSchoolData.divisionProgram":
              program?.studentDivisionProgramFound?._id,
            "studentSchoolData.currentClassLevel":
              data?.newStudent?.currentClassLevel,
            "studentSchoolData.currentAcademicYear":
              data?.newStudent?.currentAcademicYear,
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
          if (newStudentData && program) {
            // Add student's elective subjects
            if (program?.studentDivisionProgramFound) {
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
              if (
                !program?.studentDivisionProgramFound?.students?.includes(
                  newStudentData?._id
                )
              ) {
                program?.studentDivisionProgramFound?.students?.push(
                  newStudentData?._id
                );
                await program.studentDivisionProgramFound.save();
              }
              //push student into main programme's students✅
              if (
                !program?.mainProgramFound?.students?.includes(
                  newStudentData?._id
                )
              ) {
                program?.mainProgramFound?.students?.push(newStudentData?._id);
                await program.mainProgramFound.save();
              }
            } else if (program?.mainProgramFound) {
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
              if (
                !program?.mainProgramFound?.students?.includes(
                  newStudentData?._id
                )
              ) {
                program?.mainProgramFound?.students?.push(newStudentData?._id);
                await program.mainProgramFound.save();
              }
            }
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
              { new: true, upsert: true }
            );
          }
          //Push student's current teacher into student's teachers array
          if (
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
          //Update placement student's enrollmentId✅
          if (placementStudent) {
            placementStudent.enrollmentId = newStudentData?.uniqueId;
            await placementStudent.save();
          }

          res.status(201).json({
            successMessage: "Your enrollment info saved successfully!",
            newStudentData,
          });
          console.log("Your enrollment info saved successfully!");
        }
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
  const { studentId } = req.params;
  const { enrolmentApprovedBy } = req.body;
  const student = req?.enrollmentApprovalData?.studentFound;

  // //Find admin
  const admin = await User.findOne({ _id: enrolmentApprovedBy });
  if (!admin) {
    res.status(404).json({
      errorMessage: {
        message: [`Operation Failed! You're Not An Admin!`],
      },
    });
  } else {
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
          "studentStatusExtend.enrolmentApprovedBy": admin?._id,
          "studentStatusExtend.enrolmentApprovementDate":
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
      res.status(200).json({
        successMessage: "Student Approved Successfully!",
        studentApproved,
      });
      // if (
      //   studentApproved &&
      //   studentApproved?.studentStatusExtend?.enrollmentStatus === "approved"
      // ) {
      //   studentEnrollmentApprovalTemplate({
      //     userEmail: studentApproved?.contactAddress?.email,
      //     userInfo: studentApproved,
      //   });
      //   studentSMSEnrollmentApprovalTemplate({
      //     userInfo: studentApproved,
      //   });
      // }
    }
  }
};
