const mongoose = require("mongoose");

const PersonalInfoSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    otherName: {
      type: String,
    },
    dateOfBirth: {
      type: Date,
      default: function () {
        return this.toISOString();
      },
    },
    placeOfBirth: {
      type: String,
      default: "",
      // require: true,
    },
    nationality: {
      type: String,
      default: "",
      // require: true,
    },
    gender: {
      type: String,
      default: "",
    },
    profilePicture: {
      public_id: {
        type: String,
        // required: true,
      },
      url: {
        type: String,
        // required: true,
      },
    },
    fullName: {
      type: String,
      default: function () {
        return (
          `${this.firstName ? this.firstName : ""}` +
          " " +
          `${this.otherName ? this.otherName : ""}` +
          " " +
          `${this.lastName ? this.lastName : ""}`
        );
      },
    },
    // createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);
const PersonalInfo = mongoose.model("PersonalInfo", PersonalInfoSchema);

module.exports = PersonalInfo;
