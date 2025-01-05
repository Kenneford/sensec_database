const User = require("../../models/user/UserModel");
const { cloudinary } = require("../cloudinary/cloudinary");

// For Enrollment Approvals
async function createEmploymentData(req, res, next) {
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
      // Check for employee image upload file
      return res.status(400).json({
        errorMessage: {
          message: ["No image selected or image file not supported!"],
        },
      });
    }
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
            "personalInfo.fullName": employeeData?.otherName
              ? `${employeeData?.firstName} ${employeeData?.otherName} ${employeeData?.lastName}`
              : `${employeeData?.firstName} ${employeeData?.lastName}`,
            //   roles: ["admin"],
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
            "employment.employmentStatus": "pending",
            //   "adminStatusExtend.isAdmin": false, //===>>> isAdmin: will be updated during employment approval
            // "adminActionsData.createdAt": new Date().toISOString(),
          });
          if (newEmployeeData?.uniqueId?.includes("LCT")) {
            await User.findOneAndUpdate(
              newEmployeeData?._id,
              {
                "lecturerSchoolData.program": employeeData?.program,
              },
              { new: true }
            );
            // newEmployeeData.lecturerSchoolData.program = employeeData?.program;
            // await newEmployeeData.save();
          }
          req.newEmployeeData = newEmployeeData;
          next();
          // if (
          //   newEmployeeData &&
          //   newEmployeeData?.contactAddress?.email !== ""
          // ) {
          //   sendEmploymentEmail({ foundUser: newEmployeeData });
          // }
          // if (
          //   newEmployeeData &&
          //   newEmployeeData?.contactAddress?.mobile !== ""
          // ) {
          //   employmentSMS({ foundUser: newEmployeeData });
          // }
          // res.status(201).json({
          //   successMessage: "Your employment data saved successfully!",
          //   newEmployeeData,
          // });
          // console.log("Your employment data saved successfully!");
        }
      }
    );
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
}

module.exports = { createEmploymentData };
