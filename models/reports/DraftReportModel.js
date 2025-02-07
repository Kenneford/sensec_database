const mongoose = require("mongoose");

const DraftReportSchema = new mongoose.Schema(
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
        programId: { type: mongoose.Schema.Types.ObjectId, required: true },
        nameOfProgram: {
          type: String,
        },
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
    students: {
      type: Array,
    },
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
const DraftReport = mongoose.model("DraftReport", DraftReportSchema);

module.exports = DraftReport;
