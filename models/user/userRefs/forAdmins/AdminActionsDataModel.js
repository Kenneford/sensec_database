const mongoose = require("mongoose");

const { Schema } = mongoose;

const adminsActionDataSchema = new Schema(
  {
    academicTermsCreated: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AcademicTerm",
      },
    ],
    academicYearsCreated: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AcademicYear",
      },
    ],
    programsCreated: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Program",
      },
    ],
    oldStudentsGroupsCreated: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "OldStudents",
      },
    ],
    classLevelsCreated: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ClassLevel",
      },
    ],
    classLevelSectionsCreated: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ClassLevelSection",
      },
    ],
    housesCreated: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "House",
      },
    ],
    placementBatchesCreated: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PlacementBatch",
      },
    ],
    batchesCreated: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Batch",
      },
    ],
    subjectsCreated: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
      },
    ],
    employmentsApproved: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    employmentsRejected: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    studentsApproved: [
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
