const mongoose = require("mongoose");

const { Schema } = mongoose;

const ClassLevelSchema = new Schema(
  {
    //level 100/200/300
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: function () {
        return `This is academics ${this.name} data`;
      },
    },
    //students will be added to the class level when they are registered
    sections: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ClassLevelSection",
      },
    ],
    //students will be added to the class level when they are registered
    // students: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "User",
    //   },
    // ],
    // pendingStudents: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "User",
    //   },
    // ],
    // teachers: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "User",
    //   },
    // ],
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

const ClassLevel = mongoose.model("ClassLevel", ClassLevelSchema);

module.exports = ClassLevel;
