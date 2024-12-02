const jwt = require("jsonwebtoken");
const User = require("../../../models/user/UserModel");
const UserVerificationData = require("../../../models/user/userRefs/signUpModel/UserVerificationModel");

// Delete user verification data if expired
async function deleteExpiredVerificationData(req, res, next) {
  const currentDate = Date.now();
  const userId = req?.params?.userId;
  const emailToken = req?.params?.emailToken;
  try {
    // Find user by unique-ID
    const userFound = await User.findOne({ uniqueId: userId });
    if (!userFound) {
      return res.status(404).json({
        errorMessage: {
          message: [`User data not found!`],
        },
      });
    }
    if (userFound?.isVerified) {
      return res.status(404).json({
        errorMessage: {
          message: [`User already verified!`],
        },
      });
    }
    // Find user's verification data by both userId and emailToken
    const userVerificationData = await UserVerificationData.findOne({
      userId,
      emailToken,
    });
    // if (!userVerificationData) {
    //   return res.status(404).json({
    //     errorMessage: {
    //       message: [`User verification data not found!`],
    //     },
    //   });
    // }
    const isExpired = userVerificationData?.expiryDate < currentDate;
    console.log(isExpired);

    if (isExpired) {
      await UserVerificationData.findOneAndDelete({
        _id: userVerificationData?._id,
      });
      await User.findOneAndUpdate(
        { uniqueId: userId },
        {
          signedUp: false,
          "userSignUpDetails.password": "",
          "userSignUpDetails.userName": "",
        },
        { new: true }
      );
      return res.status(404).json({
        errorMessage: {
          message: [`Your verification token has expired!`],
        },
      });
    } else {
      req.userFound = userFound;
      next();
    }
  } catch (error) {
    return res.status(500).json({
      errorMessage: {
        message: [`Internal Server Error! ${error?.message}`],
      },
    });
  }
}
// User verification middleware
async function verifyUserMiddleware(req, res, next) {
  const { userId, emailToken } = req.params;
  const userFound = req.userFound;
  // console.log(userId, "User-ID");
  try {
    // Find user's verification data by both userId and emailToken
    const userVerificationData = await UserVerificationData.findOne({
      userId,
      emailToken,
    });
    if (!userVerificationData) {
      return res.status(404).json({
        errorMessage: {
          message: [`User verification data not found!`],
        },
      });
    }
    // Generate user token
    const token = jwt.sign(
      {
        id: userFound?._id,
        uniqueId: userFound?.uniqueId,
        personalInfo: userFound?.personalInfo,
        userSignUpDetails: userFound?.userSignUpDetails,
        roles: userFound?.roles,
        isVerified: userFound?.isVerified,
        isVerifiedSensosa: userFound?.isVerifiedSensosa,
        lastUpdatedBy: userFound?.lastUpdatedBy,
        updatedDate: userFound?.updatedDate,
      },
      process.env.TOKEN_SECRET,
      {
        expiresIn: process.env.TOKEN_EXP,
      }
    );
    // Attach userFound and token to the request for further use
    req.data = { userFound, token };
    next();
  } catch (error) {
    return res.status(500).json({
      errorMessage: {
        message: [`Internal Server Error! ${error?.message}`],
      },
    });
  }
}
// Delete user verification data after successful verification
async function deleteVerificationDataAfterVerification(req, res, next) {
  const userId = req?.params?.userId;
  const emailToken = req?.params?.emailToken;
  try {
    // Find user's verification data by both userId and emailToken
    const userVerificationData = await UserVerificationData.findOne({
      userId,
      emailToken,
    });
    if (userVerificationData) {
      await UserVerificationData.findOneAndDelete({
        _id: userVerificationData?._id,
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({
      errorMessage: {
        message: [`Internal Server Error! ${error?.message}`],
      },
    });
  }
}

module.exports = {
  verifyUserMiddleware,
  deleteExpiredVerificationData,
  deleteVerificationDataAfterVerification,
};
