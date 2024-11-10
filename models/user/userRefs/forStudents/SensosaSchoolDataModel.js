const mongoose = require("mongoose");

const { Schema } = mongoose;

const SensosaSchoolDataSchema = new Schema(
  {
    jhsAttended: {
      type: String,
      // required: true,
    },
    jhsIndexNo: {
      type: String,
      // required: true,
    },
    completedJhs: {
      type: String,
      // required: true,
    },
    programOfOS: {
      type: String,
      // required: true,
    },
    isGraduated: {
      type: Boolean,
      default: true,
    },
    yearGraduated: {
      type: String,
      //   required: true,
    },
  },
  { timestamps: true }
);
const SensosaSchoolData = mongoose.model(
  "SensosaSchoolData",
  SensosaSchoolDataSchema
);

module.exports = SensosaSchoolData;
