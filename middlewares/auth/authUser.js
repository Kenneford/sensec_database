const jwt = require("jsonwebtoken");

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
      req.userInfo = user;
      next();
    }
  });
}

// Logged in user role middelware
function authUserRole({ userRoles }) {
  return async (req, res, next) => {
    // console.log(req.user, "L-47");
    if (
      req.userInfo?.role !== userRoles?.admin &&
      req.userInfo?.role !== userRoles?.teacher &&
      req.userInfo?.role !== userRoles?.nTStaff &&
      req.userInfo?.role !== userRoles?.sensosa &&
      req.userInfo?.role !== userRoles?.student
    ) {
      return res.status(401).json({
        errorMessage: {
          message: [`Not An Authorized User!`],
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

module.exports = { authUser, authUserRole, authSensosaUser };
