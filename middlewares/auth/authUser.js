const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("node:crypto");
const UserVerificationData = require("../../models/user/userRefs/signUpModel/UserVerificationModel");
const User = require("../../models/user/UserModel");
const Program = require("../../models/academics/programmes/ProgramsModel");
const ClassLevelSection = require("../../models/academics/class/ClassLevelSectionModel");

// Generate token for login user
async function generateUserToken(req, res, next) {
  const { uniqueId, password } = req.body;
  console.log(req.body);

  try {
    const userFound = await User.findOne({
      uniqueId,
    }).select("+userSignUpDetails.password");

    if (!userFound?.isVerified) {
      res.status(400).json({
        errorMessage: {
          message: ["You are not a verified user!"],
        },
      });
      return;
    }

    const matchPassword = await bcrypt.compare(
      password,
      userFound?.userSignUpDetails?.password
    );
    if (matchPassword) {
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
          // expiresIn: Date.now() + 60000, // Expires in just a minute
          expiresIn: process.env.TOKEN_EXP,
        }
      );
      req.token = token;
      next();
    } else {
      return res.status(400).json({
        errorMessage: {
          message: ["Login failed! Invalid credentials!"],
        },
      });
    }
  } catch (error) {
    res.status(500).json({
      errorMessage: {
        message: [error?.message],
        // message: ["Internal Server Error!"],
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
          message: [`Token expired or invalid!`],
        },
      });
      // return;
    } else {
      req.user = user;
      next();
    }
  });
}
// User sign-up data validation middleware
async function validateUserSignUpData(req, res, next) {
  // Get data from request body
  const signUpData = req.body?.signUpData;
  try {
    // Find student's programme
    if (signUpData?.programme) {
      const studentProgramme = await Program.findOne({
        _id: signUpData?.programme,
      });
      if (!studentProgramme) {
        return res.status(404).json({
          errorMessage: {
            message: [`Programme not found!`],
          },
        });
      }
    }
    // Find user
    const userFound = await User.findOne({
      uniqueId: signUpData?.uniqueId,
    }).select("+userSignUpDetails.password");
    if (!userFound) {
      res.status(403).json({
        errorMessage: {
          message: [`Your ID is invalid!`],
        },
      });
      return;
    }
    // Check if user has already signed-up
    if (userFound && userFound?.signedUp) {
      res.status(404).json({
        errorMessage: {
          message: [`You've already signed up!`],
        },
      });
      return;
    }
    // Check if user is an admin and his/her employment has been approved
    if (userFound && userFound?.roles?.includes("admin")) {
      if (
        userFound &&
        userFound?.employment?.employmentStatus !== "approved" &&
        !userFound?.adminStatusExtend?.isAdmin
      ) {
        res.status(404).json({
          errorMessage: {
            message: [`Sign-up denied! Your employment not yet approved!`],
          },
        });
        return;
      }
    }
    // Check if user is a lecturer and his/her employment has been approved
    if (userFound && userFound?.roles?.includes("lecturer")) {
      if (userFound && userFound?.employment?.employmentStatus !== "approved") {
        res.status(404).json({
          errorMessage: {
            message: [`Sign-up denied! Your employment not yet approved!`],
          },
        });
        return;
      }
    }
    // Check if user is a non-teaching staff and his/her employment has been approved
    if (userFound && userFound?.roles?.includes("nt-staff")) {
      if (userFound && userFound?.employment?.employmentStatus !== "approved") {
        res.status(404).json({
          errorMessage: {
            message: [`Sign-up denied! Your employment not yet approved!`],
          },
        });
        return;
      }
    }
    // Check if user is a student and his/her enrollment has been approved
    if (userFound && userFound?.roles?.includes("student")) {
      if (
        userFound &&
        userFound?.studentStatusExtend?.enrollmentStatus !== "approved"
      ) {
        res.status(404).json({
          errorMessage: {
            message: [`Sign-up denied! You're not a student!`],
          },
        });
        return;
      }
    }
    // Check if user is not a student and his/her employment has been approved
    if (userFound && !userFound?.roles?.includes("student")) {
      if (userFound && userFound?.employment?.employmentStatus !== "approved") {
        res.status(404).json({
          errorMessage: {
            message: [`Sign-up denied! You're not yet approved!`],
          },
        });
        return;
      }
    }
    //Check if username already in use
    const userNameFound = await User.findOne({
      "userSignUpDetails.userName": signUpData?.userName,
    });
    if (userNameFound) {
      return res.status(404).json({
        errorMessage: {
          message: [`Username already exist!`],
        },
      });
    }
    // Find student's class
    if (userFound && userFound?.roles?.includes("student")) {
      const studentClassSection = await ClassLevelSection.findOne({
        _id: signUpData?.class,
      });
      if (!studentClassSection) {
        return res.status(404).json({
          errorMessage: {
            message: [`Class not found!`],
          },
        });
      }
    }
    // Check if there is an existing verification data with user details
    const existingUserVerificationData = await UserVerificationData.findOne({
      userId: signUpData?.uniqueId,
    });
    if (existingUserVerificationData) {
      return res.status(403).json({
        errorMessage: {
          message: [`Signed-up user! Check your email to verify!`],
        },
      });
    }
    // If validation is successful, attach user and the signup data to the request for further use
    req.data = { userFound, signUpData };
    next();
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      errorMessage: {
        message: [`Internal server error!`],
      },
    });
  }
}
// User verification data creation middleware
async function createUserVerificationData(req, res, next) {
  const signUpData = req?.data?.signUpData;
  const userFound = req?.data?.userFound;
  try {
    if (!signUpData?.uniqueId) {
      return res.status(403).json({
        errorMessage: {
          message: [`User-ID required!`],
        },
      });
    }
    if (!userFound) {
      return res.status(404).json({
        errorMessage: {
          message: [`User data not found!`],
        },
      });
    }
    //Set expiration of verification token
    //const currentDate = Date.now() + 60000; //Expires in just a minute
    // const currentDate = Date.now() + 1800000; //Expires in 30 minutes
    const currentDate = Date.now() + 3600000; //Expires in an hour
    const tokenString = crypto.randomBytes(64).toString("hex");

    //Create User's Verification data
    const verificationData = await UserVerificationData.create({
      userId: userFound?.uniqueId,
      emailToken: tokenString,
      createdAt: Date.now(),
      expiryDate: currentDate,
    });
    if (verificationData) {
      //Create New User
      const newSignedUpUser = await User.findOneAndUpdate(
        userFound?._id,
        {
          "userSignUpDetails.userName": signUpData?.userName,
          "userSignUpDetails.password": await bcrypt.hash(
            signUpData?.password,
            10
          ),
          signedUp: true,
        },
        { new: true }
      );
      if (newSignedUpUser) {
        // Attach the userSignUpData and VerificationData to the request for further use
        req.newSignedUpUserData = {
          newSignedUpUser,
          verificationData,
          password: signUpData?.password,
        };
        next(); // proceed to the next middleware or route handler
      } else {
        return res.status(400).json({
          errorMessage: {
            message: "Sign-up failed!",
          },
        });
      }
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      errorMessage: {
        message: [`Internal server error!`],
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
  validateUserSignUpData,
};
