const mongoose = require("mongoose");

const BatchesModelSchema = new mongoose.Schema(
  {
    yearRange: {
      type: String,
      default: function () {
        return `${this.fromYear}-${this.toYear}`;
      },
    },
    fromYear: {
      type: String,
      required: true,
    },
    toYear: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: function () {
        return `${this.yearRange} academic batch`;
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
      required: true,
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const Batch = mongoose.model("Batch", BatchesModelSchema);

module.exports = Batch;
