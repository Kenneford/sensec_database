const mongoose = require("mongoose");

const SensecSchoolDataSchema = new mongoose.Schema(
  {
    nameOfSchool: {
      type: String,
    },
    schoolLogo: {
      public_id: {
        type: String,
      },
      url: {
        type: String,
      },
    },
    slogan: {
      type: String,
    },
    greetings: {
      type: String,
    },
    whoWeAre: {
      type: String,
    },
    academicExcellence: {
      type: String,
    },
    schoolVision: {
      visionStatement: { type: String },
      missionStatement: { type: String },
      coreValues: { type: String },
    },
    history: {
      type: String,
    },
    anthems: { type: String },
    // anthems: [
    //   {
    //     indexNumber: { type: Number },
    //     title: { type: String },
    //     text: { type: String },
    //   },
    // ],
    achievements: {
      text: { type: String },
      images: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Achievements",
        },
      ],
    },
    teamMembers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team",
      },
    ],
  },
  { timestamps: true }
);

const SensecSchoolData = mongoose.model(
  "SensecSchoolData",
  SensecSchoolDataSchema
);

module.exports = SensecSchoolData;
