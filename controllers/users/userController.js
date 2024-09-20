const User = require("../../models/user/UserModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("node:crypto");
const UserVerificationData = require("../../models/user/userRefs/signUpModel/UserVerificationModel");
const { sendVerificationEmail } = require("../../emails/sendEmail");

module.exports.userSignUp = async (req, res) => {
  const { userName, uniqueId, password } = req.body;
  const error = [];
  if (!userName) {
    error.push("Please Provide Your Username!");
  }
  if (!uniqueId) {
    error.push("Please Provide Your Unique-Id!");
  }
  if (!password) {
    error.push("Please Password Required To Sign-Up!");
  }
  if (error.length > 0) {
    res.status(400).json({
      errorMessage: {
        message: error,
      },
    });
    return;
  }
  const userFound = await User.findOne({
    uniqueId,
  }).select("+userSignUpDetails.password");
  if (!userFound) {
    res.status(403).json({
      errorMessage: {
        message: [`User With Unique-Id ${uniqueId} Does Not Exist!`],
      },
    });
    return;
  }
  if (userFound && userFound.signedUp) {
    res.status(404).json({
      errorMessage: {
        message: [`Sign-Up Denied! User Already Exist!`],
      },
    });
    return;
  }
  // console.log(userFound);
  //Check if username already in use
  const userNameFound = await User.findOne({
    "userSignUpDetails.userName": userName,
  });
  if (userNameFound) {
    return res.status(404).json({
      errorMessage: {
        message: [`User With Username ${userName} Already Exist!`],
      },
    });
  } else {
    //Create New User
    const newUserSignUp = await User.findOneAndUpdate(
      userFound?._id,
      {
        "userSignUpDetails.userName": userName,
        "userSignUpDetails.password": await bcrypt.hash(password, 10),
        signedUp: true,
      },
      { new: true }
    );
    res.status(201).json({
      successMessage: "Sign-up successful!",
      user: newUserSignUp,
    });
    console.log("Sign-up successful!");
  }
};

module.exports.userVerification = async (req, res) => {
  const { userId, emailToken } = req.params;
  //   console.log(req?.data, "L-79");
  const userInfo = req?.data?.userFound;
  const token = req?.data?.token;
  if (!userId) {
    return res.status(403).json({
      errorMessage: {
        message: [`User-ID required!`],
      },
    });
  }
  if (!emailToken) {
    return res.status(403).json({
      errorMessage: {
        message: [`Email Token Not Found!`],
      },
    });
  }
  const userVerificationData = await UserVerificationData.findOne({
    userId,
    emailToken,
  });
  // Update userFound's isVerified state
  try {
    if (!userInfo?.isVerified) {
      userInfo.isVerified = true;
      await userInfo.save();
    }
    if (!userInfo.isVerifiedSensosa) {
      userInfo.isVerifiedSensosa = true;
      await userInfo.save();
    }
    await UserVerificationData.findOneAndDelete({
      _id: userVerificationData?._id,
    });
  } catch (error) {
    return res.status(500).json({
      errorMessage: {
        message: ["Internal Server Error!"],
      },
    });
  }
  //   console.log(userInfo);

  res.status(200).cookie("verifyToken", token).json({
    successMessage: "Email Verification Successful!",
    user: userInfo,
    token,
    emailToken,
  });
};

module.exports.userLogin = async (req, res) => {
  const error = [];
  const { uniqueId, password } = req.body;
  const token = req?.token;

  if (!uniqueId) {
    error.push("Your unique-ID required!");
  }
  if (!password) {
    error.push("Password required");
  }
  // if (email && !validator.isEmail(email)) {
  //   error.push("Please provide your valid email!");
  // }
  if (error.length > 0) {
    res.status(404).json({
      errorMessage: {
        message: error,
      },
    });
  }
  const userFound = await User.findOne({
    uniqueId,
  });
  if (!userFound) {
    res.status(404).json({
      errorMessage: {
        message: ["User data not found!"],
      },
    });
    return;
  } else {
    try {
      if (userFound && userFound?.userSignUpDetails?.passwordResetRequest) {
        res.status(404).json({
          errorMessage: {
            message: ["Please Check Your Email To Reset Your Password!"],
          },
        });
        return;
      }
      if (userFound && userFound?.status?.isWithdrawned) {
        res.status(404).json({
          errorMessage: {
            message: ["Login failed! A Withdrawned User Cannot Login!"],
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
        res.status(200).cookie("userToken", token).json({
          successMessage: "You logged in successfully...",
          user: userFound,
          token,
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({
        errorMessage: {
          message: ["Internal Server Error"],
        },
      });
    }
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

module.exports.userLogout = async (req, res) => {
  try {
    res.cookies("userToken", "", { maxAge: 0 });
    res.status(200).json({
      successMessage: "You logged out successfully...",
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
