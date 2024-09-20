const {
  createMailTransporter,
  createGMailTransporter,
} = require("./createMailTransporter");
const hbs = require("nodemailer-express-handlebars");
const path = require("path");

// Text message engine
const client = require("twilio")(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN,
  {
    autoRetry: true,
    maxRetries: 3,
  }
);
const { Vonage } = require("@vonage/server-sdk");
const User = require("../models/user/UserModel");
const vonage = new Vonage({
  apiKey: process.env.VONAGE_API_KEY,
  apiSecret: process.env.VONAGE_API_SECRET,
});

const UserVerificationData = require("../models/user/userRefs/signUpModel/UserVerificationModel");

const sendVerificationEmail = async (req, res, next) => {
  // Find user's verification data
  const userVerificationData = await UserVerificationData.findOne({
    userId: req?.userVerificationData?.userId,
  });
  console.log(req?.body?.uniqueId, "L-31");
  try {
    if (userVerificationData) {
      // Find user who is signing up
      const userFound = await User.findOne({
        uniqueId: req?.body?.uniqueId,
      }).select("+userSignUpDetails.password");

      const currentYear = new Date().getFullYear();
      const url = "http://localhost:3000";

      const transporter = createMailTransporter();

      const handlebarOptions = {
        viewEngine: {
          extname: "hbs",
          partialsDir: path.resolve("./emails/"),
          defaultLayout: false,
        },
        viewPath: path.resolve("./emails/"),
      };

      // use a template file with nodemailer
      transporter.use("compile", hbs(handlebarOptions));

      let mailTemplate = {
        from: `Senya Senior High School <${process.env.NODEMAILER_EMAIL}>`,
        to: userFound?.contactAddress?.email,
        subject: "Verify Your Email",
        template: "email",
        context: {
          userImage: userFound?.personalInfo?.profilePicture.url,
          firstName: userFound?.personalInfo?.firstName,
          lastName: userFound?.personalInfo?.lastName,
          company: "Sensec",
          urlLink: `${url}/sensec/email/${userFound?.uniqueId}/${userVerificationData?.emailToken}/verify`,
          linkText: "Verify Your Email",
          verificationText:
            "Verify your email by clicking the link below to sign in to your account",
          linkExpiry: "This link expires in 1 hour",
          currentYear,
        },
      };
      transporter.sendMail(mailTemplate, (error, info) => {
        if (error) {
          console.log("Error sending email:", error);
          return res
            .status(400)
            .json({ errorMessage: { message: "Failed to send email." } });
        } else {
          console.log("Verification email sent!");
          next();
        }
      });
    } else {
      return res.status(404).json({
        errorMessage: { message: "User's verification data not found!" },
      });
    }
  } catch (error) {
    return res.status(404).json({
      errorMessage: { message: "Internal server error!" },
    });
  }
};
// User request password reset
async function passwordResetRequestEmail(req, res, next) {
  const user = req?.data?.userFound;
  const token = req?.data?.token;
  console.log(user);
  let body = `<h4>Hello ${user?.userSignUpDetails?.userName},</h4><p>To reset your password, kindly <a href="http://localhost:3000/sensec/password/${user.uniqueId}/${user._id}/${token}/reset"> click here</a> to do so.</p>`;
  const transporter = createMailTransporter();
  let mailTemplate = {
    from: `Sensec <${process.env.NODEMAILER_EMAIL}>`,
    to: user?.contactAddress?.email,
    subject: "Password Reset Link",
    html: body,
  };
  transporter.sendMail(mailTemplate, (error, info) => {
    if (error) {
      console.log("Error sending password reset email:", error);
      return res
        .status(400)
        .json({ errorMessage: { message: "Failed to send email." } });
    } else {
      console.log("Password reset link sent!", info);
      // Attach userFound and token to the request for further use
      req.data = { user, token };
      next();
    }
  });
}

module.exports = {
  sendVerificationEmail,
  passwordResetRequestEmail,
};
