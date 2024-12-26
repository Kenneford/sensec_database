const router = require("express").Router();
// const { sendEmail, receiveEmail } = require("../controllers/email");
const {
  createBlog,
  fetchAllBlogs,
  deleteBlog,
} = require("../../controllers/blogs/BlogsController");
const { authUser } = require("../../middlewares/auth/authUser");
const { uploadImageFile } = require("../../middlewares/multer/multer");

//POSTING DATA
router.post(
  "/blogs/create",
  uploadImageFile.single("image"),
  authUser,
  createBlog
);
// router.post("/send_email", sendEmail);
// router.post("/receive_email", receiveEmail);

//FETCHING DATA
router.get("/blogs/fetch_all", fetchAllBlogs);
// router.get("/blogs/single/:title/fetch", getSingleBlog);

// // //UPDATING DATA
// router.put("/blogs/:blogTitle/update", upload.single("blogImage"), updateblog);
// router.put("/:userId/blogs/:blogId/like", likeBlog);
// router.put("/:userId/blogs/:blogId/love", loveBlog);
// // router.put("/love_post/:postId", lovePost);

// //DELETING DATA
router.delete("/blogs/:blogId/delete", authUser, deleteBlog);

module.exports = router;
