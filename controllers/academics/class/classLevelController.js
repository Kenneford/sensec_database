const ClassLevel = require("../../../models/academics/class/ClassLevelModel");
const User = require("../../../models/user/UserModel");

// Create class level ✅
module.exports.createClassLevel = async (req, res) => {
  const currentUser = req.user;
  const { classLevelData } = req.body;
  try {
    //Find Admin
    const adminFound = await User.findOne({ _id: classLevelData?.createdBy });

    if (!adminFound || !currentUser?.roles?.includes("admin")) {
      res.status(403).json({
        errorMessage: {
          message: ["Operation Denied! You're Not An Admin!"],
        },
      });
      return;
    }
    if (!classLevelData?.name) {
      res.status(403).json({
        errorMessage: {
          message: ["Class level's name required!"],
        },
      });
      return;
    }
    //Check if class level exists
    const classLevel = await ClassLevel.findOne({ name: classLevelData?.name });
    if (classLevel) {
      res.status(403).json({
        errorMessage: {
          message: [`Class ${classLevel?.name} already exists!`],
        },
      });
      return;
    }
    //create
    const classLevelCreated = await ClassLevel.create({
      name: classLevelData?.name,
      createdBy: classLevelData?.createdBy,
    });
    if (classLevelCreated) {
      //   push class-level into admin's class levels array✅
      if (
        adminFound &&
        !adminFound?.adminActionsData?.classLevelsCreated.includes(
          classLevelCreated._id
        )
      ) {
        await User.findOneAndUpdate(
          adminFound._id,
          {
            $push: {
              "adminActionsData.classLevelsCreated": classLevelCreated?._id,
            },
          },
          { upsert: true }
        );
      }
    } else {
      return res.status(400).json({
        errorMessage: {
          message: ["Failed to create class level!"],
        },
      });
    }
    res.status(201).json({
      successMessage: "Class level created successfully!",
      classLevel: classLevelCreated,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      errorMessage: {
        message: ["Internal Server Error!"],
      },
    });
  }
};
// Get all Class Levels ✅
exports.getAllClassLevels = async (req, res) => {
  try {
    const classLevels = await ClassLevel.find({}).populate([
      {
        path: "sections",
      },
      {
        path: "createdBy",
      },
      {
        path: "lastUpdatedBy",
      },
    ]);
    if (classLevels) {
      res.status(201).json({
        successMessage: "All class levels fetched successfully!",
        classLevels,
      });
    } else {
      res.status(404).json({
        errorMessage: {
          message: ["No class level data found!"],
        },
      });
    }
  } catch (error) {
    console.log(error);

    res.status(500).json({
      errorMessage: {
        message: ["Internal Server Error!"],
      },
    });
  }
};
// Get single Class Level Students ✅
exports.getSingleClassLevel = async (req, res) => {
  const { classLevelId } = req.params;
  try {
    const classLevel = await ClassLevel.findOne({ _id: classLevelId }).populate(
      [
        {
          path: "sections",
        },
        {
          path: "teachers",
        },
        {
          path: "createdBy",
        },
        {
          path: "lastUpdatedBy",
        },
      ]
    );
    if (classLevel) {
      res.status(201).json({
        successMessage: "Academic class level fetched successfully!",
        classLevel,
      });
    } else {
      res.status(403).json({
        errorMessage: {
          message: ["No class level data found!"],
        },
      });
    }
  } catch (error) {
    res.status(500).json({
      errorMessage: {
        message: ["Internal Server Error!"],
      },
    });
  }
};
// Get class level pending students ✅
exports.getClassLevelPendingStudents = async (req, res) => {
  const { classLevelId } = req.params;
  // console.log(classLevel);
  try {
    const classLevelFound = await ClassLevel.find({ _id: classLevelId });
    if (!classLevelFound) {
      res.status(404).json({
        errorMessage: {
          message: ["Class level data not found!"],
        },
      });
      return;
    }
    const classLevelPendingStudents = await User.find({
      "studentSchoolData.currentClassLevel": classLevelId,
      "studentStatusExtend.enrollmentStatus": "pending",
      roles: { $in: ["student"] },
    });
    if (classLevelPendingStudents) {
      const sortedStudents = classLevelPendingStudents?.sort(
        (oldStudent, newStudent) => {
          return [newStudent.createdAt - oldStudent.createdAt];
        }
      );
      res.status(201).json({
        successMessage: "Academic class level fetched successfully...",
        classLevelPendingStudents: sortedStudents,
      });
    } else {
      res.status(403).json({
        errorMessage: {
          message: ["No pending student data found!"],
        },
      });
    }
  } catch (error) {
    res.status(500).json({
      errorMessage: {
        message: ["Internal Server Error!"],
      },
    });
  }
};
// Get class level students ✅
exports.getClassLevelApprovedStudents = async (req, res) => {
  const { classLevelId } = req.params;
  // console.log(classLevel);
  try {
    const classLevelFound = await ClassLevel.find({ _id: classLevelId });
    if (!classLevelFound) {
      res.status(404).json({
        errorMessage: {
          message: ["Class level data not found!"],
        },
      });
      return;
    }
    const classLevelPendingStudents = await User.find({
      "studentSchoolData.currentClassLevel": classLevelId,
      "studentStatusExtend.enrollmentStatus": "approved",
      roles: { $in: ["student"] },
    });
    if (classLevelPendingStudents) {
      const sortedStudents = classLevelPendingStudents?.sort(
        (oldStudent, newStudent) => {
          return [newStudent.createdAt - oldStudent.createdAt];
        }
      );
      res.status(201).json({
        successMessage: "Academic class level fetched successfully...",
        classLevelPendingStudents: sortedStudents,
      });
    } else {
      res.status(403).json({
        errorMessage: {
          message: ["No pending student data found!"],
        },
      });
    }
  } catch (error) {
    res.status(500).json({
      errorMessage: {
        message: ["Internal Server Error!"],
      },
    });
  }
};
// Update class level ✅
exports.updateClassLevel = async (req, res) => {
  const currentUser = req.user;
  const { classLevelId } = req.params;
  const { name, lastUpdatedBy } = req.body;
  try {
    //Find Admin
    const adminFound = await User.findOne({ _id: data?.createdBy });
    if (!adminFound || !currentUser?.roles?.includes("admin")) {
      res.status(403).json({
        errorMessage: {
          message: ["Operation Denied! You're Not An Admin!"],
        },
      });
      return;
    }
    //Find Class Level To Update
    const classLevelFound = await ClassLevel.findOne({ _id: classLevelId });
    if (!classLevelFound) {
      res.status(404).json({
        errorMessage: {
          message: ["Class level data not found!"],
        },
      });
      return;
    }

    //Find Existing Class Level
    const existingClassLevelFound = await ClassLevel.findOne({
      _id: classLevelId,
      name,
    });
    if (existingClassLevelFound) {
      res.status(404).json({
        errorMessage: {
          message: [`Class ${name} already exists!`],
        },
      });
      return;
    }
    const updatedClassLevel = await ClassLevel.findOneAndUpdate(
      classLevelFound?._id,
      {
        name,
        lastUpdatedBy,
      },
      {
        new: true,
      }
    );
    res.status(201).json({
      successMessage: "Class level updated successfully!",
      updatedClassLevel,
    });
  } catch (error) {
    res.status(500).json({
      errorMessage: {
        message: ["Internal Server Error!"],
      },
    });
  }
};
// Delete class level ✅
exports.deleteClassLevel = async (req, res) => {
  const currentUser = req.user;
  const { classLevelId } = req.params;
  try {
    const classLevelFound = await ClassLevel.findOne({ _id: classLevelId });
    if (!classLevelFound) {
      res.status(404).json({
        errorMessage: {
          message: ["Class level data not found!"],
        },
      });
      return;
    }
    //Find Admin
    const adminFound = await User.findOne({ _id: currentUser?.id });
    if (!adminFound || !currentUser?.roles?.includes("admin")) {
      res.status(403).json({
        errorMessage: {
          message: ["Operation Denied! You're Not An Admin!"],
        },
      });
      return;
    }
    const deletedClassLevel = await ClassLevel.findByIdAndDelete({
      _id: classLevelFound?._id,
    });
    if (
      deletedClassLevel &&
      adminFound?.adminActionsData?.classLevels?.includes(
        deletedClassLevel?._id
      )
    ) {
      adminFound.adminActionsData.classLevels.pull(deletedClassLevel?._id);
      await adminFound.save();
    }
    res.status(201).json({
      successMessage: "Class level deleted successfully!",
      deletedClassLevel,
    });
  } catch (error) {
    res.status(500).json({
      errorMessage: {
        message: ["Internal Server Error!"],
      },
    });
  }
};
