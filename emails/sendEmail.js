const {
  createMailTransporter,
  createGMailTransporter,
} = require("./createMailTransporter");
const hbs = require("nodemailer-express-handlebars");
const path = require("path");
const { format } = require("date-fns");
const nodemailer = require("nodemailer");

// Text message engine

const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = require("twilio")(accountSid, authToken, {
  autoRetry: true,
  maxRetries: 3,
});
const { Vonage } = require("@vonage/server-sdk");
const User = require("../models/user/UserModel");
const vonage = new Vonage({
  apiKey: process.env.VONAGE_API_KEY,
  apiSecret: process.env.VONAGE_API_SECRET,
});

const UserVerificationData = require("../models/user/userRefs/signUpModel/UserVerificationModel");
const AcademicTerm = require("../models/academics/term/AcademicTermModel");
const ClassLevelSection = require("../models/academics/class/ClassLevelSectionModel");
const Program = require("../models/academics/programmes/ProgramsModel");
const ProgramDivision = require("../models/academics/programmes/divisions/ProgramDivisionModel");

const sendVerificationEmail = async (req, res, next) => {
  // Get verification data
  const verificationData = req?.newSignedUpUserData?.verificationData;
  // Get user's data
  const userFound = req?.newSignedUpUserData?.newSignedUpUser;
  const userPassword = req?.newSignedUpUserData?.password;
  try {
    // Find user's verification data
    const userVerificationData = await UserVerificationData.findOne({
      userId: verificationData?.userId,
    });
    if (userFound?.contactAddress?.email) {
      if (userVerificationData) {
        const currentYear = new Date().getFullYear();
        // Change url base on current environment mode
        const url = process.env.EMAIL_URL;

        const transporter = createGMailTransporter();

        const handlebarOptions = {
          viewEngine: {
            extname: "hbs",
            partialsDir: path.resolve("./emails/forSignUpVerification/"),
            layoutsDir: path.resolve("./emails/forSignUpVerification/"),
            defaultLayout: "",
          },
          viewPath: path.resolve("./emails/forSignUpVerification/"), // Path to the templates
          extName: ".hbs", // Extension for templates
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
      errorMessage: {
        message: [`Internal Server Error! ${error?.message}`],
      },
    });
  }
};
// User request password reset
async function passwordResetRequestEmail(req, res, next) {
  const user = req?.data?.userFound;
  const token = req?.data?.token;
  const url = process.env.EMAIL_URL;
  let body = `<h4>Hello ${user?.userSignUpDetails?.userName},</h4><p>To reset your password, kindly <a href="${url}/sensec/password/${user?.uniqueId}/${user?._id}/${token}/reset"> click here</a> to do so.</p>`;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.NODEMAILER_GMAIL,
      pass: process.env.NODEMAILER_PASSWORD,
    },
  });
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
// User password reset success email
const passwordResetSuccessEmail = async ({ userFound, password }) => {
  const url = process.env.EMAIL_URL;
  let body = `
<h4>Hello ${userFound?.userSignUpDetails?.userName},</h4><p>Your password was changed to ${password}. Kindly <a href="${url}/sensec/contact"> click here</a> to contact our support team if you didn't take this action.</p>
<p>Best regards,</p>
<p style="font-weight: 600; padding-bottom: -.5rem">Support Team,
<br>
Senya Senior High School.</p>
`;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.NODEMAILER_GMAIL,
      pass: process.env.NODEMAILER_PASSWORD,
    },
  });
  let mailTemplate = {
    from: `Sensec <${process.env.NODEMAILER_EMAIL}>`,
    to: userFound?.contactAddress?.email,
    subject: "Password Reset Successful",
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
    }
  });
};

const sendEnrollmentEmail = async ({ foundStudent }) => {
  const currentYear = new Date().getFullYear();
  const url = process.env.EMAIL_URL;
  // const url = "https://official-sensec-website.onrender.com";

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
      fullName: foundStudent?.personalInfo?.fullName,
      company: "Senya Senior High School",
      urlLink: `${url}/sensec/homepage`,
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
  const url = process.env.EMAIL_URL;
  // const url = "https://official-sensec-website.onrender.com";
  try {
    const studentLecturer = await User.findOne({
      "lecturerSchoolData.classLevelHandling":
        foundStudent?.studentSchoolData?.currentClassLevelSection,
    });
    //Find student's Program✅
    const mainProgramFound = await Program.findOne({
      _id: foundStudent?.studentSchoolData?.program?.programId,
    });
    const divisionProgramFound = await ProgramDivision.findOne({
      _id: foundStudent?.studentSchoolData?.program?.programId,
    });
    //Find student's Class
    const studentClass = await ClassLevelSection.findOne({
      _id: foundStudent?.studentSchoolData?.currentClassLevelSection,
    });
    const nextSemester = await AcademicTerm.findOne({
      isNext: true,
    });
    const transporter = createGMailTransporter();

    const handlebarOptions = {
      viewEngine: {
        extname: "hbs",
        partialsDir: path.resolve("./emails/forEnrollment/"),
        layoutsDir: path.resolve("./emails/forEnrollment/"),
        defaultLayout: "",
        helpers: {
          // Define a custom helper for date formatting
          formatDate: (date, dateFormat) => {
            try {
              return format(new Date(date), dateFormat || "yyyy-MM-dd");
            } catch (err) {
              console.error("Error formatting date:", err);
              return date; // Return the original date if formatting fails
            }
          },
        },
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
        studentProgram: mainProgramFound
          ? mainProgramFound?.name
          : divisionProgramFound
          ? divisionProgramFound?.divisionName
          : "Unknown",
        studentClass: studentClass ? studentClass?.label : "Unknown",
        studentLecturer: studentLecturer?.personalInfo
          ? studentLecturer?.personalInfo?.fullName
          : "Unknown",
        studentLecturerGender:
          studentLecturer?.personalInfo?.gender === "Male" ? "Mr." : "Mrs.",
        nextSemester: nextSemester?.from,
        userImage: foundStudent?.personalInfo?.profilePicture.url,
        uniqueId: foundStudent?.uniqueId,
        fullName: foundStudent?.personalInfo?.fullName,
        company: "Senya Senior High School",
        urlLink: `${url}/sensec/students/enrollment/online/${foundStudent?.uniqueId}/success/Overview`,
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
        // return res
        //   .status(400)
        //   .json({ errorMessage: { message: "Failed to send email." } });
      } else {
        console.log("Verification email sent!");
        next();
      }
    });
  } catch (error) {
    console.log(error);
  }
};

const studentEnrollmentApprovalSMS = async (req, res, next) => {
  const student = req?.enrollmentApprovalData?.studentFound;
  const admin = req?.enrollmentApprovalData?.adminFound;
  const url = process.env.EMAIL_URL;
  // const url = "https://official-sensec-website.onrender.com";
  let body = `

Hello ${student?.personalInfo?.firstName},

CONGRATULATIONS TO YOU...

We're thankful once again for your enrollment into our school.
This message is to inform you that your enrolment has been approved, and you're now a student of SENYA SENIOR HIGH SCHOOL (SENSEC).
Click: "${url}/sensec/students/placement_check" to check for your enrollment data.

Unique ID: ${foundStudent?.uniqueId}
Course: ${foundStudent?.studentSchoolData?.program?.name}
Class: ${foundStudent?.studentSchoolData?.currentClassLevelSection?.label}
Class Lecturer: ${foundStudent?.studentSchoolData?.currentClassTeacher}
Start Date: 22.10.2024
Duration: 3 Years

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
  const url = process.env.EMAIL_URL;
  // const url = "https://official-sensec-website.onrender.com";
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

const sendEmploymentEmail = async ({ foundUser }) => {
  console.log(foundUser);

  const currentYear = new Date().getFullYear();
  const url = process.env.EMAIL_URL;
  // const url = "https://official-sensec-website.onrender.com";
  try {
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
      to: foundUser?.contactAddress?.email,
      subject: "Your Employment Status",
      template: "employmentEmail",
      context: {
        userImage: foundUser?.personalInfo?.profilePicture.url,
        uniqueId: foundUser?.uniqueId,
        firstName: foundUser?.personalInfo?.firstName,
        lastName: foundUser?.personalInfo?.lastName,
        company: "Senya Senior High School",
        urlLink: `${url}/sensec/homepage`,
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
        console.log("Error sending email:", error?.message);
        // return res
        //   .status(400)
        //   .json({ errorMessage: { message: "Failed to send email." } });
      } else {
        console.log("Employment email sent!");
        // next();
      }
    });
  } catch (error) {
    console.log(error);
  }
};
const sendEmploymentApprovalEmail = async ({ employeeFound }) => {
  console.log(employeeFound);

  const currentYear = new Date().getFullYear();
  const url = process.env.EMAIL_URL;
  // const url = "https://official-sensec-website.onrender.com";
  try {
    const classHandling = await ClassLevelSection.findOne({
      _id: employeeFound?.lecturerSchoolData?.classLevelHandling,
    });
    //Find lecturer's Program✅
    const programFound = await Program.findOne({
      _id: employeeFound?.lecturerSchoolData?.program,
    });
    const transporter = createGMailTransporter();

    const handlebarOptions = {
      viewEngine: {
        extname: "hbs",
        partialsDir: path.resolve("./emails/forEnrollment/"),
        layoutsDir: path.resolve("./emails/forEnrollment/"),
        defaultLayout: "",
        helper: { classHandling },
      },
      viewPath: path.resolve("./emails/forEnrollment/"),
      extName: ".hbs",
    };

    // use a template file with nodemailer
    transporter.use("compile", hbs(handlebarOptions));

    let mailTemplate = {
      from: `Senya Senior High School <${process.env.NODEMAILER_GMAIL}>`,
      to: employeeFound?.contactAddress?.email,
      subject: "Your Employment Status",
      template: "employmentApprovalEmail",
      context: {
        employeeFound,
        isLecturer: employeeFound.roles.includes("lecturer"),
        classHandling: classHandling
          ? classHandling?.label
          : "Not yet assigned!",
        userImage: employeeFound?.personalInfo?.profilePicture.url,
        uniqueId: employeeFound?.uniqueId,
        program: programFound?.name,
        firstName: employeeFound?.personalInfo?.firstName,
        lastName: employeeFound?.personalInfo?.lastName,
        company: "Senya Senior High School",
        urlLink: `${url}/sensec/homepage`,
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
        console.log("Error sending email:", error?.message);
        // return res
        //   .status(400)
        //   .json({ errorMessage: { message: "Failed to send email." } });
      } else {
        console.log("Employment email sent!");
        // next();
      }
    });
  } catch (error) {
    console.log(error);
  }
};
const employmentSMS = async ({ foundUser }) => {
  const url = process.env.EMAIL_URL;
  // const url = "https://official-sensec-website.onrender.com";
  try {
    let body = `

Hello ${foundUser?.personalInfo?.firstName},

This mail is to inform you that your employment process was successful, and you're on pending for final approval.
We're going to send you another mail with your employment details as soon as your employment is approved.
As you wait for your approval, you can also visit our website to know more about Senya Senior High School.
Click: ${url} to visit our website.

Thank you for joining our school!

Yours Sincerely,

Nicholas Afful,
Head of Administration,
Senya Senior High School.

`;
    twilioClient.messages
      .create({
        // to: "491784535757", // Text your number
        from: process.env.TWILIO_NUMBER, // From a valid Twilio number
        to: foundUser?.contactAddress?.mobile, // Text your number
        body: body,
      })
      .then((message) => {
        try {
          console.log(message.sid);
        } catch (error) {
          console.log(error);
        }
      });
  } catch (error) {
    console.log(error);
  }

  // const from = process.env.VONAGE_BRAND_NAME;
  // const to = foundUser?.contactAddress?.mobile;
  // const text = body;

  // twilioClient.messages
  //   .create({
  //     from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
  //     body: body,
  //     to: "whatsapp:+4915759307163",
  //     // to: "whatsapp:+233241283018",
  //     // to: `whatsapp:${userInfo?.contactAddress?.mobile}`,
  //   })
  //   .then((message) => console.log(message.sid));

  // next();
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
  passwordResetSuccessEmail,
  sendEnrollmentEmail,
  sendEnrollmentApprovalEmail,
  studentEnrollmentApprovalSMS,
  userSignUpSMS,
  sendEmploymentEmail,
  employmentSMS,
  sendEmploymentApprovalEmail,
};
