const ProgramDivision = require("../../models/academics/programmes/divisions/ProgramDivisionModel");
const Program = require("../../models/academics/programmes/ProgramsModel");

async function findProgramme(req, res, next) {
  const data = req.body;
  try {
    let programFound;
    if (data?.divisionProgramId) {
      programFound = await ProgramDivision.findOne({
        _id: data?.divisionProgramId,
      });
      req.sectionProgram = { programFound, isDivisionProgram: true };
      next();
    } else if (data?.programId) {
      programFound = await Program.findOne({
        _id: data?.programId,
      });
      req.sectionProgram = { programFound, isDivisionProgram: false };
      next();
    } else {
      res.status(404).json({
        errorMessage: {
          message: ["No programme data found!"],
        },
      });
      return;
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      errorMessage: {
        message: ["Internal Server Error!"],
      },
    });
  }
}

module.exports = { findProgramme };
