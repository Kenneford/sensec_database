const mongoose = require("mongoose");

const { Schema } = mongoose;

const StudentPromotionSchema = new Schema(
  {
    isPromoted: {
      type: Boolean,
      default: false,
    },
    isPromotedToLevel200: {
      type: Boolean,
      default: false,
    },
    isPromotedToLevel300: {
      type: Boolean,
      default: false,
    },
    lastPromotedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    promotionDate: {
      Date,
    },
    isDemoted: {
      type: Boolean,
      default: false,
    },
    isDemotedToLevel200: {
      type: Boolean,
      default: false,
    },
    isDemotedToLevel100: {
      type: Boolean,
      default: false,
    },
    isGraduated: {
      type: Boolean,
      default: false,
    },
    dateGraduated: {
      type: Date,
    },
    yearGraduated: {
      type: String,
      // default: "",
    },
    isStudent: {
      type: Boolean,
      default: false,
    },
    enrollmentStatus: {
      type: String,
      default: null,
    },
    enrolledOnline: {
      type: Boolean,
      default: false,
    },
    dateEnrolled: {
      type: Date,
    },
    graduatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    enrollmentApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    enrollmentApprovementDate: {
      type: Date,
    },
    enrollmentRejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    enrollmentRejectionDate: {
      type: Date,
    },
    sensosaApplicationApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    sensosaApplicationApprovementDate: {
      type: Date,
    },
  },
  { timestamps: true }
);
const StudentPromotion = mongoose.model(
  "StudentPromotion",
  StudentPromotionSchema
);

module.exports = StudentPromotion;
