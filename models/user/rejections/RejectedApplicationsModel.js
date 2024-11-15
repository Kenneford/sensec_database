const mongoose = require("mongoose");

const { Schema } = mongoose;

const RejectedApplicationSchema = new Schema(
  {
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);
const RejectedApplication = mongoose.model(
  "RejectedApplication",
  RejectedApplicationSchema
);

module.exports = RejectedApplication;
