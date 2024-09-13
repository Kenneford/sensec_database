const mongoose = require("mongoose");

const { Schema } = mongoose;

const adminStatusSchema = new Schema(
  {
    isAdmin: {
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
const AdminExtendedStatus = mongoose.model(
  "AdminExtendedStatus",
  adminStatusSchema
);

module.exports = AdminExtendedStatus;
