const mongoose = require("mongoose");

const { Schema } = mongoose;

const houseSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: function () {
        return `This is ${this.name}'s House`;
      },
    },
    currentHouseMaster: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    houseMasters: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isFull: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const House = mongoose.model("House", houseSchema);

module.exports = House;
