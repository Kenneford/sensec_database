const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("node:crypto");
const UserVerificationData = require("../../models/user/userRefs/signUpModel/UserVerificationModel");
const User = require("../../models/user/UserModel");

// Generate token for login user
async function generateUserToken(req, res, next) {
  const { uniqueId, password } = req.body;
  const userFound = await User.findOne({
    uniqueId,
  }).select("+userSignUpDetails.password");

  const matchPassword = await bcrypt.compare(
    password,
    userFound?.signedUpSensosa
      ? userFound?.userSignUpDetails?.chatPassword
      : userFound?.userSignUpDetails?.password
  );
  if (matchPassword) {
    // Generate user token
    const token = jwt.sign(
      {
        id: userFound?._id,
        uniqueId: userFound?.uniqueId,
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
    req.token = token;
    next();
  } else {
    res.status(400).json({
      errorMessage: {
        message: ["Login failed! Invalid credentials!"],
      },
    });
  }
}

// Generate password reset token for user
async function generatePasswordResetUserToken(req, res, next) {
  const user = req?.data?.userFound;

  if (user) {
    // Generate user token
    const token = jwt.sign(
      {
        id: user?._id,
        uniqueId: user?.uniqueId,
        role: user?.role,
        isVerified: user?.isVerified,
        isVerifiedSensosa: user?.isVerifiedSensosa,
        lastUpdatedBy: user?.lastUpdatedBy,
        updatedDate: user?.updatedDate,
      },
      process.env.TOKEN_SECRET,
      {
        expiresIn: process.env.TOKEN_EXP,
      }
    );
    // Attach userFound and token to the request for further use
    req.data = { userFound: user, token };
    next();
  } else {
    res.status(400).json({
      errorMessage: {
        message: ["Password reset failed!"],
      },
    });
  }
}

// Logged in user middelware
function authUser(req, res, next) {
  const headerObj = req.headers;
  if (!headerObj) {
    res.status(403).json({
      errorMessage: {
        message: [`Missing Auth Header!`],
      },
    });
    return;
  }
  const token = headerObj?.authorization?.split(" ")[1];
  jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
    if (err) {
      res.status(403).json({
        errorMessage: {
          message: [`Token Expired/Invalid!`],
        },
      });
      // return;
    } else {
      req.user = user;
      next();
    }
  });
}

// User verification data creation middleware
async function createUserVerificationData(req, res, next) {
  const userId = req?.body?.uniqueId;
  if (!userId) {
    return res.status(403).json({
      errorMessage: {
        message: [`User-ID required!`],
      },
    });
  }
  try {
    //Set expiration of verification token
    //const currentDate = Date.now() + 60000; //Expires in just a minute
    // const currentDate = Date.now() + 1800000; //Expires in 30 minutes
    const currentDate = Date.now() + 3600000; //Expires in an hour
    const tokenString = crypto.randomBytes(64).toString("hex");
    // console.log(tokenString, "L-101");
    const existingUserVerificationData = await UserVerificationData.findOne({
      userId,
    });
    if (existingUserVerificationData) {
      return res.status(403).json({
        errorMessage: {
          message: [`User-ID Already Exists!`],
        },
      });
    } else {
      //Create User's Verification data
      const userVerificationData = await UserVerificationData.create({
        userId,
        emailToken: tokenString,
        createdAt: Date.now(),
        expiryDate: currentDate,
      });
      // Attach the VerificationData to the request for further use
      req.userVerificationData = userVerificationData;
      next(); // proceed to the next middleware or route handler
    }
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      errorMessage: {
        message: [`Internal server error!, "L-72"`],
      },
    });
  }
}

// Logged in user role middelware
function authUserRole({ userRoles }) {
  return async (req, res, next) => {
    // console.log(req.user, "L-160");
    if (
      !req?.user?.roles?.includes(userRoles?.admin) &&
      !req?.user?.roles?.includes(userRoles?.teacher) &&
      !req?.user?.roles?.includes(userRoles?.nTStaff) &&
      !req?.user?.roles?.includes(userRoles?.sensosa) &&
      !req?.user?.roles?.includes(userRoles?.student)
    ) {
      return res.status(401).json({
        errorMessage: {
          message: [`You're not an authorized user!`],
        },
      });
    }
    next();
  };
}

// Logged in user isVerifiedSensosa middelware
function authSensosaUser({ userVerified }) {
  return async (req, res, next) => {
    // console.log(req.user, "L-47");
    if (req.userInfo?.isVerifiedSensosa !== userVerified?.isVerifiedSensosa) {
      return res.status(401).json({
        errorMessage: {
          message: [`Not An Authorized User!`],
        },
      });
    }
    next();
  };
}

module.exports = {
  authUser,
  authUserRole,
  authSensosaUser,
  createUserVerificationData,
  generateUserToken,
  generatePasswordResetUserToken,
};
