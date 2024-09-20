const {
  userSignUp,
  userVerification,
  userLogout,
  userLogin,
  forgotPasswordRequest,
  resetPassword,
} = require("../../controllers/users/userController");
const {
  sendVerificationEmail,
  passwordResetRequestEmail,
} = require("../../emails/sendEmail");
const {
  createUserVerificationData,
  generateUserToken,
  generatePasswordResetUserToken,
} = require("../../middlewares/auth/authUser");
const {
  verifyUserMiddleware,
  deleteExpiredVerificationData,
} = require("../../middlewares/auth/emailVerification/emailVerification");
const {
  requestPasswordReset,
  verifyPasswordResetToken,
} = require("../../middlewares/auth/passwordReset/passwordReset");

const router = require("express").Router();

router.post(
  "/users/sign_up",
  createUserVerificationData,
  sendVerificationEmail,
  userSignUp
);
router.put(
  "/users/:userId/:emailToken/verify",
  deleteExpiredVerificationData,
  verifyUserMiddleware,
  userVerification
);
router.post("/users/login", generateUserToken, userLogin);
router.post(
  "/users/request_password_reset",
  requestPasswordReset,
  passwordResetRequestEmail,
  forgotPasswordRequest
);
router.post(
  "/users/:userId/password/:token/reset",
  verifyPasswordResetToken,
  generatePasswordResetUserToken,
  resetPassword
);
// router.post("/users/logout", userLogout);

module.exports = router;
