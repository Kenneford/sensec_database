const mongoose = require("mongoose");

const { Schema } = mongoose;

const programSchema = new Schema(
  {
    name: {
      type: String,
      // required: true,
    },
    description: {
      type: String,
      default: function () {
        return `This is ${this.name} Programme`;
      },
    },
    programImage: {
      public_id: {
        type: String,
        // required: true,
      },
      url: {
        type: String,
        // required: true,
      },
    },
    duration: {
      type: String,
      default: "3 years",
    },
    // created automatically
    code: {
      type: String,
      default: function () {
        return (
          this.name
            .split(" ")
            .map((name) => name[0])
            .join("")
            .toUpperCase() +
          Math.floor(10 + Math.random() * 90) +
          Math.floor(10 + Math.random() * 90)
        );
      },
    },
    isProgram: {
      type: String,
      default: true,
    },
    aboutProgram: {
      type: String,
    },
    //we will push the teachers that are in charge of the program
    teachers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
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
    programDivisions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProgramDivision",
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
const Program = mongoose.model("Program", programSchema);

module.exports = Program;
