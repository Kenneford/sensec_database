const mongoose = require("mongoose");

const TeamSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  memberId: {
    type: String,
  },
  image: {
    type: String,
  },
  position: {
    type: String,
  },
  socials: [],
});

const Team = mongoose.model("Team", TeamSchema);

module.exports = Team;
