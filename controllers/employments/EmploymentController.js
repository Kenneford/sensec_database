const {
  sendEmploymentEmail,
  employmentSMS,
  sendEmploymentApprovalEmail,
} = require("../../emails/sendEmail");
const { cloudinary } = require("../../middlewares/cloudinary/cloudinary");
const User = require("../../models/user/UserModel");

// Works ✅
module.exports.addNewEmployee = async (req, res) => {
  const { employeeData } = req.body;
  try {
    const existingEmployee = await User.findOne({
      uniqueId: employeeData?.uniqueId,
    });
    if (existingEmployee) {
      res.status(208).json({
        errorMessage: {
          message: [`Employee ID already exist!`],
        },
      });
      return;
    }
    if (!employeeData?.profilePicture) {
      // Check for student image upload file
      return res.status(400).json({
        errorMessage: {
          message: ["No image selected or image file not supported!"],
        },
      });
    }
    // For Admins Employments
    if (employeeData?.uniqueId?.includes("ADM")) {
      await cloudinary.uploader.upload(
        employeeData?.profilePicture,
        {
          folder: "Employees",
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
          } else {
            //Create new employee data
            const newEmployeeData = await User?.create({
              uniqueId: employeeData?.uniqueId,
              "personalInfo.firstName": employeeData?.firstName,
              "personalInfo.lastName": employeeData?.lastName,
              "personalInfo.otherName": employeeData?.otherName,
              "personalInfo.dateOfBirth": employeeData?.dateOfBirth,
              "personalInfo.placeOfBirth": employeeData?.placeOfBirth,
              "personalInfo.nationality": employeeData?.nationality,
              "personalInfo.gender": employeeData?.gender,
              "personalInfo.fullName": employeeData?.otherName
                ? `${employeeData?.firstName} ${employeeData?.otherName} ${employeeData?.lastName}`
                : `${employeeData?.firstName} ${employeeData?.lastName}`,
              roles: ["admin"],
              "personalInfo.profilePicture": {
                public_id: result.public_id,
                url: result.secure_url,
              },
              "status.height": employeeData?.height,
              "status.weight": employeeData?.weight,
              "status.complexion": employeeData?.complexion,
              "status.motherTongue": employeeData?.motherTongue,
              "status.otherTongue": employeeData?.otherTongue,
              "status.residentialStatus": employeeData?.residentialStatus,
              "contactAddress.homeTown": employeeData?.homeTown,
              "contactAddress.district": employeeData?.district,
              "contactAddress.region": employeeData?.region,
              "contactAddress.currentCity": employeeData?.currentCity,
              "contactAddress.residentialAddress":
                employeeData?.residentialAddress,
              "contactAddress.gpsAddress": employeeData?.gpsAddress,
              "contactAddress.mobile": employeeData?.mobile,
              "contactAddress.email": employeeData?.email,
              "employment.employmentType": employeeData?.typeOfEmployment,
              "adminStatusExtend.isAdmin": false, //===>>> isAdmin: will be updated during employment approval
              "employment.employmentStatus": "pending",
              // "adminActionsData.createdAt": new Date().toISOString(),
            });
            if (
              newEmployeeData &&
              newEmployeeData?.contactAddress?.email !== ""
            ) {
              sendEmploymentEmail({ foundUser: newEmployeeData });
            }
            // if (
            //   newEmployeeData &&
            //   newEmployeeData?.contactAddress?.mobile !== ""
            // ) {
            //   employmentSMS({ foundUser: newEmployeeData });
            // }
            res.status(201).json({
              successMessage: "Your employment data saved successfully!",
              newEmployeeData,
            });
            console.log("Your employment data saved successfully!");
          }
        }
      );
    }
    // For Lecturers Employments
    else if (employeeData?.uniqueId?.includes("LCT")) {
      await cloudinary.uploader.upload(
        employeeData?.profilePicture,
        {
          folder: "Employees",
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
          } else {
            //Create new employee data
            const newEmployeeData = await User.create({
              uniqueId: employeeData?.uniqueId,
              "personalInfo.firstName": employeeData?.firstName,
              "personalInfo.lastName": employeeData?.lastName,
              "personalInfo.otherName": employeeData?.otherName,
              "personalInfo.dateOfBirth": employeeData?.dateOfBirth,
              "personalInfo.placeOfBirth": employeeData?.placeOfBirth,
              "personalInfo.nationality": employeeData?.nationality,
              "personalInfo.gender": employeeData?.gender,
              "personalInfo.fullName": `${employeeData?.firstName} ${employeeData?.otherName} ${employeeData?.lastName}`,
              roles: ["lecturer"],
              "personalInfo.profilePicture": {
                public_id: result.public_id,
                url: result.secure_url,
              },
              "lecturerSchoolData.program": employeeData?.program,
              "status.height": employeeData?.height,
              "status.weight": employeeData?.weight,
              "status.complexion": employeeData?.complexion,
              "status.motherTongue": employeeData?.motherTongue,
              "status.otherTongue": employeeData?.otherTongue,
              "status.residentialStatus": employeeData?.residentialStatus,
              "contactAddress.homeTown": employeeData?.homeTown,
              "contactAddress.district": employeeData?.district,
              "contactAddress.region": employeeData?.region,
              "contactAddress.currentCity": employeeData?.currentCity,
              "contactAddress.residentialAddress":
                employeeData?.residentialAddress,
              "contactAddress.gpsAddress": employeeData?.gpsAddress,
              "contactAddress.mobile": employeeData?.mobile,
              "contactAddress.email": employeeData?.email,
              "employment.employmentType": employeeData?.typeOfEmployment,
              "lecturerStatusExtend.isLecturer": false,
              "employment.employmentStatus": "pending",
            });
            if (newEmployeeData?.contactAddress?.email !== "") {
              sendEmploymentEmail({ foundUser: newEmployeeData });
            }
            // if (newEmployeeData?.contactAddress?.mobile !== "") {
            //   employmentSMS({ foundUser: newEmployeeData });
            // }
            res.status(201).json({
              successMessage: "Your employment data saved successfully!",
              newEmployeeData,
            });
            console.log("Your employment data saved successfully!");
          }
        }
      );
    }
    // For Non-Teaching Staffs Employments
    else if (employeeData?.uniqueId?.includes("NTS")) {
      await cloudinary.uploader.upload(
        employeeData?.profilePicture,
        {
          folder: "Employees",
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
          } else {
            //Create new employee data
            const newEmployeeData = await User.create({
              uniqueId: employeeData?.uniqueId,
              "personalInfo.firstName": employeeData?.firstName,
              "personalInfo.lastName": employeeData?.lastName,
              "personalInfo.otherName": employeeData?.otherName,
              "personalInfo.dateOfBirth": employeeData?.dateOfBirth,
              "personalInfo.placeOfBirth": employeeData?.placeOfBirth,
              "personalInfo.nationality": employeeData?.nationality,
              "personalInfo.gender": employeeData?.gender,
              "personalInfo.fullName": `${employeeData?.firstName} ${employeeData?.otherName} ${employeeData?.lastName}`,
              roles: ["nt-staff"],
              "personalInfo.profilePicture": {
                public_id: result.public_id,
                url: result.secure_url,
              },
              "status.height": employeeData?.height,
              "status.weight": employeeData?.weight,
              "status.complexion": employeeData?.complexion,
              "status.motherTongue": employeeData?.motherTongue,
              "status.otherTongue": employeeData?.otherTongue,
              "status.residentialStatus": employeeData?.residentialStatus,
              "contactAddress.homeTown": employeeData?.homeTown,
              "contactAddress.district": employeeData?.district,
              "contactAddress.region": employeeData?.region,
              "contactAddress.currentCity": employeeData?.currentCity,
              "contactAddress.residentialAddress":
                employeeData?.residentialAddress,
              "contactAddress.gpsAddress": employeeData?.gpsAddress,
              "contactAddress.mobile": employeeData?.mobile,
              "contactAddress.email": employeeData?.email,
              "employment.employmentType": employeeData?.typeOfEmployment,
              "nTStaffStatusExtend.isNTStaff": false,
              "employment.employmentStatus": "pending",
            });
            if (newEmployeeData?.contactAddress?.email !== "") {
              sendEmploymentEmail({ foundUser: newEmployeeData });
            }
            // if (newEmployeeData?.contactAddress?.mobile !== "") {
            //   employmentSMS({ foundUser: newEmployeeData });
            // }
            res.status(201).json({
              successMessage: "Your employment data saved successfully!",
              newEmployeeData,
            });
            console.log("Your employment data saved successfully!");
          }
        }
      );
    } else {
      return res.status(404).json({
        errorMessage: {
          message: ["Employment type not found!"],
        },
      });
    }
  } catch (error) {
    if (error.code === 11000) {
      return res.status(500).json({
        errorMessage: {
          message: [
            "Duplicate key error: A user with this email already exists!",
          ],
        },
      });
      // Handle the error, e.g., return a custom message or perform other actions
    } else {
      console.log(error);
      return res.status(500).json({
        errorMessage: {
          message: [error?.message],
        },
      });
      // Handle other potential errors
    }
  }
};
// Works ✅
module.exports.approveEmployment = async (req, res, next) => {
  const { employeeId, employmentApprovedBy } = req.params;
  const authAdmin = req.user;
  // console.log(employmentApprovedBy);
  console.log(authAdmin);

  try {
    //Find admin taking action
    const adminFound = await User.findOne({ _id: employmentApprovedBy });
    // Validate admin's ID
    if (!adminFound) {
      res.status(404).json({
        errorMessage: {
          message: ["Operation denied! You're not an authorized admin"],
        },
      });
      return;
    }
    if (authAdmin && authAdmin?.id !== employmentApprovedBy) {
      res.status(404).json({
        errorMessage: {
          message: ["Operation denied! You're not an authorized admin"],
        },
      });
      return;
    }
    //Find user
    const employeeFound = await User.findOne({ uniqueId: employeeId });
    // console.log(user);
    if (!employeeFound) {
      res.status(404).json({
        errorMessage: {
          message: ["Employee Data Not Found!"],
        },
      });
      return;
    }
    if (employeeFound?.employment?.employmentStatus === "approved") {
      res.status(400).json({
        errorMessage: {
          message: ["Employment Already Approved!"],
        },
      });
      return;
    }
    let userEmploymentApproved;
    //Find user to update
    //Update Admin
    if (employeeFound.roles?.includes("admin")) {
      userEmploymentApproved = await User.findOneAndUpdate(
        employeeFound._id,
        {
          "employment.employmentStatus": "approved",
          "employment.employmentApprovedBy": adminFound?._id,
          "employment.employmentApprovedDate": new Date().toISOString(),
          "adminStatusExtend.isAdmin": true,
          "adminStatusExtend.isStaff": true,
        },
        { new: true }
      );
    }
    //Update Lecturer
    if (employeeFound.roles?.includes("lecturer")) {
      userEmploymentApproved = await User.findOneAndUpdate(
        employeeFound._id,
        {
          "employment.employmentStatus": "approved",
          "employment.employmentApprovedBy": adminFound?._id,
          "employment.employmentApprovedDate": new Date().toISOString(),
          "lecturerStatusExtend.isLecturer": true,
          "lecturerStatusExtend.isStaff": true,
        },
        { new: true }
      );
    }
    //Update Non-Teaching Staff
    if (employeeFound.roles?.includes("nt-staff")) {
      userEmploymentApproved = await User.findOneAndUpdate(
        employeeFound._id,
        {
          "employment.employmentStatus": "approved",
          "employment.employmentApprovedBy": adminFound?._id,
          "employment.employmentApprovedDate": new Date().toISOString(),
          "nTStaffStatusExtend.isNTStaff": true,
          "nTStaffStatusExtend.isStaff": true,
        },
        { new: true }
      );
    }
    //Push approved employee into adminFound's actionsData employmentsApproved array✅
    if (
      userEmploymentApproved &&
      adminFound &&
      !adminFound?.adminActionsData?.employmentsApproved?.includes(
        userEmploymentApproved?._id
      )
    ) {
      await User.findOneAndUpdate(
        adminFound?._id,
        {
          $push: {
            "adminActionsData.employmentsApproved": userEmploymentApproved?._id,
          },
        },
        { upsert: true, new: true }
      );
    }
    sendEmploymentApprovalEmail({ employeeFound });
    res.status(200).json({
      successMessage: "Employment approved successfully!",
      userEmploymentApproved,
    });
    console.log("Employment Approved Successfully!");
  } catch (error) {
    return res.status(500).json({
      errorMessage: {
        message: ["Internal Server Error!"],
      },
    });
  }
};
// Works ✅
module.exports.approveMultiEmployees = async (req, res) => {
  const { employees } = req.body;
  const { employmentApprovedBy } = req.params;
  const authAdmin = req.user;
  try {
    //Find admin taking action
    const adminFound = await User.findOne({ _id: employmentApprovedBy });
    // Validate admin's ID
    if (!adminFound) {
      res.status(404).json({
        errorMessage: {
          message: ["Operation denied! You're not an authorized admin"],
        },
      });
      return;
    }
    if (authAdmin && authAdmin?.id !== employmentApprovedBy) {
      res.status(404).json({
        errorMessage: {
          message: ["Operation denied! You're not an authorized admin"],
        },
      });
      return;
    }
    //Check if employees data is greater than 0
    if (!employees || employees.length < 1) {
      res.status(404).json({
        errorMessage: {
          message: [`No employee data selected!`],
        },
      });
      return;
    }
    const approvedEmployees = employees.forEach(async (employee) => {
      //Find employee
      const employeeFound = await User.findOne({
        uniqueId: employee?.uniqueId,
      });
      if (
        employeeFound?.adminStatusExtend &&
        employeeFound?.employment?.employmentStatus === "pending"
      ) {
        //Update employee's employment data
        await User.findOneAndUpdate(
          employeeFound._id,
          {
            "employment.employmentStatus": "approved",
            "employment.employmentApprovedBy": adminFound?._id,
            "employment.employmentApprovedDate": new Date().toISOString(),
            "adminStatusExtend.isAdmin": true,
            "adminStatusExtend.isStaff": true,
          },
          { new: true }
        );
      }
      if (
        employeeFound?.lecturerStatusExtend &&
        employeeFound?.employment?.employmentStatus === "pending"
      ) {
        //Update employee's employment data
        await User.findOneAndUpdate(
          employeeFound._id,
          {
            "employment.employmentStatus": "approved",
            "employment.employmentApprovedBy": adminFound?._id,
            "employment.employmentApprovedDate": new Date().toISOString(),
            "lecturerStatusExtend.isLecturer": true,
            "lecturerStatusExtend.isStaff": true,
          },
          { new: true }
        );
      }
      if (
        employeeFound?.nTStaffStatusExtend &&
        employeeFound?.employment?.employmentStatus === "pending"
      ) {
        //Update employee's employment data
        await User.findOneAndUpdate(
          employeeFound._id,
          {
            "employment.employmentStatus": "approved",
            "employment.employmentApprovedBy": adminFound?._id,
            "employment.employmentApprovedDate": new Date().toISOString(),
            "nTStaffStatusExtend.isNTStaff": true,
            "nTStaffStatusExtend.isStaff": true,
          },
          { new: true }
        );
      }
    });
    res.status(200).json({
      successMessage: "All selected employees approved successfully!",
      allApprovedEmployees: approvedEmployees,
    });
  } catch (error) {
    return res.status(500).json({
      errorMessage: {
        message: [error?.message],
      },
    });
  }
};
// Works ✅
module.exports.rejectEmployment = async (req, res, next) => {
  const { employeeId, employmentRejectedBy } = req.params;
  const authAdmin = req.user;

  const adminFound = await User.findOne({ _id: employmentRejectedBy });
  try {
    //Find admin taking action
    // Validate admin's ID
    if (!adminFound) {
      res.status(404).json({
        errorMessage: {
          message: ["Operation denied! You're not an authorized admin"],
        },
      });
      return;
    }
    if (authAdmin && authAdmin?.id !== employmentRejectedBy) {
      res.status(404).json({
        errorMessage: {
          message: ["Operation denied! You're not an authorized admin"],
        },
      });
      return;
    }
    //Find user
    const employeeFound = await User.findOne({ uniqueId: employeeId });
    // console.log(user);
    if (!employeeFound) {
      res.status(404).json({
        errorMessage: {
          message: ["Employee Data Not Found!"],
        },
      });
      return;
    }
    let userEmploymentRejected;
    //Find user to update
    //Update Admin
    if (employeeFound.roles?.includes("admin")) {
      userEmploymentRejected = await User.findOneAndUpdate(
        employeeFound._id,
        {
          "employment.employmentStatus": "rejected",
          "employment.employmentRejectedBy": adminFound?._id,
          "employment.employmentRejectedDate": new Date().toISOString(),
          "adminStatusExtend.isAdmin": false,
          "adminStatusExtend.isStaff": false,
        },
        { new: true }
      );
    }
    //Update Lecturer
    if (employeeFound.roles?.includes("lecturer")) {
      userEmploymentRejected = await User.findOneAndUpdate(
        employeeFound._id,
        {
          "employment.employmentStatus": "rejected",
          "employment.employmentRejectedBy": adminFound?._id,
          "employment.employmentRejectedDate": new Date().toISOString(),
          "lecturerStatusExtend.isLecturer": false,
          "lecturerStatusExtend.isStaff": false,
        },
        { new: true }
      );
    }
    //Update Non-Teaching Staff
    if (employeeFound.roles?.includes("nt-staff")) {
      userEmploymentRejected = await User.findOneAndUpdate(
        employeeFound._id,
        {
          "employment.employmentStatus": "rejected",
          "employment.employmentRejectedBy": adminFound?._id,
          "employment.employmentRejectedDate": new Date().toISOString(),
          "nTStaffStatusExtend.isNTStaff": false,
          "nTStaffStatusExtend.isStaff": false,
        },
        { new: true }
      );
    }
    //Push approved employee into adminFound's actionsData employmentsApproved array✅
    if (
      userEmploymentRejected &&
      adminFound &&
      !adminFound?.adminActionsData?.employmentsRejected?.includes(
        userEmploymentRejected?._id
      )
    ) {
      await User.findOneAndUpdate(
        adminFound?._id,
        {
          $push: {
            "adminActionsData.employmentsRejected": userEmploymentRejected?._id,
          },
        },
        { upsert: true, new: true }
      );
    }
    res.status(200).json({
      successMessage: "Employment rejected successfully!",
      userEmploymentRejected,
    });
    console.log("Employment rejected successfully!");
  } catch (error) {
    return res.status(500).json({
      errorMessage: {
        message: ["Internal Server Error!"],
      },
    });
  }
};
module.exports.rejectMultiEmployees = async (req, res) => {
  const { employees } = req.body;
  const { employmentRejectedBy } = req.params;
  const authAdmin = req.user;

  try {
    //Find admin taking action
    const adminFound = await User.findOne({ _id: employmentRejectedBy });
    // Validate admin's ID
    if (!adminFound) {
      res.status(404).json({
        errorMessage: {
          message: ["Operation denied! You're not an authorized admin"],
        },
      });
      return;
    }
    if (authAdmin && authAdmin?.id !== employmentRejectedBy) {
      res.status(404).json({
        errorMessage: {
          message: ["Operation denied! You're not an authorized admin"],
        },
      });
      return;
    }
    //Check if employees data is greater than 0
    if (!employees || employees.length < 1) {
      res.status(404).json({
        errorMessage: {
          message: [`No employee data selected!`],
        },
      });
      return;
    }
    const rejectedEmployees = employees.forEach(async (employee) => {
      //Find employee
      const employeeFound = await User.findOne({
        uniqueId: employee?.uniqueId,
      });
      if (
        employeeFound?.adminStatusExtend &&
        employeeFound?.employment?.employmentStatus === "pending"
      ) {
        //Update employee's employment data
        await User.findOneAndUpdate(
          employeeFound._id,
          {
            "employment.employmentStatus": "rejected",
            "employment.employmentApprovedBy": adminFound?._id,
            "employment.employmentApprovedDate": new Date().toISOString(),
            "adminStatusExtend.isAdmin": false,
            "adminStatusExtend.isStaff": false,
          },
          { new: true }
        );
      }
      if (
        employeeFound?.lecturerStatusExtend &&
        employeeFound?.employment?.employmentStatus === "pending"
      ) {
        //Update employee's employment data
        await User.findOneAndUpdate(
          employeeFound._id,
          {
            "employment.employmentStatus": "rejected",
            "employment.employmentApprovedBy": adminFound?._id,
            "employment.employmentApprovedDate": new Date().toISOString(),
            "lecturerStatusExtend.isLecturer": false,
            "lecturerStatusExtend.isStaff": false,
          },
          { new: true }
        );
      }
      if (
        employeeFound?.nTStaffStatusExtend &&
        employeeFound?.employment?.employmentStatus === "pending"
      ) {
        //Update employee's employment data
        await User.findOneAndUpdate(
          employeeFound._id,
          {
            "employment.employmentStatus": "rejected",
            "employment.employmentApprovedBy": adminFound?._id,
            "employment.employmentApprovedDate": new Date().toISOString(),
            "nTStaffStatusExtend.isNTStaff": false,
            "nTStaffStatusExtend.isStaff": false,
          },
          { new: true }
        );
      }
    });
    res.status(200).json({
      successMessage: "All selected employees rejected successfully!",
      allRejectedEmployees: rejectedEmployees,
    });
  } catch (error) {
    return res.status(500).json({
      errorMessage: {
        message: [error?.message],
      },
    });
  }
};
