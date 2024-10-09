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
  const verificationData = req?.userVerificationData;
  // Find user's verification data
  const userVerificationData = await UserVerificationData.findOne({
    userId: verificationData?.userId,
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

const sendEnrollmentEmail = async (req, res, next) => {
  const currentUser = req.user;
  const student = req?.enrollmentApprovalData?.studentFound;
  let body = `
    <div
      style="
        margin-bottom: 1rem;
        padding: 2rem;
        width: 100%;
        padding-bottom: 2rem;
        height: 55vh;
        fontSize: 1.2rem;
        border: 1px solid #ccc;
        border-radius: .4rem;"
    >
    <img src=${student?.personalInfo?.profilePicture.url} alt="User Picture" 
      style="
        width: 4rem;
        height: 4rem;
        object-fit: cover;
        border-radius: .4rem;
      "
    />
  <h4>Hello ${student?.personalInfo?.firstName},</h4>
  <h1 style="
    color: #696969;
    height: 4rem;
    object-fit: cover;
    border-radius: .4rem;
  ">Congratulations To You...</h1>
  <p>We're thankful once again for your enrolment into our school.</p>
  <p>This mail is to inform you that your enrolment has been approved, and you're now a student of SENYA SENIOR HIGH SCHOOL (SENSEC).
  <p>You can also visit our website <a href="http://localhost:3000/sensec/students/placement_check">here</a> to check for your placement into our school.</p>
  <p>Yours Sincerely,</p>
  <h4 style="font-weight: 600; padding-bottom: -.5rem">${currentUser?.personalInfo?.firstName} ${currentUser?.personalInfo?.lastName}</h4>
  <p style="font-weight: 600; padding-bottom: -.5rem">Head of Administration,
  <br>
  Senya Senior Secondary School.</p>
    </div>
  `;
  const transporter = createMailTransporter();
  // const transporter = createGMailTransporter();
  let mailTemplate = {
    from: `Sensec <${process.env.NODEMAILER_EMAIL}>`,
    to: student?.contactAddress?.email,
    subject: "Your Enrolment Status",
    html: body,
  };
  transporter.sendMail(mailTemplate, (error, info) => {
    if (error) {
      console.log(error);
      return res.status(400).json({
        errorMessage: {
          message: "Failed to send enrollment email to student!",
        },
      });
    } else {
      console.log("Your enrolment status has been sent to your email!");
      next();
      // res.status(200).json({
      //   successMessage: "Enrollment email sent to student!",
      // });
    }
  });
};

const studentEnrollmentApprovalSMS = (req, res, next) => {
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
  client.messages
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

  client.messages
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

module.exports = {
  sendVerificationEmail,
  passwordResetRequestEmail,
  sendEnrollmentEmail,
  studentEnrollmentApprovalSMS,
};
