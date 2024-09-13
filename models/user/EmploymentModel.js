const mongoose = require("mongoose");

const { Schema } = mongoose;

const employmentSchema = new Schema(
  {
    positionHolding: {
      type: String,
      // default: "",
    },
    employmentProcessedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    employmentProcessedDate: {
      type: Date,
    },
    employmentApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    employmentApprovedDate: {
      type: Date,
      // default: "",
    },
    employmentStatus: {
      type: String,
      // default: "",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);
const Employment = mongoose.model("Employment", employmentSchema);

module.exports = Employment;
