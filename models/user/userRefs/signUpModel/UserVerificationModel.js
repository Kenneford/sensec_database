const mongoose = require("mongoose");
const userVerificationDataSchema = new mongoose.Schema({
  userId: {
    type: String,
  },
  emailToken: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
  },
  expiryDate: {
    type: Date,
  },
});

const UserVerificationData = mongoose.model(
  "UserVerificationData",
  userVerificationDataSchema
);

module.exports = UserVerificationData;
