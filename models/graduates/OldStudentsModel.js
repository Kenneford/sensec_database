const mongoose = require("mongoose");
// const { v4: uuidv4 } = require("uuid");

const oldStudentsSchema = new mongoose.Schema(
  {
    yearOfGraduation: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: function () {
        return `This is ${this.yearOfGraduation} old students`;
      },
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
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
  },
  {
    timestamps: new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }),
  }
);

const OldStudents = mongoose.model("OldStudents", oldStudentsSchema);
module.exports = OldStudents;
