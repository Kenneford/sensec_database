const mongoose = require("mongoose");
// const { v4: uuidv4 } = require("uuid");

const parentsSchema = new mongoose.Schema(
  {
    fatherName: { type: String, max: 150, default: "" },
    motherName: { type: String, max: 150, default: "" },
    fathersOccupation: { type: String, max: 150, default: "" },
    mothersOccupation: { type: String, max: 150, default: "" },
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
const StudentParent = mongoose.model("StudentParent", parentsSchema);
module.exports = StudentParent;
