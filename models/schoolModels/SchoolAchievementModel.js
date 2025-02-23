const mongoose = require("mongoose");

const AchievementsSchema = new mongoose.Schema({});

const Achievement = mongoose.model("Achievement", AchievementsSchema);

module.exports = Achievement;
