const { cloudinary } = require("../../middlewares/cloudinary/cloudinary");
const User = require("../../models/user/UserModel");

module.exports.addNewEmployee = async (req, res) => {
  const { employeeData } = req.body;
  console.log(employeeData);

  try {
    const existingEmployee = await User.findOne({
      uniqueId: employeeData?.uniqueId,
    });
    if (existingEmployee) {
      return res.status(208).json({
        errorMessage: {
          message: [`Employee ID already exist!`],
        },
      });
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
            { width: 500, height: 500, crop: "scale" },
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
              "personalInfo.fullName": `${employeeData?.firstName} ${employeeData?.otherName} ${employeeData?.lastName}`,
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
              "employment.employmentProcessedDate": new Date().toISOString(),
              "adminStatusExtend.isAdmin": false, //===>>> isAdmin: will be updated during employment approval
              "employment.employmentStatus": "pending",
            });
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
            { width: 300, height: 300, crop: "scale" },
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
              "studentSchoolData.program": employeeData?.program,
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
              "employment.employmentProcessedDate": new Date().toISOString(),
              "lecturerStatusExtend.isLecturer": false,
              "employment.employmentStatus": "pending",
            });
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
            { width: 500, height: 500, crop: "scale" },
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
              "employment.employmentProcessedDate": new Date().toISOString(),
              "nTStaffStatusExtend.isNTStaff": false,
              "employment.employmentStatus": "pending",
            });
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
    console.log(error);
    return res.status(500).json({
      errorMessage: {
        message: ["Internal Server Error!"],
      },
    });
  }
};
