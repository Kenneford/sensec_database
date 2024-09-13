const mongoose = require("mongoose");

const { Schema } = mongoose;

const NTStaffExtendedStatusSchema = new Schema(
  {
    isNTStaff: {
      type: Boolean,
      default: false,
    },
    isStaff: {
      type: Boolean,
      default: false,
    },
    jobDescription: {
      type: String,
    },
  },
  { timestamps: true }
);
const NTStaffExtendedStatus = mongoose.model(
  "NTStaffExtendedStatus",
  NTStaffExtendedStatusSchema
);

module.exports = NTStaffExtendedStatus;
