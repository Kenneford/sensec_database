const mongoose = require("mongoose");

const { Schema } = mongoose;

const headmasterStatusSchema = new Schema(
  {
    isHeadmaster: {
      type: Boolean,
      default: false,
    },
    isStaff: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
const HeadmasterExtendedStatus = mongoose.model(
  "HeadmasterExtendedStatus",
  headmasterStatusSchema
);

module.exports = HeadmasterExtendedStatus;
