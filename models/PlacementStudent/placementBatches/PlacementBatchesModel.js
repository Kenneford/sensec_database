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
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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

const PlacementBatch = mongoose.model(
  "PlacementBatch",
  PlacementBatchesModelSchema
);

module.exports = PlacementBatch;
