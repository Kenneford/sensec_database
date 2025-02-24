const { cloudinary } = require("../../middlewares/cloudinary/cloudinary");
const SensecSchoolData = require("../../models/schoolModels/SchoolAboutDataModel");
const User = require("../../models/user/UserModel");

module.exports.addSchoolData = async (req, res) => {
  const data = req.body;
  const currentUser = req.user;

  try {
    //Find Admin
    const adminFound = await User.findOne({ _id: currentUser?.id });
    if (!adminFound || !currentUser?.roles?.includes("Admin")) {
      res.status(403).json({
        errorMessage: {
          message: ["Operation Denied! You're not an admin!"],
        },
      });
      return;
    }
    const foundSchoolData = await SensecSchoolData.find({});
    if (foundSchoolData && !foundSchoolData?.length <= 0) {
      // console.log(err);
      return res.status(400).json({
        errorMessage: {
          message: ["School Data Already Created! You Can Only Update!"],
        },
      });
    }
    if (!data?.schoolLogo) {
      // console.log(err);
      res.status(400).json({
        errorMessage: {
          message: ["No image file selected or image file not supported!"],
        },
      });
      return;
    }
    await cloudinary.uploader.upload(
      data?.schoolLogo,
      {
        folder: "School_Images",
        transformation: [
          { width: 300, height: 400, crop: "fill", gravity: "center" },
          { quality: "auto" },
          { fetch_format: "auto" },
        ],
      },
      async (err, result) => {
        if (err) {
          res.status(400).json({
            errorMessage: {
              message: ["Something went wrong!", err?.message],
            },
          });
        } else {
          const schoolData = await SensecSchoolData.create({
            nameOfSchool: data?.nameOfSchool,
            anthem: data?.anthem,
            slogan: data?.slogan,
            greetings: data?.greetings,
            schoolLogo: {
              public_id: result.public_id,
              url: result.secure_url,
            },
            whoWeAre: data?.whoWeAre,
            academicExcellence: data?.academicExcellence,
            "schoolVision.visionStatement": data?.visionStatement,
            "schoolVision.missionStatement": data?.mission,
            "schoolVision.coreValues": data?.coreValues,
            "achievements.text": data?.achievementText,
            history: data?.history,
            anthems: data?.anthem,
          });
          res.status(201).json({
            successMessage: "School data created successfully!",
            SensecSchoolData: schoolData,
          });
        }
      }
    );
  } catch (error) {
    res.status(500).json({
      errorMessage: { message: ["Internal server error", error?.message] },
    });
  }
};

module.exports.fetchSchoolData = async (req, res) => {
  const sensecSchoolData = await SensecSchoolData.find({});

  try {
    if (sensecSchoolData) {
      res.status(200).json({
        successMessage: "School data fetched successfully!",
        sensecSchoolData,
      });
    } else {
      res.status(500).json({
        errorMessage: {
          message: ["Failed to fetch school data!"],
        },
      });
    }
  } catch (error) {
    res.status(500).json({
      errorMessage: { message: ["Internal server error"] },
    });
  }
};
