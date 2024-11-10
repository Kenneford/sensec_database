const mongoose = require("mongoose");

const { Schema } = mongoose;

const LecturerStatusSchema = new Schema(
  {
    isLecturer: {
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
const LecturerExtendedStatus = mongoose.model(
  "LecturerExtendedStatus",
  LecturerStatusSchema
);

module.exports = LecturerExtendedStatus;
