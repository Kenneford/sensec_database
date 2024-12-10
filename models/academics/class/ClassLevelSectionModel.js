const mongoose = require("mongoose");

const { Schema } = mongoose;

const classLevelSectionSchema = new Schema(
  {
    sectionName: {
      type: String,
      required: true,
    },
    classLevelName: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      default: function () {
        return (
          this.sectionName
            .split(" ")
            .map((name) => name[0])
            .join("") +
          "/" +
          this.classLevelName
            .split(" ")
            .join("")
            .split(" ")
            .map((name) => name[5])
            .join("") +
          this.classLevelName
            .split(" ")
            .join("")
            .split(" ")
            .map((name) => name[6])
            .join("") +
          this.classLevelName
            .split(" ")
            .join("")
            .split(" ")
            .map((name) => name[7])
            .join("")
        );
      },
    },
    description: {
      type: String,
      default: function () {
        return `${this.classLevelName} ${this.sectionName} Class`;
      },
    },
    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
    },
    divisionProgram: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProgramDivision",
      // required: true,
    },
    classLevelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClassLevel",
    },
    currentTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    previousTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // teachers: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "User",
    //   },
    // ],
    // students: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "User",
    //   },
    // ],
    // attendance: {
    //   date: {
    //     type: Date,
    //     // required: true
    //   },
    //   studentsAttended: [{ type: mongoose.Schema.ObjectId, ref: "Student" }],
    // },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    lecturerAssignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    previousLecturerRemovedBy: {
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

const ClassLevelSection = mongoose.model(
  "ClassLevelSection",
  classLevelSectionSchema
);

module.exports = ClassLevelSection;
