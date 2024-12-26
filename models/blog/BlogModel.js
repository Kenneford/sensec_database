const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    title: {
      type: String,
      max: 500,
    },
    image: {
      public_id: {
        type: String,
        // required: true,
      },
      url: {
        type: String,
        // required: true,
      },
    },
    text: {
      type: String,
    },
    comments: [
      {
        type: String,
      },
    ],
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    loves: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    reactions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    yearPosted: {
      type: String,
      default: function () {
        return new Date().getFullYear();
      },
    },
    datePosted: {
      type: Date,
    },
    previouslyUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    lastUpdatedDate: {
      type: Date,
    },
    previouslyUpdatedDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Blog = mongoose.model("Blog", blogSchema);
module.exports = Blog;
