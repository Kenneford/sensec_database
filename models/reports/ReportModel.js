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
