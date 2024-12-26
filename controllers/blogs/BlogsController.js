const { cloudinary } = require("../../middlewares/cloudinary/cloudinary");
const Blog = require("../../models/blog/BlogModel");
const User = require("../../models/user/UserModel");

// Create new blog
module.exports.createBlog = async (req, res) => {
  const { blogData } = req.body;

  const authAdmin = req?.user;

  try {
    if (!blogData?.title) {
      return res.status(404).json({
        errorMessage: {
          message: ["Please provide a title for the blog!"],
        },
      });
    }
    if (!blogData?.text) {
      return res.status(404).json({
        errorMessage: {
          message: ["Please provide text for the blog!"],
        },
      });
    }
    const blogFound = await Blog.findOne({
      title: blogData?.title,
    });
    if (!blogData?.image) {
      res.status(400).json({
        errorMessage: {
          message: [`No image selected or image file not supported!`],
        },
      });
      return;
    }
    if (blogFound) {
      res.status(400).json({
        errorMessage: {
          message: [`Blog with title - "${blogData?.title}" already exists!`],
        },
      });
      return;
    }
    const isAdmin = await User.findOne({
      _id: authAdmin?.id,
    });
    if (isAdmin && isAdmin?.roles?.includes("admin")) {
      await cloudinary.uploader.upload(
        // req.file.path,
        blogData?.image,
        {
          folder: "Blog Images",
          transformation: [
            { width: 900, height: 500, crop: "fill", gravity: "center" },
            { quality: "auto" },
            { fetch_format: "auto" },
          ],
        },
        async (err, result) => {
          if (err) {
            // console.log(err);
            res.status(400).json({
              errorMessage: {
                message: ["No image selected or image file not supported!"],
              },
            });
            return;
          }
          const savedBlog = await Blog.create({
            image: {
              public_id: result.public_id,
              url: result.secure_url,
            },
            title: blogData?.title,
            text: blogData?.text,
            postedBy: blogData?.postedBy,
            date: new Date().toISOString(),
          });
          res.status(201).json({
            successMessage: "Blog added successfully!",
            blog: savedBlog,
          });
          console.log("Blog added successfully!");
        }
      );
    } else {
      res.status(403).json({
        errorMessage: {
          message: [`Operation Denied! You're Not An Admin!`],
        },
      });
      return;
    }
  } catch (error) {
    res.status(500).json({
      errorMessage: {
        message: [`Internal Server Error! ${error?.message}`],
      },
    });
    return;
  }
};
// Fetch all blogs
module.exports.fetchAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({}).populate([
      {
        path: "postedBy",
      },
    ]);
    if (blogs) {
      // Order by time
      const sortedBlogs = blogs.sort((oldBlog, newBlog) => {
        return [newBlog.createdAt - oldBlog.createdAt];
      });
      res.json({
        successMessage: "All Blogs Fetched Successfully!",
        blogs: sortedBlogs,
      });
    } else {
      res.status(400).json({
        errorMessage: {
          message: ["Blogs Fetching Failed!"],
        },
      });
      return;
    }
  } catch (errorMessage) {
    res.status(400).json({
      errorMessage: {
        message: ["Internal Server Error"],
      },
    });
  }
};
// Delete a blog
module.exports.deleteBlog = async (req, res) => {
  const { blogId } = req.params;
  const authAdmin = req?.user;
  try {
    const isAdmin = await User.findOne({
      _id: authAdmin?.id,
    });
    const blog = await Blog.findOne({ _id: blogId });
    console.log(blog);

    if (isAdmin && isAdmin?.roles?.includes("admin")) {
      if (blog) {
        const blogDeleted = await Blog.findOneAndDelete({ _id: blog?._id });
        // Handle existing image deletion if applicable
        const existingImgId = blog?.image?.public_id;
        if (existingImgId) {
          await cloudinary.uploader.destroy(existingImgId);
        }
        res.status(200).json({
          successMessage: "Blog successfully deleted!",
          blogDeleted,
        });
      } else {
        res.status(404).json({
          errorMessage: {
            message: [`Blog Not Found!`],
          },
        });
        return;
      }
    } else {
      res.status(403).json({
        errorMessage: {
          message: [`Operation Denied! You're Not An Admin!`],
        },
      });
      return;
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      errorMessage: {
        message: [`Internal Server Error! ${error?.message}`],
      },
    });
  }
};
