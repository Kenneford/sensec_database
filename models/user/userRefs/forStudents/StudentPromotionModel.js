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
      type: String,
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
      // default: "pending",
    },
    enrolledOnline: {
      type: Boolean,
      default: false,
    },
    dateEnrolled: {
      type: Date,
    },
    enrollmentApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    enrollmentApprovementDate: {
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
