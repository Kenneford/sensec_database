const validator = require("validator");
const jwt = require("jsonwebtoken");
const User = require("../../../models/user/UserModel");

async function requestPasswordReset(req, res, next) {
  const data = req.body;
  console.log("email: ", data?.email);

  try {
    // Check if email is a string
    if (typeof data?.email !== "string") {
      res.status(403).json({
        errorMessage: {
          message: ["Invalid email format!"],
        },
      });
      return;
    }
    if (!validator.isEmail(data?.email)) {
      res.status(403).json({
        errorMessage: {
          message: ["Please provide a valid email!"],
        },
      });
      return;
    }
    // Find user by email
    const userFound = await User.findOne({
      "contactAddress.email": data?.email,
    }).select("+userSignUpDetails.password");
    // Create new secret with token secret and user's password
    const secret =
      process.env.TOKEN_SECRET + userFound?.userSignUpDetails?.password;
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
      secret,
      {
        expiresIn: process.env.SHORT_LIFE_TOKEN_EXP,
      }
    );
    if (token) {
      // Attach userFound and token to the request for further use
      req.data = { userFound, token };
      next();
    } else {
      return res.status(400).json({
        errorMessage: { message: ["Failed to request for password reset!"] },
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      errorMessage: {
        message: ["Internal Server Error!", error?.message],
      },
    });
  }
}

async function verifyPasswordResetToken(req, res, next) {
  const token = req?.params?.token;
  const uniqueId = req?.params?.userId;
  try {
    if (!token) {
      return res.status(404).json({
        errorMessage: { message: [`Token not found`] },
      });
    }
    if (!uniqueId) {
      res.status(400).json({
        errorMessage: { message: [`User unique ID required!`] },
      });
      return;
    }
    const userFound = await User.findOne({ uniqueId }).select(
      "+userSignUpDetails.password"
    );
    if (!userFound) {
      res.status(404).json({
        errorMessage: { message: [`User data not found!`] },
      });
      return;
    }
    const secret =
      process.env.TOKEN_SECRET + userFound?.userSignUpDetails?.password;
    const isValidToken = jwt.verify(token, secret);
    if (!isValidToken) {
      res.status(404).json({
        errorMessage: {
          message: ["Password reset token not found!"],
        },
      });
      return;
    } else {
      // Attach userFound and token to the request for further use
      req.data = { userFound };
      next();
    }
  } catch (error) {
    console.log(error);
    if (error?.message === "invalid signature") {
      // console.log("Invalid signature!");
      return res.status(500).json({
        errorMessage: {
          message: [
            "Internal Server Error! Invalid signature or token expired!",
          ],
        },
      });
    } else {
      return res.status(500).json({
        errorMessage: {
          message: ["Internal Server Error!", error?.message],
        },
      });
    }
  }
}

module.exports = { requestPasswordReset, verifyPasswordResetToken };
