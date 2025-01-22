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
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    teachingSubjects: {
      electives: [
        {
          subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
          classLevel: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ClassLevel",
          },
          program: { type: mongoose.Schema.Types.ObjectId, ref: "Program" },
          programDivision: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ProgramDivision",
          },
          students: [
            {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
            },
          ],
        },
      ],
      cores: [
        {
          subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
          classLevel: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ClassLevel",
          },
          programmes: [
            {
              program: { type: mongoose.Schema.Types.ObjectId, required: true },
              type: {
                type: String,
                enum: ["Program", "ProgramDivision"],
                required: true,
              },
            },
          ],
          students: [
            {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
            },
          ],
        },
      ],
    },
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
