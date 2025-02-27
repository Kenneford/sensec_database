const mongoose = require("mongoose");
const PlacementBatchesModelSchema = new mongoose.Schema(
  {
    year: {
      type: String,
      require: true,
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PlacementStudent",
      },
    ],
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // required: true,
    },
    isAutoCreated: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // required: true,
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // required: true,
    },
  },
  {
    timestamps: true,
  }
);

const PlacementBatch = mongoose.model(
  "PlacementBatch",
  PlacementBatchesModelSchema
);

module.exports = PlacementBatch;
