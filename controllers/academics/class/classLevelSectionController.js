const ClassLevel = require("../../../models/academics/class/ClassLevelModel");
const ClassLevelSection = require("../../../models/academics/class/ClassLevelSectionModel");
const User = require("../../../models/user/UserModel");

// Create class section ✅
module.exports.createClassLevelSection = async (req, res) => {
  const currentUser = req.user;
  const programData = req.sectionProgram;
  const data = req.body;
  try {
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
    //Find class level
    const classLevelFound = await ClassLevel.findOne({
      _id: data?.classLevelId,
    });
    if (!classLevelFound) {
      res.status(404).json({
        errorMessage: {
          message: [`Class level not found!`],
        },
      });
      return;
    }
    //Check if class section already exists
    const existingClassSection = await ClassLevelSection.findOne({
      sectionName: data?.sectionName,
      classLevelId: data?.classLevelId,
    });
    if (existingClassSection) {
      res.status(400).json({
        errorMessage: {
          message: [
            `${classLevelFound?.name} ${existingClassSection?.sectionName} class section already exists!`,
          ],
        },
      });
      return;
    }
    if (programData?.isDivisionProgram) {
      //Find all students who qualifies to be in this class section
      const allStudents = await User.find({
        "studentSchoolData.divisionProgram": programData?.programFound?._id,
        "studentSchoolData.currentClassLevel": classLevelFound?._id,
      });
      //create
      const classSectionCreated = await ClassLevelSection.create({
        sectionName: data?.sectionName,
        classLevelId: data?.classLevelId,
        classLevelName: data?.classLevelName,
        program: data?.programId,
        divisionProgram: programData?.programFound?._id,
        createdBy: data?.createdBy,
      });
      if (classSectionCreated) {
        //   push classLevelSection into admin's classLevel sections array❓
        if (
          !adminFound?.adminActionsData?.classLevelSections.includes(
            classSectionCreated._id
          )
        ) {
          await User.findOneAndUpdate(
            adminFound._id,
            {
              $push: {
                "adminActionsData.classLevelSections": classSectionCreated?._id,
              },
            },
            { upsert: true }
          );
        }
        //   push section into class-level sections array✅
        if (
          classLevelFound &&
          !classLevelFound?.sections?.includes(classSectionCreated._id)
        ) {
          classLevelFound.sections.push(classSectionCreated._id);
          await classLevelFound.save();
        }
        if (allStudents) {
          allStudents?.forEach(async (std) => {
            if (std) {
              await User.findOneAndUpdate(
                std?._id,
                {
                  "studentSchoolData.currentClassLevelSection":
                    classSectionCreated?._id,
                },
                { new: true }
              );
            }
          });
        }
        res.status(201).json({
          successMessage: "Class section created successfully!",
          classLevelSection: classSectionCreated,
        });
        console.log("Class section created successfully!");
      } else {
        res.status(500).json({
          errorMessage: {
            message: ["Failed to create class section!"],
          },
        });
        return;
      }
    } else if (!programData?.isDivisionProgram) {
      //Find all students who qualifies to be in this class section
      const allStudents = await User.find({
        "studentSchoolData.program": programData?.programFound?._id,
        "studentSchoolData.currentClassLevel": classLevelFound?._id,
      });
      //create
      const classSectionCreated = await ClassLevelSection.create({
        sectionName: data?.sectionName,
        classLevelId: data?.classLevelId,
        classLevelName: data?.classLevelName,
        program: programData?.programFound?._id,
        createdBy: data?.createdBy,
      });
      if (classSectionCreated) {
        //   push classLevelSection into admin's classLevel sections array❓
        if (
          !adminFound?.adminActionsData?.classLevelSections.includes(
            classSectionCreated._id
          )
        ) {
          await User.findOneAndUpdate(
            adminFound._id,
            {
              $push: {
                "adminActionsData.classLevelSections": classSectionCreated?._id,
              },
            },
            { upsert: true }
          );
        }
        //   push section into class-level sections array✅
        if (
          classLevelFound &&
          !classLevelFound?.sections?.includes(classSectionCreated._id)
        ) {
          classLevelFound.sections.push(classSectionCreated._id);
          await classLevelFound.save();
        }
        if (allStudents) {
          allStudents?.forEach(async (std) => {
            if (std) {
              await User.findOneAndUpdate(
                std?._id,
                {
                  "studentSchoolData.currentClassLevelSection":
                    classSectionCreated?._id,
                },
                { new: true }
              );
            }
          });
        }
        res.status(201).json({
          successMessage: "Class section created successfully!",
          classLevelSection: classSectionCreated,
        });
        console.log("Class section created successfully!");
      } else {
        res.status(500).json({
          errorMessage: {
            message: ["Failed to create class section!"],
          },
        });
        return;
      }
    } else {
      return res.status(500).json({
        errorMessage: {
          message: ["Failed to create class section!"],
        },
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      errorMessage: {
        message: ["Internal Server Error!"],
      },
    });
  }
};
// Assign class section teacher ✅
module.exports.assignClassSectionLecturer = async (req, res) => {
  const { lecturerId, classSectionId } = req.body;
  const currentUser = req.user;
  try {
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
    // Find lecturer
    const lecturerFound = await User.findOne({ _id: lecturerId });
    if (!lecturerFound) {
      res.status(404).json({
        errorMessage: {
          message: [`Lecturer data not found!`],
        },
      });
      return;
    }
    // Check if lecturer's employment has been approved
    if (
      (lecturerFound && !lecturerFound?.teacherStatusExtend?.isTeacher) ||
      lecturerFound?.employment?.employmentStatus !== "approved"
    ) {
      res.status(404).json({
        errorMessage: {
          message: [`Teacher not yet approved!`],
        },
      });
      return;
    }
    // Check if lecturer already has a class
    if (
      lecturerFound &&
      lecturerFound?.teacherSchoolData?.isClassLevelTeacher
    ) {
      res.status(404).json({
        errorMessage: {
          message: [`Teacher already has a class handling!`],
        },
      });
      return;
    }
    const classSectionFound = await ClassLevelSection.findOne({
      _id: classSectionId,
    });
    if (classSectionFound) {
      //Assign teacher to classLevel section✅
      //Update teacher's classLevelHandling and isClassLevelTeacher status❓
      if (
        lecturerFound &&
        !lecturerFound?.teacherSchoolData?.isClassLevelTeacher
      ) {
        await User.findOneAndUpdate(
          lecturerFound._id,
          {
            "teacherSchoolData.classLevelHandling": classSectionFound?._id,
            "teacherSchoolData.isClassLevelTeacher": true,
          },
          { new: true }
        );
      }
      //Push classLevel into teacher's classLevel array✅
      if (
        lecturerFound &&
        !lecturerFound?.teacherSchoolData?.classLevels?.includes(
          classSectionFound?.classLevelId
        )
      ) {
        await User.findOneAndUpdate(
          lecturerFound._id,
          {
            $push: {
              "teacherSchoolData.classLevels": classSectionFound?.classLevelId,
            },
          },
          { upsert: true }
        );
      }
      //Push class section into teacher's class sections array✅
      if (
        lecturerFound &&
        !lecturerFound?.teacherSchoolData?.classSections?.includes(
          classSectionFound?._id
        )
      ) {
        await User.findOneAndUpdate(
          lecturerFound._id,
          {
            $push: {
              "teacherSchoolData.classSections": classSectionFound?._id,
            },
          },
          { upsert: true }
        );
      }
      const updatedClassSection = await ClassLevelSection.findOneAndUpdate(
        classSectionFound?._id,
        { currentTeacher: lecturerFound._id, lastUpdatedBy: adminFound?.id },
        { new: true }
      );
      res.status(201).json({
        successMessage: `Class assigned to Lecturer successfully!`,
        updatedClassSection,
      });
    } else {
      res.status(404).json({
        errorMessage: {
          message: [`Class section data not found!`],
        },
      });
      return;
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      errorMessage: {
        message: ["Internal Server Error!"],
      },
    });
  }
};
// Remove class section teacher ✅
module.exports.removeClassSectionLecturer = async (req, res) => {
  const { lecturerId } = req.params;
  const currentUser = req.user;
  try {
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
    // Find lecturer
    const lecturerFound = await User.findOne({ _id: lecturerId });
    if (!lecturerFound) {
      res.status(404).json({
        errorMessage: {
          message: [`Lecturer data not found!`],
        },
      });
      return;
    }
    const classSectionFound = await ClassLevelSection.findOne({
      _id: lecturerFound?.teacherSchoolData?.classLevelHandling,
    });
    if (classSectionFound) {
      //Assign teacher to classLevel section✅
      //Update teacher's classLevelHandling and isClassLevelTeacher status❓
      if (lecturerFound) {
        await User.findOneAndUpdate(
          lecturerFound._id,
          {
            "teacherSchoolData.classLevelHandling": null,
            "teacherSchoolData.isClassLevelTeacher": false,
          },
          { new: true }
        );
      }
      const updatedClassSection = await ClassLevelSection.findOneAndUpdate(
        classSectionFound?._id,
        { currentTeacher: null, lastUpdatedBy: adminFound?.id },
        { new: true }
      );
      res.status(201).json({
        successMessage: `Lecturer removed from class successfully!`,
        updatedClassSection,
      });
    } else {
      res.status(404).json({
        errorMessage: {
          message: [`Class section data not found!`],
        },
      });
      return;
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      errorMessage: {
        message: ["Internal Server Error!"],
      },
    });
  }
};
// Get all class sections ✅
exports.getAllClassLevelSections = async (req, res) => {
  try {
    const classSections = await ClassLevelSection.find({}).populate([
      { path: "currentTeacher" },
      { path: "createdBy" },
      {
        path: "lastUpdatedBy",
      },
    ]);
    if (classSections) {
      res.status(201).json({
        successMessage: "Class sections fetched successfully...",
        classSections,
      });
    } else {
      res.status(400).json({
        errorMessage: {
          message: ["No class section data found!"],
        },
      });
    }
  } catch (error) {
    res.status(400).json({
      errorMessage: {
        message: ["Internal Server Error!"],
      },
    });
  }
};
// Get single class section ✅
exports.getSingleClassLevelSection = async (req, res) => {
  const { classSectionId } = req.params;
  try {
    const classSection = await ClassLevelSection.findOne({
      _id: classSectionId,
    }).populate([
      { path: "currentTeacher" },
      { path: "createdBy" },
      {
        path: "lastUpdatedBy",
      },
    ]);
    if (classSection) {
      res.status(201).json({
        successMessage: "Class section fetched successfully!",
        classSection,
      });
    } else {
      res.status(403).json({
        errorMessage: {
          message: ["Class Level Section Not Found!"],
        },
      });
    }
  } catch (error) {
    res.status(400).json({
      errorMessage: {
        message: ["Internal Server Error!"],
      },
    });
  }
};
// Update Class Section ✅
exports.updateClassLevelSection = async (req, res) => {
  const currentUser = req.user;
  const { classSectionId } = req.params;
  const data = req.body;
  console.log(data);
  try {
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
    //Find class section to update
    const classSectionFound = await ClassLevelSection.findOne({
      _id: classSectionId,
    });
    if (!classSectionFound) {
      res.status(404).json({
        errorMessage: {
          message: ["Class section data not found!"],
        },
      });
      return;
    }
    // Check for existing class section
    const existingClassSection = await ClassLevelSection.findOne({
      _id: classSectionId,
      sectionName: data?.sectionName,
    });
    if (existingClassSection) {
      res.status(404).json({
        errorMessage: {
          message: ["Class section already exists!"],
        },
      });
      return;
    }
    // Update class section
    const updatedClassSection = await ClassLevelSection.findOneAndUpdate({
      sectionName: data?.sectionName,
      lastUpdatedBy: data?.lastUpdatedBy,
    });
    res.status(201).json({
      successMessage: "Class section updated successfully!",
      updatedClassSection,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      errorMessage: {
        message: ["Internal Server Error!"],
      },
    });
    return;
  }
};
// Delete Class Section ✅
exports.deleteClassLevelSection = async (req, res) => {
  const currentUser = req.user;
  const { classSectionId } = req.params;
  try {
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
    const classSectionFound = await ClassLevelSection.findOne({
      _id: classSectionId,
    });
    if (!classSectionFound) {
      res.status(403).json({
        errorMessage: {
          message: ["Class section data not found!"],
        },
      });
      return;
    }
    const deletedClassSection = await ClassLevelSection.findByIdAndDelete({
      _id: classSectionFound?._id,
    });
    res.status(201).json({
      successMessage: "Class section deleted successfully!",
      deletedClassSection,
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
