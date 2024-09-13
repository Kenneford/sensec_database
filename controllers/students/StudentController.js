const cloudinary = require("../../middlewares/cloudinary/cloudinary");
const PlacementStudent = require("../../models/PlacementStudent/PlacementStudentModel");
const User = require("../../models/user/UserModel");

module.exports.studentOnlineEnrolment = async (req, res) => {
  const data = req.body;
  console.log(data);
  if (!data?.indexNumber) {
    res.status(400).json({
      errorMessage: {
        message: [`Your JHS index number required!`],
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
  //Find Existing Student
  const existingStudent = await User.findOne({
    uniqueId: data?.uniqueId,
  });
  if (existingStudent) {
    res.status(400).json({
      errorMessage: {
        message: [`Student with ID-${uniqueId} Already Exist!`],
      },
    });
    return;
  }
  // find student's class level section✅
  const studentClassLevelSectionFound = await ClassLevelSection.findOne({
    classLevelId: data?.currentClassLevel,
    program,
  });
  //Find Student's class teacher
  const studentClassTeacherFound = await User.findOne({
    "teacherSchoolData.classLevelHandling": studentClassLevelSectionFound?._id,
  });
  //Find Placement Student
  const foundPlacementStudent = await PlacementStudent.findOne({
    jhsIndexNumber: data?.indexNumber,
  });
  if (!foundPlacementStudent) {
    return res.status(404).json({
      errorMessage: {
        message: ["Student's Index Number Not Found!"],
      },
    });
  } else {
    await cloudinary.uploader.upload(
      data?.profilePicture,
      {
        folder: "Students",
      },
      async (err, result) => {
        if (err) {
          // console.log(err);
          res.status(400).json({
            errorMessage: {
              message: ["No image file selected or image file not supported!"],
            },
          });
          return;
        }
        //Create new student personal Info data
        const newStudent = await User.create({
          uniqueId: data?.uniqueId,
          "personalInfo.firstName": data?.firstName,
          "personalInfo.lastName": data?.lastName,
          "personalInfo.otherName": data?.otherName,
          "personalInfo.dateOfBirth": data?.dateOfBirth,
          "personalInfo.placeOfBirth": data?.placeOfBirth,
          "personalInfo.nationality": data?.nationality,
          "personalInfo.gender": data?.gender,
          "personalInfo.fullName": `${data?.firstName} ${data?.otherName} ${data?.lastName}`,
          role: "student",
          "personalInfo.profilePicture": {
            public_id: result.public_id,
            url: result.secure_url,
          },
          "studentSchoolData.jhsAttended": data?.jhsAttended,
          "studentSchoolData.completedJhs": data?.completedJhs,
          "studentSchoolData.jhsIndexNumber": data?.jhsIndexNumber,
          "studentSchoolData.program": data?.program,
          "studentSchoolData.currentClassLevel": data?.currentClassLevel,
          "studentSchoolData.currentAcademicYear": data?.currentAcademicYear,
          "studentSchoolData.batch": data?.batch,
          "studentSchoolData.currentClassLevelSection":
            studentClassLevelSectionFound?._id,
          "studentSchoolData.classTeacher": studentClassTeacherFound?._id,
          "studentStatusExtend.enrollmentStatus": "pending",
        });
        try {
          if (newStudent && foundPlacementStudent) {
            foundPlacementStudent.enrollmentId = newStudent?.uniqueId;
            await foundPlacementStudent.save();
          }
          if (newStudent) {
            foundPlacementStudent.enrollmentId = data?.uniqueId;
            await User.findOneAndUpdate(
              newStudent?._id,
              {
                $push: {
                  "studentSchoolData.electiveSubjects":
                    data?.optionalElectiveSubject,
                  "studentSchoolData.classTeachers":
                    studentClassTeacherFound?._id,
                },
              },
              { new: true, upsert: true }
            );
          }
        } catch (error) {
          res.status(500).json({
            errorMessage: {
              message: ["Internal Server Error!"],
            },
          });
        }
        res.status(201).json({
          successMessage: "Your enrolment data has been saved successfully!",
          newStudent,
        });
        console.log("Your enrolment data has been saved successfully!");
      }
    );
  }
};
