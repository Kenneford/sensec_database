const nodemailer = require("nodemailer");

//Email from school to user
const createMailTransporter = () => {
  let transporter = nodemailer.createTransport({
    service: "hotmail",
    auth: {
      user: process.env.NODEMAILER_EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  return transporter;
};

//Email from user to school
const createGMailTransporter = () => {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.NODEMAILER_GMAIL,
      pass: process.env.NODEMAILER_PASSWORD,
    },
  });
  return transporter;
};

module.exports = { createMailTransporter, createGMailTransporter };
