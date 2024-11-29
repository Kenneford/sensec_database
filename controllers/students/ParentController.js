const { sendEnrollmentEmail } = require("../../emails/sendEmail");
const {
  selectStudentHouse,
} = require("../../middlewares/student/studentMiddleware");
const PlacementStudent = require("../../models/PlacementStudent/PlacementStudentModel");
const User = require("../../models/user/UserModel");

module.exports.createStudentParent = async (req, res, next) => {
  const { parentData } = req.body;
  const { studentId } = req.params;
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
    if (foundStudent && foundStudent?.parent) {
      res.status(404).json({
        errorMessage: {
          message: ["Student parent data exist!"],
        },
      });
      return;
    }
    //Find placement student who wants to enroll
    const placementStudentFound = await PlacementStudent.findOne({
      jhsIndexNo: parentData?.indexNumber,
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
    const parentCreated = await User.findOneAndUpdate(
      foundStudent._id,
      {
        "parent.fatherName": parentData?.fatherName,
        "parent.motherName": parentData?.motherName,
        "parent.fathersOccupation": parentData?.fathersOccupation,
        "parent.mothersOccupation": parentData?.mothersOccupation,
        "parent.email": parentData?.email,
        "parent.address": parentData?.address,
        "parent.mobile": parentData?.mobile,
        "studentStatusExtend.enrollmentStatus": "pending",
        "studentStatusExtend.enrolledOnline": true,
        "studentStatusExtend.dateEnrolled": new Date(),
      },
      { new: true }
    );
    selectStudentHouse(foundStudent);
    //Update placement student's enrolled status✅
    if (placementStudentFound && placementStudentFound.enrolled === false) {
      placementStudentFound.enrolled = true;
      await placementStudentFound.save();
    }
    //Send enrolment E-mail to student
    if (foundStudent && foundStudent?.contactAddress?.email !== "") {
      sendEnrollmentEmail({ foundStudent });
    }
    //Send enrolment SMS to student
    // if (
    //   foundStudent &&
    //   foundStudent?.contactAddress?.mobile !== ""
    // ) {
    //   studentSMSEnrollmentTemplate({ userInfo: foundStudent });
    // }
    console.log("Student's Parent Added Successfully...");
    res.status(201).json({
      successMessage: "Student's Parent Added Successfully...",
      parent: parentCreated,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      errorMessage: {
        message: ["Internal Server Error!"],
      },
    });
  }
};

module.exports.updateStudentParent = async (req, res) => {
  const { studentUniqueId } = req.params;
  const {
    fatherName,
    motherName,
    email,
    address,
    phoneNumber,
    lastUpdatedBy,
    updatedDate,
  } = req.body;
  //Find student's parents exist
  const parentFound = await Parent.findOne({ studentUniqueId });
  const foundStudent = await Student.findOne({
    uniqueId: studentUniqueId,
  });
  const foundAdmin = await Admin.findOne({
    _id: lastUpdatedBy,
  });
  if (!parentFound) {
    return res.status(404).json({
      errorMessage: {
        message: ["Student's Parent Not Found!"],
      },
    });
  }
  if (!foundStudent) {
    return res.status(404).json({
      errorMessage: {
        message: ["Student Data Not Found!"],
      },
    });
  }
  if (!foundAdmin) {
    res.status(403).json({
      errorMessage: {
        message: ["Operation Denied! You're Not An Admin!"],
      },
    });
    return;
  } else {
    //update
    const updatedParentData = await Parent.findByIdAndUpdate(
      parentFound._id,
      {
        fatherName,
        motherName,
        email,
        address,
        phoneNumber,
        lastUpdatedBy,
        updatedDate,
      },
      { new: true }
    );
    res.status(200).json({
      successMessage: "Student's Parent Data Updated Successfully...",
      updatedParentData,
    });
    console.log("Student's Parent Data Updated Successfully...");
  }
};

module.exports.fetchAllParents = async (req, res) => {
  //Find all parents
  const parentsFound = await Parent.find({});
  // const foundAdmin = await Admin.findOne({
  //   _id: lastUpdatedBy,
  // });
  if (!parentsFound) {
    return res.status(404).json({
      errorMessage: {
        message: ["No Parent Data Found!"],
      },
    });
  }
  // if (!foundStudent) {
  //   return res.status(404).json({
  //     errorMessage: {
  //       message: ["Student Data Not Found!"],
  //     },
  //   });
  // }
  // if (!foundAdmin) {
  //   res.status(403).json({
  //     errorMessage: {
  //       message: ["Operation Denied! You're Not An Admin!"],
  //     },
  //   });
  //   return;
  // }
  else {
    res.status(200).json({
      successMessage: "All Parent Data Fetched Successfully!",
      parentsFound,
    });
    console.log("All Parent Data Fetched Successfully!");
  }
};
