const jwt = require("jsonwebtoken");
const User = require("../../../models/user/UserModel");
const UserVerificationData = require("../../../models/user/userRefs/signUpModel/UserVerificationModel");

// User verification middleware
async function verifyUserMiddleware(req, res, next) {
  const userId = req?.params?.userId;
  const emailToken = req?.params?.emailToken;
  console.log(userId, "User-ID");
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
  // Find user by unique-ID
  const userFound = await User.findOne({ uniqueId: userId });
  if (!userFound) {
    return res.status(404).json({
      errorMessage: {
        message: [`User data not found!`],
      },
    });
  }
  // Generate user token
  const token = jwt.sign(
    {
      id: userFound?._id,
      uniqueId: userFound?.uniqueId,
      role: userFound?.role,
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
}

// Delete user verification data middleware
async function deleteExpiredVerificationData(req, res, next) {
  const currentDate = Date.now();
  const userId = req?.params?.userId;
  const emailToken = req?.params?.emailToken;
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
  }
  next();
}

module.exports = {
  verifyUserMiddleware,
  deleteExpiredVerificationData,
};
