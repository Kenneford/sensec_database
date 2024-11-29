const mongoose = require("mongoose");

const { Schema } = mongoose;

const programDivisionsSchema = new Schema(
  {
    programName: {
      type: String,
      // required: true,
    },
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
    },
    divisionName: {
      type: String,
      // required: true,
    },
    description: {
      type: String,
      default: function () {
        return `This is a division programme under ${this.programName}`;
      },
    },
    code: {
      type: String,
      default: function () {
        return (
          this.divisionName
            .split(" ")
            .map((name) => name[0])
            .join("")
            .toUpperCase() +
          "-" +
          Math.floor(10 + Math.random() * 90) +
          Math.floor(10 + Math.random() * 90)
        );
      },
    },
    isDivisionProgram: {
      type: Boolean,
      default: true,
    },
    aboutProgram: {
      type: String,
    },
    //we will push the teachers that are in charge of the program
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
    //I will push the subjects that are in the program when the program is created
    electiveSubjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
      },
    ],
    optionalElectiveSubjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const ProgramDivision = mongoose.model(
  "ProgramDivision",
  programDivisionsSchema
);

module.exports = ProgramDivision;
