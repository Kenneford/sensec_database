const { sendEnrollmentEmail } = require("../../emails/sendEmail");
const PlacementStudent = require("../../models/PlacementStudent/PlacementStudentModel");
const User = require("../../models/user/UserModel");

module.exports.createStudentGuardian = async (req, res) => {
  const { guardianData } = req.body;
  const { studentId } = req.params;
  console.log(guardianData);
  try {
    // Find student
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
    if (foundStudent && foundStudent?.guardian) {
      res.status(404).json({
        errorMessage: {
          message: ["Student guardian data exist!"],
        },
      });
      return;
    }
    //Find placement student who wants to enroll
    const placementStudentFound = await PlacementStudent.findOne({
      jhsIndexNo: guardianData?.indexNumber,
    });
    if (!placementStudentFound) {
      res.status(404).json({
        errorMessage: {
          message: ["Placement Student Data Not Found!"],
        },
      });
      return;
    }
    //create
    const guardianCreated = await User.findOneAndUpdate(
      foundStudent._id,
      {
        "guardian.guardianName": guardianData?.guardianName,
        "guardian.guardiansOccupation": guardianData?.fathersOccupation,
        "guardian.email": guardianData?.email,
        "guardian.address": guardianData?.address,
        "guardian.mobile": guardianData?.mobile,
        "studentStatusExtend.enrollmentStatus": "pending",
        "studentStatusExtend.enrolledOnline": true,
        "studentStatusExtend.dateEnrolled": new Date(),
      },
      { new: true }
    );
    if (guardianCreated) {
      //Send enrolment E-mail to student
      if (foundStudent && foundStudent?.contactAddress?.email !== "") {
        sendEnrollmentEmail({ foundStudent });
      }
      //Send enrolment SMS to student
      // if (
      //   foundStudent &&
      //   foundStudent?.contactAddress?.mobile !== "" &&
      //   guardianCreated?.studentStatusExtend?.enrollmentStatus === "pending"
      // ) {
      //   studentSMSEnrollmentTemplate({ userInfo: foundStudent });
      // }
      //Update placement student's enrolled status✅
      if (placementStudentFound && placementStudentFound.enrolled === false) {
        placementStudentFound.enrolled = true;
        await placementStudentFound.save();
      }
      console.log("Student's guardian added successfully...");
      res.status(201).json({
        successMessage: "Student's guardian added successfully...",
        guardian: guardianCreated,
      });
    } else {
      return res.status(500).json({
        errorMessage: {
          message: ["Could not create student's guardian data!"],
        },
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      errorMessage: {
        message: ["Internal Server Error!"],
      },
    });
  }
};

module.exports.updateStudentGuardian = async (req, res) => {
  const { studentUniqueId } = req.params;
  const {
    guardianName,
    email,
    address,
    phoneNumber,
    lastUpdatedBy,
    updatedDate,
  } = req.body;

  const adminFound = await Admin.findOne({ _id: lastUpdatedBy });
  const studentFound = await Student.findOne({ uniqueId: studentUniqueId });
  const guardianFound = await Guardian.findOne({
    studentUniqueId,
  });
  if (!studentFound) {
    res.status(404).json({
      errorMessage: {
        message: [`Student Data Not Found!`],
      },
    });
    return;
  }
  if (!guardianFound) {
    res.status(404).json({
      errorMessage: {
        message: [`Student's Guardian Data Not Found!`],
      },
    });
    return;
  }
  if (adminFound) {
    //Update
    const guardianUpdated = await Guardian.findByIdAndUpdate(
      guardianFound._id,
      {
        guardianName,
        email,
        address,
        phoneNumber,
        lastUpdatedBy,
        updatedDate,
      },
      { new: true }
    );
    res.status(200).json({
      successMessage: "Student's Guardian Updated Successfully...",
      guardianUpdated,
    });
    console.log("Student's Guardian Updated Successfully...");
  } else {
    res.status(403).json({
      errorMessage: {
        message: [`Operation Denied! You're Not An Admin!`],
      },
    });
  }
};
