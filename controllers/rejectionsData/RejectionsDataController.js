const RejectedApplication = require("../../models/user/rejections/RejectedApplicationsModel");

module.exports.createRejectedApplicationsData = async (req, res) => {
  const authAdmin = req.user;
  try {
    if (!authAdmin?.roles?.includes("admin")) {
      return res.status(500).json({
        errorMessage: {
          message: ["Operation denied! You're not an admin!"],
        },
      });
    }
    const rejectionsData = await RejectedApplication.find({});
    if (rejectionsData?.length > 0 && rejectionsData?.length === 1) {
      return res.status(500).json({
        errorMessage: {
          message: ["Rejections data already exist! You can only update!"],
        },
      });
    }
    const rejectedApplications = await RejectedApplication.create({
      //   users: [],
    });
    res.status(201).json({
      successMessage: `Rejected applications data created successfully!`,
      rejectedApplications,
    });
  } catch (error) {
    return res.status(500).json({
      errorMessage: {
        message: ["Internal Server Error!"],
      },
    });
  }
};
