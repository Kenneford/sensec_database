const mongoose = require("mongoose");
const PlacementStudentsModelSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      default: "",
      require: true,
    },
    lastName: {
      type: String,
      default: "",
      require: true,
    },
    otherName: {
      type: String,
      // required: true,
    },
    gender: {
      type: String,
      required: true,
    },
    yearGraduated: {
      type: String,
      // required: true,
    },
    enrollmentId: {
      type: String,
    },
    jhsAttended: {
      type: String,
      required: true,
    },
    jhsIndexNumber: {
      type: String,
      required: true,
      unique: true,
    },
    generatedIndexNumber: {
      type: String,
      default: function () {
        return (
          this.jhsIndexNumber +
          this.yearGraduated.split(" ").map((year) => year[2]) +
          this.yearGraduated.split(" ").map((year) => year[3])
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
    placementNumber: {
      type: String,
      unique: true,
      default: function () {
        return "PN" + "-" + Math.floor(1000 + Math.random() * 9000);
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const PlacementStudent = mongoose.model(
  "PlacementStudent",
  PlacementStudentsModelSchema
);

module.exports = PlacementStudent;
