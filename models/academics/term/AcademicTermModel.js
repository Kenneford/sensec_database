const mongoose = require("mongoose");

const { Schema } = mongoose;

const academicTermSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: function () {
        return `This is the ${this.name} of the Academic Year`;
      },
    },
    from: {
      type: Date,
      required: true,
    },
    to: {
      type: Date,
      required: true,
    },
    // year: {
    //   type: String,
    //   required: true,
    // },
    duration: {
      type: String,
      required: true,
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
    status: {
      type: [String],
      enum: ["isCurrent", "isNext", "isPending"],
      default: ["isPending"],
    },
    isCurrent: {
      type: Boolean,
      default: false,
    },
    isNext: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const AcademicTerm = mongoose.model("AcademicTerm", academicTermSchema);

module.exports = AcademicTerm;
