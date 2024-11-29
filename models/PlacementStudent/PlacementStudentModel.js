const mongoose = require("mongoose");
const placementStudentsModelSchema = new mongoose.Schema(
  {
    sN: {
      type: Number,
      // require: true,
    },
    boardingStatus: {
      type: String,
      default: "",
      // require: true,
    },
    firstName: {
      type: String,
      default: "",
      // require: true,
    },
    lastName: {
      type: String,
      default: "",
      // require: true,
    },
    fullName: {
      type: String,
      default: "",
      // require: true,
    },
    otherName: {
      type: String,
      // required: true,
    },
    gender: {
      type: String,
      // required: true,
    },
    yearGraduated: {
      type: String,
      // required: true,
    },
    jhsAttended: {
      type: String,
      // required: true,
    },
    jhsIndexNo: {
      type: String,
      // required: true,
      unique: true,
    },
    placementNumber: {
      type: String,
      unique: true,
      default: function () {
        return (
          "PN" +
          "-" +
          Math?.floor(1000 + Math?.random() * 9000) +
          this?.fullName
            ?.split(" ")
            ?.map((name) => name[0])
            .join("")
        );
      },
    },
    placementVerified: {
      type: Boolean,
      default: false,
    },
    enrolled: {
      type: Boolean,
      default: false,
    },
    isGraduated: {
      type: Boolean,
      default: false,
    },
    dateOfBirth: {
      type: Date,
    },
    trackID: {
      type: String,
    },
    smsContact: {
      type: String,
    },
    generatedIndexNumber: {
      type: String,
      default: function () {
        return (
          this?.jhsIndexNo +
          this?.fullName
            ?.split(" ")
            ?.map((name) => name[0])
            .join("")
        );
      },
    },
    programme: {
      type: String,
    },
    aggregateOfBestSix: {
      type: Number,
    },
    enrollmentId: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const PlacementStudent = mongoose.model(
  "PlacementStudent",
  placementStudentsModelSchema
);

module.exports = PlacementStudent;
