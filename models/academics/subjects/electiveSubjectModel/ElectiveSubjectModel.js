const mongoose = require("mongoose");

const { Schema } = mongoose;

const electiveSubjectSchema = new Schema(
  {
    // nameOfProgram: {
    //   type: String,
    //   required: true,
    // },
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      required: true,
    },
    divisionProgramId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProgramDivision",
    },
    isElectiveSubject: {
      type: Boolean,
      default: true,
    },
    isOptional: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const ElectiveSubject = mongoose.model(
  "ElectiveSubject",
  electiveSubjectSchema
);

module.exports = ElectiveSubject;
