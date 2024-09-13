const mongoose = require("mongoose");

const { Schema } = mongoose;

const signUpSchema = new Schema(
  {
    userName: {
      type: String,
      //   unique: true,
    },
    password: {
      type: String,
      select: false,
      min: 6,
    },
    passwordResetRequest: {
      type: Boolean,
      default: false,
    },
    chatPassword: {
      type: String,
      select: false,
      min: 6,
    },
    chatPasswordResetRequest: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
const SignUpInfo = mongoose.model("SignUpInfo", signUpSchema);

module.exports = SignUpInfo;
