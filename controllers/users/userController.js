const User = require("../../models/user/UserModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("node:crypto");
const UserVerificationData = require("../../models/user/userRefs/signUpModel/UserVerificationModel");
const { sendVerificationEmail } = require("../../emails/sendEmail");
const Program = require("../../models/academics/programmes/ProgramsModel");
const ClassLevelSection = require("../../models/academics/class/ClassLevelSectionModel");

module.exports.userSignUp = async (req, res) => {
  const newSignedUpUser = req?.newSignedUpUserData?.newSignedUpUser;
  try {
    if (newSignedUpUser) {
      res.status(201).json({
        successMessage: "Sign-up successful!",
        user: newSignedUpUser,
      });
    }
  } catch (error) {
    return res.status(404).json({
      errorMessage: {
        message: [`Sign-up failed!`],
      },
    });
  }
};

module.exports.userPersonalDataUpdate = async (req, res) => {
  const { userId } = req.params;
  const { updateData } = req.body;
  const foundUser = req.foundUser;

  try {
    let userInfoUpdated;
    //Update user Info
    if (foundUser?.roles?.includes("Student")) {
      userInfoUpdated = await User.findOneAndUpdate(
        foundUser._id,
        {
          "personalInfo.firstName": updateData?.firstName,
          "personalInfo.lastName": updateData?.lastName,
          "personalInfo.otherName": updateData?.otherName,
          "personalInfo.fullName": updateData?.fullName,
          "personalInfo.dateOfBirth": updateData?.dateOfBirth,
          "personalInfo.placeOfBirth": updateData?.placeOfBirth,
          "personalInfo.gender": updateData?.gender,
          "personalInfo.nationality": updateData?.nationality,
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
          previouslyUpdatedBy: foundUser?.lastUpdatedBy
            ? foundUser?.lastUpdatedBy
            : null,
          updatedDate: new Date().toISOString(),
        },
        {
          new: true,
        }
      );
    } else {
      userInfoUpdated = await User.findOneAndUpdate(
        foundUser._id,
        {
          "personalInfo.firstName": updateData?.firstName,
          "personalInfo.lastName": updateData?.lastName,
          "personalInfo.otherName": updateData?.otherName,
          "personalInfo.fullName": updateData?.fullName,
          "personalInfo.dateOfBirth": updateData?.dateOfBirth,
          "personalInfo.placeOfBirth": updateData?.placeOfBirth,
          "personalInfo.gender": updateData?.gender,
          "personalInfo.nationality": updateData?.nationality,
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
          previouslyUpdatedBy: foundUser?.lastUpdatedBy
            ? foundUser?.lastUpdatedBy
            : null,
          updatedDate: new Date().toISOString(),
        },
        {
          new: true,
        }
      );
    }
    res.status(201).json({
      successMessage: "User's data updated successfully!",
      updatedUser: userInfoUpdated,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      errorMessage: {
        message: [`User Update Failed! ${error?.message}`],
      },
    });
    return;
  }
};
module.exports.fetchUserVerificationData = async (req, res) => {
  const { emailToken } = req.params;
  const verificationDataFound = await UserVerificationData.findOne({
    emailToken,
  });
  if (!verificationDataFound) {
    return res.status(404).json({
      errorMessage: { message: ["Verification Data Not Found!"] },
    });
  } else {
    res.status(200).json({
      successMessage: "Verification data fetched successfully!",
      verificationDataFound,
    });
  }
};
module.exports.userVerification = async (req, res) => {
  const { emailToken } = req.params;
  //   console.log(req?.data, "L-79");
  const userInfo = req?.data?.userFound;
  const token = req?.data?.token;
  try {
    if (!emailToken) {
      return res.status(403).json({
        errorMessage: {
          message: [`Email Token Not Found!`],
        },
      });
    }
    // const userVerificationData = await UserVerificationData.findOne({
    //   userId,
    //   emailToken,
    // });
    // Update userFound's isVerified state
    if (!userInfo?.isVerified) {
      userInfo.isVerified = true;
      await userInfo.save();
    }
    // if (!userInfo.isVerifiedSensosa) {
    //   userInfo.isVerifiedSensosa = true;
    //   await userInfo.save();
    // }
    // await UserVerificationData.findOneAndDelete({
    //   _id: userVerificationData?._id,
    // });
  } catch (error) {
    return res.status(500).json({
      errorMessage: {
        message: ["Internal Server Error!"],
      },
    });
  }
  //   console.log(userInfo);

  res.status(200).cookie("verifyToken", token).json({
    successMessage: "Email verification successful!",
    user: userInfo,
    token,
    emailToken,
  });
};

module.exports.userLogin = async (req, res) => {
  const error = [];
  const { token, rememberMe, userFound } = req?.tokenData;

  // if (email && !validator.isEmail(email)) {
  //   error.push("Please provide your valid email!");
  // }
  try {
    if (userFound && userFound?.userSignUpDetails?.passwordResetRequest) {
      res.status(404).json({
        errorMessage: {
          message: ["Please check your email to reset your password!"],
        },
      });
      return;
    }
    if (userFound && userFound?.status?.isWithdrawned) {
      res.status(404).json({
        errorMessage: {
          message: ["Login failed! A withdrawned user cannot login!"],
        },
      });
      return;
    }
    if (userFound && !userFound?.isVerified) {
      res.status(400).json({
        errorMessage: {
          message: [
            "You're not yet verified! Please check your email to verify!",
          ],
        },
      });
      return;
    } else {
      res.status(200).json({
        successMessage: "You logged in successfully!",
        user: userFound,
        token,
      });
      // if (rememberMe) {
      //   res.cookie("userToken", token, {
      //     httpOnly: true,
      //     secure: process.env.NODE_ENV === "production", // Use only with HTTPS
      //     sameSite: "None",
      //     maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      //   });
      // } else {
      //   res.cookie("userToken", token, {
      //     httpOnly: true,
      //     secure: process.env.NODE_ENV === "production", // Use only with HTTPS
      //     sameSite: "None",
      //     maxAge: 3600000, // 1 day
      //   });
      // }
      // res.status(200).json({
      //   successMessage: "You logged in successfully!",
      //   user: userFound,
      //   token,
      // });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      errorMessage: {
        message: ["Internal Server Error"],
      },
    });
  }
};
module.exports.userLogout = async (req, res) => {
  try {
    res.clearCookie("userToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use only with HTTPS
      sameSite: "Strict",
    });
    res.status(200).json({
      successMessage: "You logged out successfully!",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: {
        errorMessage: ["Internal Server Error"],
      },
    });
  }
};

module.exports.refreshUserToken = async (req, res) => {
  const { token } = req.body;
  const oldToken = token;

  try {
    // Verify the current token
    const decodedToken = jwt.verify(oldToken, process.env.TOKEN_SECRET);

    // Generate a new token with an extended expiration
    const token = jwt.sign(
      {
        id: decodedToken?.id,
        uniqueId: decodedToken?.uniqueId,
        personalInfo: decodedToken?.personalInfo,
        userSignUpDetails: decodedToken?.userSignUpDetails,
        roles: decodedToken?.roles,
        isVerified: decodedToken?.isVerified,
        isVerifiedSensosa: decodedToken?.isVerifiedSensosa,
        lastUpdatedBy: decodedToken?.lastUpdatedBy,
        updatedDate: decodedToken?.updatedDate,
      },
      process.env.TOKEN_SECRET,
      {
        // expiresIn: Date.now() + 60000, // Expires in just a minute
        expiresIn: process.env.SHORT_LIFE_TOKEN_EXP,
      }
    );
    res.status(200).json({
      successMessage: `Session updated successfully!`,
      token,
    });
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

module.exports.forgotPasswordRequest = async (req, res) => {
  const { email } = req.body;
  const user = req?.data?.user;
  const token = req?.data?.token;
  try {
    const userPassResetRequest = await User.findOneAndUpdate(
      user?._id,
      {
        "userSignUpDetails.passwordResetRequest": true,
      },
      { new: true }
    );
    res.status(200).json({
      successMessage: "Password reset link sent to your email...",
      user: userPassResetRequest,
      token,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      errorMessage: {
        message: ["Internal server error!"],
      },
    });
  }
};

module.exports.resetPassword = async (req, res) => {
  const passwordResetToken = req?.data?.token;
  const user = req?.data?.userFound;
  const { password } = req?.body;
  //   const user = await User.findOne({ uniqueId }).select(
  //     "+userSignUpDetails.password"
  //   );
  if (!password) {
    return res.status(404).json({
      errorMessage: { message: [`Enter your new password!`] },
    });
  }
  const oldPassword = await bcrypt.compare(
    password,
    user.userSignUpDetails?.password
  );
  if (oldPassword) {
    res.status(403).json({
      errorMessage: { message: [`Old password! Please Enter New Password`] },
    });
    return;
  }
  if (user && passwordResetToken) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      await User.findOneAndUpdate(
        user?._id,
        {
          "userSignUpDetails.password": hashedPassword,
          "userSignUpDetails.passwordResetRequest": false,
        },
        {
          new: true,
        }
      );
      res.status(200).cookie("userToken", passwordResetToken).json({
        successMessage: "Password changed successfully!",
        user,
        token: passwordResetToken,
      });
    } catch (error) {
      console.log(error);
      res.status(400).json({
        errorMessage: {
          message: [
            "Password Reset token expired or already used! Request again!",
          ],
        },
      });
    }
  } else {
    res.status(400).json({
      errorMessage: {
        message: ["Unknown user!"],
      },
    });
  }
};

module.exports.assignUserRole = async (req, res) => {
  const data = req.body;
  console.log(data);

  const userFound = await User.findOne({ uniqueId: data?.userId });
  try {
    if (userFound) {
      if (!userFound?.roles?.includes(data?.role)) {
        const userRoleUpdated = await User.findOneAndUpdate(
          userFound?._id,
          {
            $push: { roles: data?.role },
          },
          { upsert: true }
        );
        res.status(200).json({
          successMessage: `The role of ${data?.role} is assigned to ${userFound?.personalInfo?.fullName}!`,
          user: userRoleUpdated,
        });
      } else {
        return res.status(400).json({
          error: {
            errorMessage: ["Role already assigned to this user!"],
          },
        });
      }
    } else {
      return res.status(404).json({
        error: {
          errorMessage: ["User's data not found!"],
        },
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: {
        errorMessage: ["Internal Server Error"],
      },
    });
  }
};

module.exports.removeUserRole = async (req, res) => {
  const data = req.body;
  console.log(data);

  const userFound = await User.findOne({ uniqueId: data?.userId });
  try {
    if (userFound) {
      if (userFound?.roles?.includes(data?.role)) {
        const userRoleUpdated = await User.findOneAndUpdate(
          userFound?._id,
          {
            $pull: { roles: data?.role },
          },
          { new: true }
        );
        res.status(200).json({
          successMessage: `The role of ${data?.role} is withdrawned from ${userFound?.personalInfo?.fullName}!`,
          user: userRoleUpdated,
        });
      } else {
        return res.status(400).json({
          error: {
            errorMessage: ["Role already assigned to this user!"],
          },
        });
      }
    } else {
      return res.status(404).json({
        error: {
          errorMessage: ["User's data not found!"],
        },
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: {
        errorMessage: ["Internal Server Error"],
      },
    });
  }
};
module.exports.fetchAllUsers = async (req, res) => {
  try {
    const allUsers = await User.find({}).populate([
      // { path: "employment.employmentProcessedBy" },
      // { path: "employment.employmentApprovedBy" },
      // { path: "adminActionsData.admins" },
      {
        path: "lecturerSchoolData.program",
      },
      { path: "lecturerSchoolData.students" },
      { path: "lecturerSchoolData.classLevelHandling" },
      {
        path: "lecturerSchoolData.teachingSubjects.electives.students", // Path to populate
        // model: "User", // Model to reference
        // match: { active: true }, // (Optional) Filter students if needed
        select:
          "_id uniqueId personalInfo.profilePicture personalInfo.fullName", // (Optional) Specify fields to include
      },
      {
        path: "lecturerSchoolData.teachingSubjects.electives.subject", // Path to populate
        select: "subjectName subjectInfo",
      },
      {
        path: "lecturerSchoolData.teachingSubjects.cores.students", // Path to populate
        // model: "User", // Model to reference
        // match: { active: true }, // (Optional) Filter students if needed
        select:
          "_id uniqueId personalInfo.profilePicture personalInfo.fullName", // (Optional) Specify fields to include
      },
      {
        path: "lecturerSchoolData.teachingSubjects.cores.subject", // Path to populate
        select: "subjectName subjectInfo",
      },
      // { path: "lecturerSchoolData.teachingSubjects" },
      { path: "studentSchoolData.batch" },
      { path: "studentSchoolData.program" },
      { path: "studentSchoolData.divisionProgram" },
      { path: "studentSchoolData.currentClassLevel" },
      { path: "studentSchoolData.currentClassTeacher" },
      { path: "studentSchoolData.currentClassLevelSection" },
      { path: "studentSchoolData.house" },
      { path: "studentStatusExtend.enrollmentApprovedBy" },
    ]);
    if (allUsers) {
      const sortedUsers = [...allUsers]?.sort(
        (oldUser, newUser) => newUser?.updatedAt - oldUser?.updatedAt
      );
      res.status(200).json({
        successMessage: `All users data fetched successfully!`,
        allUsers: sortedUsers,
      });
    }
  } catch (error) {
    return res.status(400).json({
      errorMessage: {
        message: [`Could not fetch users data!`],
      },
    });
  }
};
module.exports.fetchSingleUser = async (req, res) => {
  const { userId } = req.params;
  console.log(userId);

  try {
    const userFound = await User.findOne({ uniqueId: userId }).populate([
      // { path: "employment.employmentProcessedBy" },
      // { path: "employment.employmentApprovedBy" },
      // { path: "adminActionsData.admins" },
      {
        path: "lecturerSchoolData.program",
      },
      { path: "lecturerSchoolData.classLevelHandling" },
      { path: "lecturerSchoolData.students" },
      { path: "lecturerSchoolData.teachingSubjects" },
      { path: "studentSchoolData.batch" },
      { path: "studentSchoolData.program" },
      { path: "studentSchoolData.divisionProgram" },
      { path: "studentSchoolData.currentClassLevel" },
      { path: "studentSchoolData.currentClassTeacher" },
      { path: "studentSchoolData.currentClassLevelSection" },
      { path: "studentSchoolData.house" },
      { path: "studentStatusExtend.enrollmentApprovedBy" },
    ]);

    if (userFound) {
      res.status(200).json({
        successMessage: `User data fetched successfully!`,
        userFound,
      });
    } else {
      res.status(200).json({
        successMessage: `No user data found!`,
      });
    }
  } catch (error) {
    return res.status(400).json({
      errorMessage: {
        message: [`Could not fetch users data!`],
      },
    });
  }
};
