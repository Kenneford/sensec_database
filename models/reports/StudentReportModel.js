const mongoose = require("mongoose");

const StudentReportSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
    },
    student: { type: mongoose.Schema.ObjectId, ref: "User" },
    classLevel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClassLevel",
    },
    semester: {
      type: String,
    },
    date: {
      type: String,
      default: function () {
        const date = new Date();
        date.setMinutes(date.getMinutes() - date.getTimezoneOffset()); // Adjust for local time

        const day = String(date.getDate()).padStart(2, "0"); // Ensure 2-digit day
        const month = String(date.getMonth() + 1).padStart(2, "0"); // Ensure 2-digit month
        const year = date.getFullYear();

        return `${day}/${month}/${year}`; // Format: "DD/MM/YYYY"
      },
      // required: true
    },
    time: {
      type: String,
      default: function () {
        return new Date().toLocaleTimeString();
      },
      //   default: new Date().toLocaleTimeString(),
      // required: true
    },
    year: {
      type: String,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
    },
    classScore: {
      type: Number,
    },
    examScore: {
      type: Number,
    },
    totalScore: {
      type: Number,
    },
    grade: {
      type: String,
    },
    remark: {
      type: String,
    },
    lecturer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    lecturerRemark: {
      type: String,
    },
    headOfAcademicsRemark: {
      type: String,
    },
    headmasterRemark: {
      type: String,
    },
    previouslyUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);
const StudentReport = mongoose.model("StudentReport", StudentReportSchema);

module.exports = StudentReport;
