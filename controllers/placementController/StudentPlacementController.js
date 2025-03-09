const { handleErrorFunction } = require("../../errors/errorFunction");
const PlacementBatch = require("../../models/PlacementStudent/placementBatches/PlacementBatchesModel");
const PlacementStudent = require("../../models/PlacementStudent/PlacementStudentModel");
const User = require("../../models/user/UserModel");

// Upload excel file ✅
module.exports.uploadPlacementFile = async (req, res, next) => {
  const currentUser = req.user;
  const { data } = req.body;
  try {
    //Find Admin
    const adminFound = await User.findOne({ _id: currentUser?.id });
    if (
      !adminFound ||
      (currentUser && !currentUser?.roles?.includes("Admin"))
    ) {
      res.status(403).json({
        errorMessage: {
          message: ["Operation denied! You're not an admin!"],
        },
      });
      return;
    }
    if (currentUser?.id !== data?.uploadedBy) {
      res.status(403).json({
        errorMessage: {
          message: ["Operation Denied! You're not an admin!"],
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
          (existingStd) => existingStd.jhsIndexNo === newStd.jhsIndexNo
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
            isAutoCreated: true,
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
            successMessage: "Excel file uploaded successfully!",
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
    console.log(error);
    res.status(500).json({
      errorMessage: {
        message: [error?.message],
      },
    });
    return;
  }
};
// Update placement data ✅
module.exports.updatePlacementData = async (req, res) => {
  const { data } = req.body;
  const { studentIndexNo } = req.params;

  try {
    const existingStudent = await PlacementStudent.findOne({
      jhsIndexNo: studentIndexNo,
    });
    if (!existingStudent) {
      res.status(404).json({
        errorMessage: {
          message: [`Placement data not found!`],
        },
      });
      return;
    }
    // Generating Enrollment Code Process
    // const generatedNum = Math.floor(100 + Math.random() * 900); // Generate random number
    // // Get the student's programme abbreviation
    // const programmeAbbreviation = existingStudent?.programme
    //   .split(" ")
    //   .map((word) => word[0].toUpperCase())
    //   .join("");

    // // Get the last two digits of the current year
    // const currentYear = new Date().getFullYear();
    // const yearSuffix = currentYear.toString().slice(-2);

    // // Generate the enrolment Code
    // const enrollmentCode = `${programmeAbbreviation}${generatedNum}-${yearSuffix}`;

    // Update student's placement verification status
    // if (existingStudent && existingStudent.placementVerified === false) {
    //   existingStudent.placementVerified = true;
    //   existingStudent.enrollmentCode = enrollmentCode;
    //   await existingStudent.save();
    // }
    const updatedPlacementStudent = await PlacementStudent.findOneAndUpdate(
      existingStudent?._id,
      {
        fullName: data?.fullName,
        // otherName: data?.otherName,
        dateOfBirth: data?.dateOfBirth,
        jhsAttended: data?.jhsAttended,
        yearGraduated: data?.yearGraduated,
        smsContact: data?.smsContact,
        // enrollmentCode,
      },
      { new: true }
    );
    res.status(201).json({
      successMessage: "Placement data updated successfully!",
      updatedPlacementStudent,
    });
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
  const { studentIndexNo, yearGraduated } = req.params;
  console.log(yearGraduated);

  try {
    if (!studentIndexNo) {
      res.status(400).json({
        errorMessage: {
          message: ["Your JHS index number required!"],
        },
      });
      return;
    }
    if (!yearGraduated) {
      res.status(400).json({
        errorMessage: {
          message: ["Year graduated required!"],
        },
      });
      return;
    }
    const foundStudent = await PlacementStudent.findOne({
      jhsIndexNo: studentIndexNo,
    });
    if (!foundStudent) {
      res.status(404).json({
        errorMessage: {
          message: [`Placement data not found!`],
        },
      });
      return;
    }
    //Find student's placement batch
    const placementBatch = await PlacementBatch.findOne({
      year: yearGraduated,
    });
    if (!placementBatch) {
      res.status(404).json({
        errorMessage: {
          message: [`Placement batch not found!`],
        },
      });
      return;
    }
    if (
      placementBatch &&
      !placementBatch?.students?.includes(foundStudent?._id)
    ) {
      res.status(404).json({
        errorMessage: {
          message: [`Student data not found in this placement batch!`],
        },
      });
      return;
    }
    res.status(200).json({
      successMessage: `Placement data with your index number ${studentIndexNo} found successfully!`,
      foundStudent,
    });
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
  const { data } = req.body;
  const error = [];
  try {
    if (!data?.yearGraduated) {
      error.push("Your graduation year required!");
    }
    if (!data?.jhsIndexNo) {
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
      jhsIndexNo: data?.jhsIndexNo,
    });
    if (!foundStudent) {
      res.status(404).json({
        errorMessage: {
          message: [`Student data not found!`],
        },
      });
      return;
    }
    if (foundStudent && foundStudent?.yearGraduated !== data?.yearGraduated) {
      res.status(404).json({
        errorMessage: {
          message: [`Year completed JHS not correct!`],
        },
      });
      return;
    }
    //Find student's placement batch
    const placementBatch = await PlacementBatch.findOne({
      year: data?.yearGraduated,
    });
    if (!placementBatch) {
      res.status(404).json({
        errorMessage: {
          message: [`Placement batch not found!`],
        },
      });
      return;
    }
    if (
      placementBatch &&
      !placementBatch?.students?.includes(foundStudent?._id)
    ) {
      res.status(404).json({
        errorMessage: {
          message: [`Student data not found in this placement batch!`],
        },
      });
      return;
    }
    //If student found and he/she is already verified,
    //return without updating student data
    if (foundStudent && foundStudent.placementVerified === true) {
      res.status(208).json({
        successMessage: "Already verified!",
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
      successMessage: "Placement verified successfully!",
      verifiedPlacement: foundStudent,
    });
  } catch (error) {
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
      return [newStudent.updatedAt - oldStudent.updatedAt];
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
  const { studentIndexNo } = req.params;
  try {
    const foundStudent = await PlacementStudent.findOne({
      jhsIndexNo: studentIndexNo,
    });
    if (!foundStudent) {
      res.status(404).json({
        errorMessage: {
          message: [`No placement data found!`],
        },
      });
      return;
    } else {
      res.status(200).json({
        successMessage: "Placement student fetched successfully!",
        foundStudent,
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
