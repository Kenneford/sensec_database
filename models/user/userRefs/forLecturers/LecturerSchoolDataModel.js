const mongoose = require("mongoose");

const { Schema } = mongoose;

const LecturerSchoolDataSchema = new Schema(
  {
    classLevels: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ClassLevel",
      },
    ],
    // students: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "User",
    //   },
    // ],
    teachingSubjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
      },
    ],
    isClassLevelTeacher: {
      type: Boolean,
      default: false,
    },
    classSections: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ClassLevelSection",
      },
    ],
    classLevelHandling: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClassLevelSection",
    },
    program: { type: mongoose.Schema.Types.ObjectId, ref: "Program" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);
const LecturerSchoolData = mongoose.model(
  "LecturerSchoolData",
  LecturerSchoolDataSchema
);

module.exports = LecturerSchoolData;
