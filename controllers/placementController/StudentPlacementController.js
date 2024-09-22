const { handleErrorFunction } = require("../../errors/errorFunction");
const PlacementBatch = require("../../models/PlacementStudent/placementBatches/PlacementBatchesModel");
const PlacementStudent = require("../../models/PlacementStudent/PlacementStudentModel");
const User = require("../../models/user/UserModel");

// Upload excel file ✅
module.exports.uploadPlacementFile = async (req, res, next) => {
  const currentUser = req.user;
  const { data } = req.body;
  console.log(currentUser);
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
    if (currentUser?.id !== data?.uploadedBy) {
      res.status(403).json({
        errorMessage: {
          message: ["Operation Denied! You're Not An Admin!"],
        },
      });
      return;
    }
    let existingPlacementBatch = await PlacementBatch.findOne({
      year: data?.placementYear,
    });
    if (data?.students?.length > 0) {
      const allPlacementStudents = await PlacementStudent.find({});
      const newPlacementStudents = data?.students;

      const existingStudents = newPlacementStudents.filter((newStd) =>
        allPlacementStudents.some(
          (existingStd) => existingStd.jHSIndexNo === newStd.jHSIndexNo
        )
      );

      console.log(existingStudents);
      if (existingStudents && existingStudents?.length > 0) {
        res.status(500).json({
          errorMessage: {
            message: [
              `Operation Failed! A Student might be having an existing index number!`,
            ],
          },
        });
        return;
      } else {
        if (!existingPlacementBatch) {
          existingPlacementBatch = await PlacementBatch.create({
            year: data?.placementYear,
          });
        }
        const newStudents = await PlacementStudent.insertMany(data?.students);
        if (newStudents) {
          newStudents?.forEach(async (std) => {
            if (
              std &&
              existingPlacementBatch &&
              !existingPlacementBatch?.students?.includes(std?._id)
            ) {
              await PlacementBatch.findOneAndUpdate(
                existingPlacementBatch?._id,
                {
                  $push: {
                    students: std?._id,
                  },
                  uploadedBy: data?.uploadedBy,
                },
                { upsert: true, new: true }
              );
            }
          });
          res.status(200).json({
            successMessage: "Placement data uploaded successfully!",
            // newStudents,
          });
        }
      }
    } else {
      res.status(500).json({
        errorMessage: {
          message: [`Excel file upload failed! Students data is empty!`],
        },
      });
      return;
    }
  } catch (error) {
    res.status(500).json({
      errorMessage: {
        message: [`Internal Server Error!`],
      },
    });
    return;
  }
};
// Check student placement ✅
module.exports.studentCheckPlacement = async (req, res) => {
  const { jHSIndexNo } = req.body;
  try {
    if (!jHSIndexNo) {
      res.status(400).json({
        errorMessage: {
          message: ["Your JHS index number required!"],
        },
      });
      return;
    }
    const foundStudent = await PlacementStudent.findOne({
      jHSIndexNo,
    });
    if (foundStudent) {
      res.status(200).json({
        successMessage: `Placement Data With Your Index Number ${jHSIndexNo} Found Successfully!`,
        foundStudent,
      });
    } else {
      res.status(404).json({
        errorMessage: {
          message: [
            `Placement data with your index number ${jHSIndexNo} not found!`,
          ],
        },
      });
      return;
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      errorMessage: {
        message: [`Internal Server Error!`],
      },
    });
  }
};
// Verify student placement ✅
module.exports.verifyPlacementStudent = async (req, res) => {
  const { otherNames, surname, yearGraduated, generatedIndexNumber } = req.body;
  const error = [];
  try {
    if (!otherNames) {
      error.push("Your first Name Required!");
    }
    if (!surname) {
      error.push("Your last name required!");
    }
    if (!yearGraduated) {
      error.push("Your graduation year required!");
    }
    if (!generatedIndexNumber) {
      error.push("Your BECE index-number required!");
    }
    if (error.length > 0) {
      res.status(400).json({
        errorMessage: {
          message: error,
        },
      });
      return;
    }
    //Find student's data to verify
    const foundStudent = await PlacementStudent.findOne({
      yearGraduated,
      generatedIndexNumber,
    });
    if (!foundStudent) {
      res.status(404).json({
        errorMessage: {
          message: [`Placement student data not found!`],
        },
      });
      return;
    }
    //Check to validate student's name
    if (
      (foundStudent &&
        foundStudent.generatedIndexNumber === generatedIndexNumber &&
        foundStudent &&
        foundStudent.otherNames !== otherNames) ||
      (foundStudent && foundStudent.surname !== surname)
    ) {
      res.status(400).json({
        errorMessage: {
          message: [`It looks like some credentials are incorrect!`],
        },
      });
      return;
    }
    //If student found and he/she is already verified,
    //return without creating new verified-student data
    if (foundStudent && foundStudent.placementVerified === true) {
      res.status(201).json({
        successMessage: "Already Verified!",
        foundStudent,
      });
      return;
    }
    // Update student's placement verification status
    if (foundStudent && foundStudent.placementVerified === false) {
      foundStudent.placementVerified = true;
      await foundStudent.save();
    }
    res.status(200).json({
      successMessage: "Placement verified successfully...",
      foundStudent,
      // newStudentData: newStudentCreated,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      errorMessage: {
        message: [`Internal Server Error!`],
      },
    });
  }
};
// Get all placement students ✅
module.exports.fetchAllPlacementStudents = async (req, res) => {
  try {
    const allStudents = await PlacementStudent.find({});
    if (!allStudents) {
      res.status(404).json({
        errorMessage: {
          message: [`No placement data found!`],
        },
      });
      return;
    }
    // Order by time
    const sortedStudents = allStudents.sort((oldStudent, newStudent) => {
      return [newStudent.createdAt - oldStudent.createdAt];
    });
    res.status(200).json({
      successMessage: "All placement students fetched successfully!",
      allStudents: sortedStudents,
    });
  } catch (error) {
    res.status(500).json({
      errorMessage: {
        message: [`Internal Server Error!`],
      },
    });
  }
};
// Get single placement student ✅
module.exports.fetchSinglePlacementStudent = async (req, res) => {
  const { studentId } = req.params;
  try {
    const foundStudents = await PlacementStudent.findOne({
      _id: studentId,
    });
    if (!foundStudents) {
      res.status(404).json({
        errorMessage: {
          message: [`No placement data found!`],
        },
      });
      return;
    }
    if (foundStudents) {
      res.status(200).json({
        successMessage: "Placement student fetched successfully!",
        foundStudents,
      });
    }
  } catch (error) {
    res.status(500).json({
      errorMessage: {
        message: [`Internal Server Error!`],
      },
    });
  }
};
// Get verified placement students ✅
module.exports.fetchAllVerifiedPlacementStudents = async (req, res) => {
  try {
    const allVerifiedStudents = await PlacementStudent.find({
      placementVerified: true,
    });
    if (!allVerifiedStudents) {
      res.status(404).json({
        errorMessage: {
          message: [`No data found!`],
        },
      });
      return;
    }
    res.status(200).json({
      successMessage: "All verified students fetched successfully!",
      allVerifiedStudents,
    });
  } catch (error) {
    res.status(500).json({
      errorMessage: {
        message: [`Internal Server Error!`],
      },
    });
  }
};
