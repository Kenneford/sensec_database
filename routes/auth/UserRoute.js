const {
  userSignUp,
  userVerification,
  userLogout,
  userLogin,
  forgotPasswordRequest,
  resetPassword,
  assignUserRole,
  removeUserRole,
  fetchAllUsers,
  refreshUserToken,
} = require("../../controllers/users/userController");
const {
  sendVerificationEmail,
  passwordResetRequestEmail,
  userSignUpSMS,
} = require("../../emails/sendEmail");
const {
  createUserVerificationData,
  generateUserToken,
  generatePasswordResetUserToken,
  validateUserSignUpData,
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
  validateUserSignUpData,
  createUserVerificationData,
  sendVerificationEmail,
  userSignUpSMS,
  userSignUp
);
router.put(
  "/users/:userId/:emailToken/verify",
  deleteExpiredVerificationData,
  verifyUserMiddleware,
  userVerification
);
router.post("/users/login", generateUserToken, userLogin);
router.post("/users/refresh-token", refreshUserToken);
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
router.put("/users/role/assign", assignUserRole);
router.put("/users/role/remove", removeUserRole);
router.get("/users/fetch_all", fetchAllUsers);

module.exports = router;
