const mongoose = require("mongoose");

const { Schema } = mongoose;

const adminsActionDataSchema = new Schema(
  {
    academicTerms: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AcademicTerm",
      },
    ],
    academicYears: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AcademicYear",
      },
    ],
    programs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Program",
      },
    ],
    oldStudentsGroups: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "OldStudents",
      },
    ],
    classLevels: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ClassLevel",
      },
    ],
    classLevelSections: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ClassLevelSection",
      },
    ],
    houses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "House",
      },
    ],
    batches: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Batch",
      },
    ],
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
      },
    ],
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    teachers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    nTStaffs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    registeredStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);
const AdminActionsData = mongoose.model(
  "AdminActionsData",
  adminsActionDataSchema
);

module.exports = AdminActionsData;
