const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema(
  {
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
    programmes: [
      {
        program: { type: mongoose.Schema.Types.ObjectId, required: true },
        type: {
          type: String,
          enum: ["Program", "ProgramDivision"],
          required: true,
        },
      },
    ],
    lecturer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "StudentReport",
      },
    ],
    lecturerRemark: {
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
const Report = mongoose.model("Report", ReportSchema);

module.exports = Report;
