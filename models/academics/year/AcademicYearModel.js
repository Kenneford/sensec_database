const mongoose = require("mongoose");

const academicYearSchema = new mongoose.Schema(
  {
    yearRange: {
      type: String,
      default: function () {
        return `${this.fromYear}-${this.toYear}`;
      },
    },
    fromYear: {
      type: String,
      required: true,
    },
    toYear: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: function () {
        return `This is ${this.yearRange.replace(/-/g, "/")} academic year`;
      },
    },
    isCurrent: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // students: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "User",
    //   },
    // ],
    // teachers: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "User",
    //   },
    // ],
  },
  {
    timestamps: true,
  }
);
const AcademicYear = mongoose.model("AcademicYear", academicYearSchema);
module.exports = AcademicYear;
