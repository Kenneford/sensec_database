const mongoose = require("mongoose");

const StudentReportSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
    },
    classLevel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClassLevel",
    },
    semester: {
      type: String,
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
