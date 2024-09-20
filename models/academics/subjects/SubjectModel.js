const mongoose = require("mongoose");
const ElectiveSubject = require("./electiveSubjectModel/ElectiveSubjectModel");
const CoreSubject = require("./coreSubjectModel/CoreSubjectModel");

const { Schema } = mongoose;

const subjectSchema = new Schema(
  {
    subjectName: {
      type: String,
      required: true,
    },
    // classLevel: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "ClassLevel",
    //   required: true,
    // },
    // currentTeacher: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "User",
    //   // required: true,
    // },
    teachers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    electiveSubInfo: {
      type: ElectiveSubject.schema,
    },
    coreSubInfo: {
      type: CoreSubject.schema,
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
    // duration: {
    //   type: String,
    //   // required: true,
    //   default: "3 months",
    // },
  },
  { timestamps: true }
);

const Subject = mongoose.model("Subject", subjectSchema);

module.exports = Subject;
