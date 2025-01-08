const mongoose = require("mongoose");

const AcademicGradeSchema = new mongoose.Schema(
  {
    minScore: {
      type: Number,
    },
    maxScore: {
      type: Number,
    },
    grade: {
      type: String,
    },
    remark: {
      type: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
const AcademicGrade = mongoose.model("AcademicGrade", AcademicGradeSchema);

module.exports = AcademicGrade;
