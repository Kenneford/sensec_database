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
    surname: {
      type: String,
      default: "",
      // require: true,
    },
    otherNames: {
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
    jHSAttended: {
      type: String,
      // required: true,
    },
    jHSIndexNo: {
      type: String,
      // required: true,
      unique: true,
    },
    placementNumber: {
      type: String,
      unique: true,
      default: function () {
        return "PN" + "-" + Math?.floor(1000 + Math?.random() * 9000);
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
    dateOfBirth: {
      type: Date,
    },
    trackID: {
      type: String,
    },
    sMSContact: {
      type: String,
    },
    generatedIndexNumber: {
      type: String,
      default: function () {
        return (
          this?.jHSIndexNo +
          this?.yearGraduated?.split(" ")?.map((year) => year[2]) +
          this?.yearGraduated?.split(" ")?.map((year) => year[3])
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
