const mongoose = require("mongoose");

const { Schema } = mongoose;

const TeacherStatusSchema = new Schema(
  {
    isTeacher: {
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
const TeacherExtendedStatus = mongoose.model(
  "TeacherExtendedStatus",
  TeacherStatusSchema
);

module.exports = TeacherExtendedStatus;
