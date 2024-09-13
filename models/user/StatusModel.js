const mongoose = require("mongoose");

const { Schema } = mongoose;

const StatusSchema = new Schema(
  {
    height: {
      type: String,
      max: 50,
      default: "",
    },
    weight: {
      type: String,
      max: 50,
      default: "",
    },
    complexion: {
      type: String,
      default: "",
    },
    motherTongue: {
      type: String,
      max: 50,
      default: "",
    },
    otherTongue: {
      type: String,
      max: 50,
      default: "",
    },
    residentialStatus: {
      type: String,
      required: true,
    },
    //if witdrawn, the user will not be able to login
    isWithdrawned: {
      type: Boolean,
      default: false,
    },
    withdrawnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    withdrawalRestoredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    //if suspended, the user can login but cannot perform any task
    isSuspended: {
      type: Boolean,
      default: false,
    },
    suspendedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    suspensionRestoredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);
const Status = mongoose.model("Status", StatusSchema);

module.exports = Status;
