const mongoose = require("mongoose");
// const { v4: uuidv4 } = require("uuid");

const guardianSchema = new mongoose.Schema(
  {
    guardianName: { type: String, max: 150 },
    // guardianOccupation: { type: String, max: 150 },
    address: {
      type: String,
      max: 150,
      default: "",
    },
    email: { type: String, max: 50, default: "" },
    phoneNumber: { type: String, max: 20, default: "" },
  },
  {
    timestamps: true,
  }
);

const StudentGuardian = mongoose.model("StudentGuardian", guardianSchema);
module.exports = StudentGuardian;
