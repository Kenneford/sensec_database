const {
  createMailTransporter,
  createGMailTransporter,
} = require("./createMailTransporter");
const hbs = require("nodemailer-express-handlebars");
const path = require("path");

// Text message engine
const twilioClient = require("twilio")(
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
  // Get verification data
  const verificationData = req?.newSignedUpUserData?.verificationData;
  // Get user's data
  const foundStudent = req?.newSignedUpUserData?.newSignedUpUser;
  const userPassword = req?.newSignedUpUserData?.password;
  try {
    // Find user's verification data
    const userVerificationData = await UserVerificationData.findOne({
      userId: verificationData?.userId,
    });
    if (userFound && userFound?.contactAddress?.email) {
      if (userVerificationData) {
        const currentYear = new Date().getFullYear();
        const url = "http://192.168.178.22:2025";

        const transporter = createGMailTransporter();

        const handlebarOptions = {
          viewEngine: {
            extname: "hbs",
            partialsDir: path.resolve("./emails/forSignUpVerification/"),
            layoutsDir: path.resolve("./emails/forSignUpVerification/"),
            defaultLayout: "",
          },
          viewPath: path.resolve("./emails/forSignUpVerification/"),
          extName: ".hbs",
        };

        // use a template file with nodemailer
        transporter.use("compile", hbs(handlebarOptions));

        let mailTemplate = {
          from: `Senya Senior High School <${process.env.NODEMAILER_GMAIL}>`,
          to: userFound?.contactAddress?.email,
          subject: "Verify Your Email",
          template: "signUpVerification",
          context: {
            userImage: userFound?.personalInfo?.profilePicture.url,
            uniqueId: userFound?.uniqueId,
            firstName: userFound?.personalInfo?.firstName,
            lastName: userFound?.personalInfo?.lastName,
            userName: userFound?.userSignUpDetails?.userName,
            password: userPassword,
            company: "Senya Senior High School",
            urlLink: `${url}/sensec/email/${userFound?.uniqueId}/${userVerificationData?.emailToken}/verify`,
            linkText: "Verify Your Email",
            verificationText:
              "Verify your email by clicking the link below to sign in to your account. Please do not share your login credentials with anyone!",
            linkExpiry: "This link expires in 1 hour",
            currentYear,
          },
          attachments: [
            {
              filename: "school-logo.png",
              path: path.resolve(__dirname, "assets/sensec-logo1.png"), // Path to school logo
              cid: "schoolLogo", // Same CID as in the HTML template
            },
          ],
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
        return res.status(400).json({
          errorMessage: {
            message: "Operation failed! Could not create verification data!",
          },
        });
      }
    } else {
      next();
    }
  } catch (error) {
    return res.status(500).json({
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

const sendEnrollmentEmail = async ({ foundStudent }) => {
  const currentYear = new Date().getFullYear();
  const url = "http://192.168.178.22:2025";

  const transporter = createGMailTransporter();

  const handlebarOptions = {
    viewEngine: {
      extname: "hbs",
      partialsDir: path.resolve("./emails/forEnrollment/"),
      layoutsDir: path.resolve("./emails/forEnrollment/"),
      defaultLayout: "",
    },
    viewPath: path.resolve("./emails/forEnrollment/"),
    extName: ".hbs",
  };

  // use a template file with nodemailer
  transporter.use("compile", hbs(handlebarOptions));

  let mailTemplate = {
    from: `Senya Senior High School <${process.env.NODEMAILER_GMAIL}>`,
    to: foundStudent?.contactAddress?.email,
    subject: "Your Enrollment Status",
    template: "enrollmentEmail",
    context: {
      userImage: foundStudent?.personalInfo?.profilePicture.url,
      uniqueId: foundStudent?.uniqueId,
      firstName: foundStudent?.personalInfo?.firstName,
      lastName: foundStudent?.personalInfo?.lastName,
      company: "Senya Senior High School",
      urlLink: `${url}/sensec/students/${foundStudent?.uniqueId}/enrollment/online/success`,
      linkText: "Visit Our Website",
      currentYear,
    },
    attachments: [
      {
        filename: "school-logo.png",
        path: path.resolve(__dirname, "assets/sensec-logo1.png"), // Path to school logo
        cid: "schoolLogo", // Same CID as in the HTML template
      },
    ],
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
};

const sendEnrollmentApprovalEmail = async ({ foundStudent }) => {
  const currentYear = new Date().getFullYear();
  const url = "http://192.168.178.22:2025";

  const transporter = createGMailTransporter();

  const handlebarOptions = {
    viewEngine: {
      extname: "hbs",
      partialsDir: path.resolve("./emails/forEnrollment/"),
      layoutsDir: path.resolve("./emails/forEnrollment/"),
      defaultLayout: "",
    },
    viewPath: path.resolve("./emails/forEnrollment/"),
    extName: ".hbs",
  };

  // use a template file with nodemailer
  transporter.use("compile", hbs(handlebarOptions));

  let mailTemplate = {
    from: `Senya Senior High School <${process.env.NODEMAILER_GMAIL}>`,
    to: foundStudent?.contactAddress?.email,
    subject: "Your Enrollment Status",
    template: "enrollmentApprovalEmail",
    context: {
      userImage: foundStudent?.personalInfo?.profilePicture.url,
      uniqueId: foundStudent?.uniqueId,
      firstName: foundStudent?.personalInfo?.firstName,
      lastName: foundStudent?.personalInfo?.lastName,
      company: "Senya Senior High School",
      urlLink: `${url}/sensec/students/${foundStudent?.uniqueId}/enrollment/online/success`,
      linkText: "Visit Our Website",
      currentYear,
    },
    attachments: [
      {
        filename: "school-logo.png",
        path: path.resolve(__dirname, "assets/sensec-logo1.png"), // Path to school logo
        cid: "schoolLogo", // Same CID as in the HTML template
      },
    ],
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
};

const studentEnrollmentApprovalSMS = async (req, res, next) => {
  const student = req?.enrollmentApprovalData?.studentFound;
  const admin = req?.enrollmentApprovalData?.adminFound;
  let body = `

Hello ${student?.personalInfo?.firstName},

CONGRATULATIONS TO YOU...

We're thankful once again for your enrolment into our school.
This message is to inform you that your enrolment has been approved, and you're now a student of SENYA SENIOR HIGH SCHOOL (SENSEC).
Click: "http://localhost:3000/sensec/students/placement_check" to check for your placement into our school.

Yours Sincerely,

${admin?.personalInfo?.firstName} ${admin?.personalInfo?.lastName}
Head of Administration,
Senya Senior High School.

`;
  twilioClient.messages
    .create({
      body: body,
      // to: "491784535757", // Text your number
      to: student?.contactAddress?.mobile, // Text your number
      from: process.env.TWILIO_NUMBER, // From a valid Twilio number
    })
    .then((message) => console.log(message.sid));

  const from = process.env.VONAGE_BRAND_NAME;
  const to = student?.contactAddress?.mobile;
  const text = body;

  twilioClient.messages
    .create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      body: body,
      to: "whatsapp:+4915759307163",
      // to: "whatsapp:+233241283018",
      // to: `whatsapp:${userInfo?.contactAddress?.mobile}`,
    })
    .then((message) => console.log(message.sid));

  next();
  // async function sendApprovedSMS() {
  //   await vonage.sms
  //     .send({ to, from, text })
  //     .then((resp) => {
  //       console.log("Message sent successfully");
  //       console.log(resp);
  //     })
  //     .catch((err) => {
  //       console.log("There was an error sending the messages.");
  //       console.error(err);
  //     });
  // }
  // sendApprovedSMS();
};
const userSignUpSMS = async (req, res, next) => {
  const userInfo = req?.newSignedUpUserData?.newSignedUpUser;
  const userPassword = req?.newSignedUpUserData?.password;
  const url = "http://192.168.178.22:2025";
  let body = `

Hello ${userInfo?.personalInfo?.firstName},

Thank you for signing up! We’re excited to have you on board and look forward to have a good experience with you.
Below are your login credentials:

Unique ID: ${userInfo?.uniqueId}
Username: ${userInfo?.userSignUpDetails?.userName}
Password: ${userPassword}

A verification link has been sent to your email. Kindly verify your account via your email to sign in to your account.
Please do not share your login credentials with anyone!

Thank you for your understanding. Click: ${url} to visit our website to know more about SENYA SENIOR HIGH SCHOOL (SENSEC).

Yours Sincerely,

Patrick Kenneford Annan
Head of Administration,
Senya Senior High School.

`;
  try {
    if (userInfo?.contactAddress?.mobile) {
      twilioClient.messages
        .create({
          body: body,
          // to: "491784535757", // Text your number
          to: userInfo?.contactAddress?.mobile, // Text your number
          from: process.env.TWILIO_NUMBER, // From a valid Twilio number
        })
        .then((message) => console.log(message.sid))
        .catch((err) => console.error("Error sending sms:", err));

      // twilioClient.messages.create({
      //   from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      //   body: body,
      //   to: "whatsapp:+4915759307163",
      //   // to: "whatsapp:+233241283018",
      //   // to: `whatsapp:${userInfo?.contactAddress?.mobile}`,
      // });
      // .then((message) => console.log(message.sid));
      //   const from = process.env.VONAGE_BRAND_NAME;
      //   const to = userInfo?.contactAddress?.mobile;
      //   const text = body;

      //   async function sendSMS() {
      //     await vonage.sms
      //       .send({ to, from, text })
      //       .then((resp) => {
      //         console.log("Message sent successfully");
      //         console.log(resp);
      //       })
      //       .catch((err) => {
      //         console.log("There was an error sending the messages.");
      //         console.error(err);
      //       });
      //   }
      //   sendSMS();
      next();
    } else {
      next();
    }
  } catch (error) {
    return res.status(500).json({
      errorMessage: {
        message: "Internal Server Error!",
      },
    });
  }
};

module.exports = {
  sendVerificationEmail,
  passwordResetRequestEmail,
  sendEnrollmentEmail,
  sendEnrollmentApprovalEmail,
  studentEnrollmentApprovalSMS,
  userSignUpSMS,
};
