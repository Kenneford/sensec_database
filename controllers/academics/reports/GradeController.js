const AcademicGrade = require("../../../models/academics/grades/AcademicGradesModel");
const User = require("../../../models/user/UserModel");

module.exports.createGrade = async (req, res) => {
  const currentUser = req.user;
  const { data } = req.body;
  console.log(data);

  try {
    //Find admin
    const adminFound = await User.findOne({ _id: currentUser?.id });
    if (!adminFound || !currentUser?.roles?.includes("Admin")) {
      res.status(403).json({
        errorMessage: {
          message: ["Operation Denied! You're not a admin!"],
        },
      });
      return;
    }
    if (currentUser?.id !== data?.createdBy) {
      res.status(403).json({
        errorMessage: {
          message: ["Operation Denied! You're not a admins!"],
        },
      });
      return;
    }
    // Find existing grade
    const existingGrade = await AcademicGrade.findOne({
      minScore: data?.minScore,
      maxScore: data?.maxScore,
    });
    if (existingGrade) {
      res.status(403).json({
        errorMessage: {
          message: ["Grade already exist!"],
        },
      });
      return;
    }
    const newGrade = await AcademicGrade.create({
      minScore: data?.minScore,
      maxScore: data?.maxScore,
      grade: data?.grade,
      remark: data?.remark,
      createdBy: data?.createdBy,
    });

    res.status(201).json({
      successMessage: "Academics grade added successfully!",
      academicGrade: newGrade,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      errorMessage: {
        message: ["Internal Server Error!"],
      },
    });
  }
};
