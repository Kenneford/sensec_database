const mongoose = require("mongoose");

const { Schema } = mongoose;

const coreSubjectSchema = new Schema(
  {
    isCoreSubject: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const CoreSubject = mongoose.model("CoreSubject", coreSubjectSchema);

module.exports = CoreSubject;
