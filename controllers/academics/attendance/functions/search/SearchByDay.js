const ClassAttendance = require("../../../../../models/academicsModels/classAttendanceModel");

const searchByDay = async (foundClassAttendance, day, date) => {
  //Search by day
  if (day && !date) {
    const classAttendance = await ClassAttendance.findOne({
      // day,
      dayOfTheWeek: day,
    });
    // if (classAttendance) {
    //   foundClassAttendance = classAttendance;
    // } else {
    //   res.status(404).json({
    //     errorMessage: {
    //       message: [`No Attendance Found With Your Input Data!`],
    //     },
    //   });
    //   return;
    // }
    return foundClassAttendance;
  }
};
module.exports = { searchByDay };
