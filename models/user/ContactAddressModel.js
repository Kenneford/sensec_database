const mongoose = require("mongoose");

const { Schema } = mongoose;

const ContactAddressSchema = new Schema(
  {
    homeTown: {
      type: String,
      max: 50,
      default: "",
    },
    district: {
      type: String,
      // require: true,
    },
    region: {
      type: String,
      max: 50,
      default: "",
    },
    currentCity: {
      type: String,
      max: 50,
      default: "",
    },
    residentialAddress: {
      type: String,
      max: 150,
      default: "",
    },
    gpsAddress: {
      type: String,
      max: 150,
      default: "",
    },
    mobile: {
      type: String,
      max: 50,
      default: "",
    },
    email: {
      type: String,
      default: "",
      max: 50,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);
const ContactAddress = mongoose.model("ContactAddress", ContactAddressSchema);

module.exports = ContactAddress;
