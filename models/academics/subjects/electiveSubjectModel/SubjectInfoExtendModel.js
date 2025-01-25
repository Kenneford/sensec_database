const mongoose = require("mongoose");

const { Schema } = mongoose;

const SubjectInfoExtendSchema = new Schema(
  {
    program: {
      programId: {
        type: mongoose.Schema.Types.ObjectId,
        // required: true
      },
      type: {
        type: String,
        enum: ["Program", "ProgramDivision"],
        // required: true,
      },
    },
    // divisionProgramId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "ProgramDivision",
    // },
    isElectiveSubject: {
      type: Boolean,
      default: false,
    },
    isCoreSubject: {
      type: Boolean,
      default: false,
    },
    isOptional: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const SubjectInfoExtend = mongoose.model(
  "SubjectInfoExtend",
  SubjectInfoExtendSchema
);

module.exports = SubjectInfoExtend;
