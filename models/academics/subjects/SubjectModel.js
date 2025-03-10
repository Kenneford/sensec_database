const mongoose = require("mongoose");
const ElectiveSubject = require("./electiveSubjectModel/ElectiveSubjectModel");
const CoreSubject = require("./coreSubjectModel/CoreSubjectModel");
const SubjectInfoExtend = require("./electiveSubjectModel/SubjectInfoExtendModel");

const { Schema } = mongoose;

const subjectSchema = new Schema(
  {
    subjectName: {
      type: String,
      required: true,
    },
    teachers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    currentTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    subjectInfo: {
      type: SubjectInfoExtend.schema,
    },
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
    previouslyUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    previouslyUpdateDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Subject = mongoose.model("Subject", subjectSchema);

module.exports = Subject;
