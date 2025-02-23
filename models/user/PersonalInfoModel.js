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
    fullName: {
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
      // default: "",
      require: true,
    },
    nationality: {
      type: String,
      // default: "",
      require: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female"],
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
  },
  {
    timestamps: true,
  }
);
const PersonalInfo = mongoose.model("PersonalInfo", PersonalInfoSchema);

module.exports = PersonalInfo;
