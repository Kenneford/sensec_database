const mongoose = require("mongoose");

const { Schema } = mongoose;

const studentAttendanceSchema = new Schema(
  {
    classLevelSection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClassLevelSection",
    },
    student: { type: mongoose.Schema.ObjectId, ref: "User" },
    lecturer: { type: mongoose.Schema.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["Present", "Absent"],
      required: true,
    },
    date: {
      type: String,
      default: function () {
        const date = new Date();
        // Specify the format you want
        const options = { year: "numeric", month: "2-digit", day: "2-digit" };
        const formatter = new Intl.DateTimeFormat("en-GB", options); // en-GB for day/month/year

        // console.log(formatter.format(date)); // Output: 22/01/2025
        return formatter.format(date);
        // return new Date().toLocaleDateString();
      },
      // required: true
    },
    dayOfTheWeek: {
      type: String,
      default: function () {
        const date = new Date();
        const options = { weekday: "long" };
        const currentDayOfWeek = date.toLocaleString("en-US", options);
        return currentDayOfWeek;
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
    semester: {
      type: String,
    },
    year: {
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
  { timestamps: true }
);
const StudentAttendance = mongoose.model(
  "StudentAttendance",
  studentAttendanceSchema
);

module.exports = StudentAttendance;
