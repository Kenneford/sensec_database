const ClassAttendance = require("../../../models/academics/attendance/ClassAttendanceModel");
const StudentAttendance = require("../../../models/academics/attendance/studentAttendanceModel");
const ClassLevelSection = require("../../../models/academics/class/ClassLevelSectionModel");
const User = require("../../../models/user/UserModel");
const { endOfWeek } = require("./functions/currentWeek/EndOfWeek");
const { startOfWeek } = require("./functions/currentWeek/StartOfWeek");

module.exports.createClassAttendance = async (req, res) => {
  const data = req.body;
  try {
    let savedClassAttendance;

    // const date = new Date().toLocaleDateString();
    const date = new Date();
    // Specify the format you want
    const options = { year: "numeric", month: "2-digit", day: "2-digit" };
    const formatter = new Intl.DateTimeFormat("en-GB", options); // en-GB for day/month/year

    // console.log(formatter.format(date)); // Output: 22/01/2025
    const formattedDate = formatter.format(date);
    // console.log(date);

    if (!data?.students?.length > 0) {
      res.status(404).json({
        errorMessage: {
          message: [`No student data found!`],
        },
      });
      return;
    }
    // Find students class section
    const studentClassLevelSectionFound = await ClassLevelSection.findOne({
      _id: data?.classLevelSection,
    });
    if (!studentClassLevelSectionFound) {
      res.status(404).json({
        errorMessage: {
          message: [`Class section not found!`],
        },
      });
      return;
    }
    //Find Lecturer
    const lecturerFound = await User.findOne({
      _id: data?.lecturerId,
    });
    // console.log(lecturerFound);
    // console.log(studentClassLevelSectionFound);

    //Find existing class attendance
    const classAttendanceFound = await ClassAttendance.findOne({
      date: formattedDate,
      lecturer: lecturerFound?._id,
    });
    if (classAttendanceFound) {
      res.status(400).json({
        errorMessage: {
          message: [
            `Attendance with today's date ${classAttendanceFound.date} already exists!`,
          ],
        },
      });
      return;
    }
    if (
      lecturerFound &&
      lecturerFound?.lecturerSchoolData?.classLevelHandling?.toString() !==
        studentClassLevelSectionFound?._id?.toString()
    ) {
      res.status(400).json({
        errorMessage: {
          message: [
            "Access denied! Only form master/mistress can take attendance.",
          ],
        },
      });
      return;
    } else {
      const createdNewClassAttendance = await ClassAttendance.create({
        classLevelSection: studentClassLevelSectionFound?._id,
        lecturer: lecturerFound?._id,
        year: new Date().getFullYear(),
        semester: data?.semester,
      });
      if (createdNewClassAttendance) {
        data?.students?.forEach(async (student) => {
          if (student) {
            const foundStudent = await User.findOne({
              uniqueId: student?.uniqueId,
            });
            const existingStudentAttendance = await StudentAttendance.findOne({
              classLevelSection: studentClassLevelSectionFound?._id,
              student: foundStudent?._id,
              lecturer: lecturerFound?._id,
              date: formattedDate,
              year: new Date().getFullYear(),
            });
            if (!existingStudentAttendance) {
              const markedStudentAttendance = await StudentAttendance.create({
                classLevelSection: studentClassLevelSectionFound?._id,
                student: foundStudent?._id,
                lecturer: lecturerFound?._id,
                status: student.status,
                year: new Date().getFullYear(),
                semester: data?.semester,
              });
              // if (markedStudentAttendance) {
              const updateCreatedClassAttendance =
                await ClassAttendance.findOneAndUpdate(
                  createdNewClassAttendance?._id,
                  {
                    $push: { students: markedStudentAttendance?._id },
                  },
                  { upsert: true }
                );
              savedClassAttendance = updateCreatedClassAttendance;
              // console.log(savedClassAttendance, "L-96");
              // }
              // try {
              //   await User.findOneAndUpdate(
              //     foundStudent?._id,
              //     {
              //       $push: {
              //         "studentSchoolData.attendance":
              //           markedStudentAttendance?._id,
              //       },
              //     },
              //     { upsert: true }
              //   );
              // } catch (error) {
              //   console.log(error);
              //   return res.status(500).json({
              //     errorMessage: {
              //       message: [
              //         "Could Not Add Student's Attendance To His Attendance List!",
              //       ],
              //     },
              //   });
              // }
            }
            if (
              existingStudentAttendance &&
              !createdNewClassAttendance?.students?.includes(
                existingStudentAttendance?._id
              )
            ) {
              await ClassAttendance.findOneAndUpdate(
                createdNewClassAttendance?._id,
                {
                  $push: { students: existingStudentAttendance?._id },
                },
                { upsert: true }
              );
            }
          }
        });
      }
      res.status(201).json({
        successMessage: "Attendance taking successfully",
        savedClassAttendance,
      });
      console.log("Attendance taking successfully");
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      errorMessage: {
        message: ["Internal Server Error!", error?.message],
      },
    });
    return;
  }
};

module.exports.createWeekendAttendance = async (req, res) => {
  // const { students, teacherId, classLevelSection } = req.body;
  let savedClassAttendance;
  const attendanceDate = new Date().toLocaleDateString();
  console.log(attendanceDate);
  const weekends = {
    isSaturday: "Saturday",
    isSunday: "Sunday",
  };
  const date = new Date();
  const options = { weekday: "long" };
  let currentDayOfWeek = date.toLocaleString("en-US", options);
  currentDayOfWeek;
  console.log(currentDayOfWeek === weekends.isSaturday, "L-131");
  console.log(currentDayOfWeek === weekends.isSunday, "L-132");

  // Find all class sections
  const ClassLevelSectionsFound = await ClassLevelSection.find({}).populate([
    {
      path: "students",
      // populate: [
      //   { path: "studentSchoolData.batch" },
      //   { path: "studentSchoolData.currentAcademicYear" },
      //   { path: "studentSchoolData.currentClassLevel" },
      //   { path: "studentSchoolData.program" },
      //   { path: "studentSchoolData.classTeacher" },
      //   {
      //     path: "studentSchoolData.currentClassLevelSection",
      //     populate: [{ path: "students" }],
      //   },
      //   { path: "studentSchoolData.house" },
      // ],
    },
    // { path: "program" },
    // { path: "classLevelId" },
    // { path: "teachers" },
    // { path: "currentTeacher" },
  ]);
  if (!ClassLevelSectionsFound) {
    res.status(404).json({
      errorMessage: {
        message: [`No Class Section Data Found!`],
      },
    });
    return;
  } else {
    if (
      currentDayOfWeek === weekends.isSaturday ||
      currentDayOfWeek === weekends.isSunday
    ) {
      ClassLevelSectionsFound.forEach(async (cSection) => {
        // console.log(cSection?.students, "L-166");
        if (cSection && cSection?.students?.length > 0) {
          //Find existing class attendance
          const classAttendanceFound = await ClassAttendance.findOne({
            date: attendanceDate,
            teacher: cSection?.currentTeacher,
          });
          if (!classAttendanceFound) {
            const createdNewClassAttendance = await ClassAttendance.create({
              classLevelSection: cSection?._id,
              teacher: cSection?.currentTeacher,
            });
            try {
              if (createdNewClassAttendance) {
                cSection?.students.forEach(async (student) => {
                  if (student) {
                    const foundStudent = await User.findOne({
                      uniqueId: student?.uniqueId,
                    });
                    const existingStudentAttendance =
                      await StudentAttendance.findOne({
                        classLevelSection: cSection?._id,
                        student: foundStudent?._id,
                        teacher: cSection?.currentTeacher,
                        // date: new Date().toLocaleDateString(),
                      });
                    if (!existingStudentAttendance) {
                      const markedStudentAttendance =
                        await StudentAttendance.create({
                          classLevelSection: cSection?._id,
                          student: foundStudent?._id,
                          teacher: cSection?.currentTeacher,
                          status: "Weekend",
                        });
                      // if (markedStudentAttendance) {
                      const updateCreatedClassAttendance =
                        await ClassAttendance.findOneAndUpdate(
                          createdNewClassAttendance?._id,
                          {
                            $push: { students: markedStudentAttendance?._id },
                          },
                          { upsert: true }
                        );
                      savedClassAttendance = updateCreatedClassAttendance;
                      // console.log(savedClassAttendance, "L-96");
                      // }
                    }
                  }
                });
              }
            } catch (error) {
              console.log(error);
              res.status(500).json({
                errorMessage: {
                  message: ["Internal Server Error!"],
                },
              });
              return;
            }
            res.status(201).json({
              successMessage: "Attendance taking successfully",
              savedClassAttendance,
            });
            console.log("Attendance taking successfully");
          } else {
            res.status(404).json({
              errorMessage: {
                message: [`Class Attendance Already Exist!`],
              },
            });
            return;
          }
        }
      });
    }
  }
};

module.exports.getStudentsAttendance = async (req, res) => {
  const { id } = req.params;
  let todays = new Date().toLocaleDateString();
  let today = new Date();
  let a = today.getDate();
  a--;
  today.setDate(a);
  const yesterday = today.toLocaleDateString();
  console.log(yesterday);
  const attendance = await StudentAttendance.find({ date: todays }).populate([
    { path: "teacher" },
    { path: "student" },
  ]);
  res.status(200).json({
    successMessage: "Attendance fetched successfully",
    studentsAttendances: attendance,
  });
};
module.exports.getAllClassAttendances = async (req, res) => {
  const date = new Date();
  const options = { weekday: "long" };
  let currentDayOfWeek = date.toLocaleString("en-US", options);
  currentDayOfWeek;
  console.log(currentDayOfWeek, "L-140");
  // const date = new Date();
  var sub = date.getDay() > 0 ? 1 : -6;
  var monday = new Date(date.setDate(date.getDate() - date.getDay() + sub));
  console.log(monday.toLocaleString("en-US", options), "L-146");

  const attendance = await ClassAttendance.find({}).populate([
    {
      path: "lecturer",
      select: "_id uniqueId personalInfo.profilePicture personalInfo.fullName",
    },
    {
      path: "students",
      select: "_id status",
      populate: [
        {
          path: "student",
          select:
            "_id uniqueId personalInfo.profilePicture personalInfo.fullName",
          // populate: [{ path: "studentSchoolData.program" }],
        },
      ],
    },
  ]);
  res.status(200).json({
    successMessage: "Attendance fetched successfully",
    allClassAttendances: attendance,
  });
};
module.exports.getCurrentClassAttendance = async (req, res) => {
  const currentUser = req.user;

  try {
    // const date = new Date().toLocaleDateString();
    const date = new Date();
    // Specify the format you want
    const options = { year: "numeric", month: "2-digit", day: "2-digit" };
    const formatter = new Intl.DateTimeFormat("en-GB", options); // en-GB for day/month/year

    // console.log(formatter.format(date)); // Output: 22/01/2025
    const formattedDate = formatter.format(date);

    const lecturerFound = await User.findOne({ _id: currentUser?.id });
    if (!lecturerFound || !currentUser?.roles?.includes("Lecturer")) {
      res.status(403).json({
        errorMessage: {
          message: ["Not an authorized user!"],
        },
      });
      return;
    }
    const attendance = await ClassAttendance.findOne({
      lecturer: lecturerFound?._id,
      classLevelSection: lecturerFound?.lecturerSchoolData?.classLevelHandling,
      date: formattedDate,
    }).populate([
      {
        path: "lecturer",
        select:
          "_id uniqueId personalInfo.profilePicture personalInfo.fullName",
      },
      {
        path: "students",
        select: "_id status",
        populate: [
          {
            path: "student",
            select:
              "_id uniqueId personalInfo.profilePicture personalInfo.fullName",
            // populate: [{ path: "studentSchoolData.program" }],
          },
        ],
      },
    ]);
    res.status(200).json({
      successMessage: "Attendance fetched successfully",
      currentClassAttendance: attendance,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      errorMessage: {
        message: ["Internal Server Error!", error?.message],
      },
    });
    return;
  }
};
module.exports.singleStudentAttendances = async (req, res) => {
  const { uniqueId } = req.params;
  const studentFound = await User.findOne({ uniqueId });
  if (!studentFound) {
    res.status(404).json({
      errorMessage: {
        message: [`Student Data Not Found!`],
      },
    });
    return;
  }
  const allStudentAttendances = await StudentAttendance.find({
    student: studentFound?._id,
  });
  // Order by time
  const sortedStudentAttendance = allStudentAttendances.sort(
    (oldAttendance, newAttendance) => {
      return [newAttendance.createdAt - oldAttendance.createdAt];
    }
  );
  res.status(200).json({
    successMessage: "Attendance fetched successfully",
    studentAttendances: sortedStudentAttendance,
  });
};

module.exports.getStudentWeeklyClassAttendance = async (req, res) => {
  const { uniqueId } = req.params;

  const currentDate = new Date();
  const weekStart = startOfWeek(currentDate).toLocaleDateString();
  const weekEnd = endOfWeek(currentDate).toLocaleDateString();

  const studentFound = await User.findOne({ uniqueId });
  if (!studentFound) {
    res.status(404).json({
      errorMessage: {
        message: [`Student Data Not Found!`],
      },
    });
    return;
  }
  const allStudentAttendances = await StudentAttendance.find({
    student: studentFound?._id,
    date: { $gte: weekStart, $lte: weekEnd },
  });
  // Order by time
  const sortedStudentAttendance = allStudentAttendances.sort(
    (oldAttendance, newAttendance) => {
      return [newAttendance.createdAt - oldAttendance.createdAt];
    }
  );
  res.status(200).json({
    successMessage: "Attendance fetched successfully",
    studentWeeklyAttendance: sortedStudentAttendance,
  });
};

module.exports.getWeeklyClassAttendance = async (req, res) => {
  const currentUser = req.user;

  try {
    const date = new Date();
    const weekStart = startOfWeek(date);
    const weekEnd = endOfWeek(date);
    // console.log("Start of Week:", weekStart);
    // console.log("End of Week:", weekEnd);

    const lecturerFound = await User.findOne({ _id: currentUser?.id });
    if (!lecturerFound || !currentUser?.roles?.includes("Lecturer")) {
      res.status(403).json({
        errorMessage: {
          message: ["Not an authorized user!"],
        },
      });
      return;
    }
    const attendance = await ClassAttendance.find({
      lecturer: lecturerFound?._id,
      classLevelSection: lecturerFound?.lecturerSchoolData?.classLevelHandling,
      date: { $gte: weekStart, $lte: weekEnd },
    }).populate([
      {
        path: "lecturer",
        select:
          "_id uniqueId personalInfo.profilePicture personalInfo.fullName",
      },
      {
        path: "students",
        select: "_id status",
        populate: [
          {
            path: "student",
            select:
              "_id uniqueId personalInfo.profilePicture personalInfo.fullName",
            // populate: [{ path: "studentSchoolData.program" }],
          },
        ],
      },
    ]);
    res.status(200).json({
      successMessage: "Weekly attendance fetched successfully!",
      weeklyClassAttendance: attendance,
    });
  } catch (error) {
    res.status(500).json({
      errorMessage: {
        message: ["Internal Server Error!", error?.message],
      },
    });
    return;
  }
};

module.exports.searchClassAttendance = async (req, res) => {
  const currentUser = req.user;
  const data = req.body;
  console.log(data, "L-446");
  try {
    const parseDate = (dateString) => {
      const [day, month, year] = dateString.split("/").map(Number); // Extract day, month, year
      return new Date(year, month - 1, day); // Create a JavaScript Date object
    };
    if (!data) {
      res.status(403).json({
        errorMessage: {
          message: [`No data to search for!`],
        },
      });
      return;
    }
    const lecturerFound = await User.findOne({ _id: currentUser?.id });
    if (!lecturerFound || !currentUser?.roles?.includes("Lecturer")) {
      res.status(403).json({
        errorMessage: {
          message: ["Not an authorized user!"],
        },
      });
      return;
    }
    const classSectionFound = await ClassLevelSection.findOne({
      _id: data?.classSection,
    });

    if (
      classSectionFound &&
      classSectionFound?.classLevelId?.toString() !== data?.classLevel
    ) {
      res.status(404).json({
        errorMessage: {
          message: [`Select the correct class level for your class!`],
        },
      });
      return;
    }
    //Search Class Attendance
    let foundClassAttendance;
    // Search By Year✅
    if (data?.year) {
      const foundAttendance = await ClassAttendance.find({
        year: data?.year,
        lecturer: data?.lecturer,
        classLevelSection: data?.classSection,
      }).populate([
        {
          path: "lecturer",
          select:
            "_id uniqueId personalInfo.profilePicture personalInfo.fullName",
        },
        {
          path: "students",
          select: "_id status",
          populate: [
            {
              path: "student",
              select:
                "_id uniqueId personalInfo.profilePicture personalInfo.fullName",
              // populate: [{ path: "studentSchoolData.program" }],
            },
          ],
        },
      ]);
      const transformedAttendance = foundAttendance.map((attendance) => ({
        _id: attendance?._id,
        classLevelSection: attendance?.classLevelSection,
        students: attendance?.students,
        lecturer: attendance?.lecturer,
        semester: attendance?.semester,
        year: attendance?.year,
        dayOfTheWeek: attendance?.dayOfTheWeek,
        time: attendance?.time,
        createdAt: attendance?.createdAt,
        updatedAt: attendance?.updatedAt,
        date: parseDate(attendance?.date),
      }));
      foundClassAttendance = transformedAttendance;
    }
    // Search By Month✅
    if (data?.monthRange) {
      const allAttendance = await ClassAttendance.find({
        // date: {
        //   $gte: parseDate(data?.monthRange?.start),
        //   $lte: parseDate(data?.monthRange?.end),
        // },
        lecturer: data?.lecturer,
        classLevelSection: data?.classSection,
      }).populate([
        {
          path: "lecturer",
          select:
            "_id uniqueId personalInfo.profilePicture personalInfo.fullName",
        },
        {
          path: "students",
          select: "_id status",
          populate: [
            {
              path: "student",
              select:
                "_id uniqueId personalInfo.profilePicture personalInfo.fullName",
              // populate: [{ path: "studentSchoolData.program" }],
            },
          ],
        },
      ]);
      const updatedAttendance = allAttendance?.map((att) => {
        const attObj = {
          _id: att?._id,
          classLevelSection: att?.classLevelSection,
          students: att?.students,
          lecturer: att?.lecturer,
          semester: att?.semester,
          year: att?.year,
          dayOfTheWeek: att?.dayOfTheWeek,
          time: att?.time,
          createdAt: att?.createdAt,
          updatedAt: att?.updatedAt,
          date: parseDate(att?.date),
        };
        return attObj;
      });
      const filteredAttendance = updatedAttendance?.filter(
        (att) =>
          att?.date >= parseDate(data?.monthRange?.start) &&
          att?.date <= parseDate(data?.monthRange?.end)
      );
      foundClassAttendance = filteredAttendance;
    }
    // Search By Date✅
    if (data?.date) {
      const allAttendance = await ClassAttendance.find({
        date: data?.date,
        lecturer: data?.lecturer,
        classLevelSection: data?.classSection,
      }).populate([
        {
          path: "lecturer",
          select:
            "_id uniqueId personalInfo.profilePicture personalInfo.fullName",
        },
        {
          path: "students",
          select: "_id status",
          populate: [
            {
              path: "student",
              select:
                "_id uniqueId personalInfo.profilePicture personalInfo.fullName",
              // populate: [{ path: "studentSchoolData.program" }],
            },
          ],
        },
      ]);
      const updatedAttendance = allAttendance?.map((att) => {
        const attObj = {
          _id: att?._id,
          classLevelSection: att?.classLevelSection,
          students: att?.students,
          lecturer: att?.lecturer,
          semester: att?.semester,
          year: att?.year,
          dayOfTheWeek: att?.dayOfTheWeek,
          time: att?.time,
          createdAt: att?.createdAt,
          updatedAt: att?.updatedAt,
          date: parseDate(att?.date),
        };
        return attObj;
      });
      foundClassAttendance = updatedAttendance;
    }
    // Search By Date-Range
    if (data?.dateRange) {
      const allAttendance = await ClassAttendance.find({
        date: { $gte: data?.dateRange?.from, $lte: data?.dateRange?.to },
        lecturer: data?.lecturer,
        classLevelSection: data?.classSection,
      }).populate([
        {
          path: "lecturer",
          select:
            "_id uniqueId personalInfo.profilePicture personalInfo.fullName",
        },
        {
          path: "students",
          select: "_id status",
          populate: [
            {
              path: "student",
              select:
                "_id uniqueId personalInfo.profilePicture personalInfo.fullName",
              // populate: [{ path: "studentSchoolData.program" }],
            },
          ],
        },
      ]);
      const updatedAttendance = allAttendance?.map((att) => {
        const attObj = {
          _id: att?._id,
          classLevelSection: att?.classLevelSection,
          students: att?.students,
          lecturer: att?.lecturer,
          semester: att?.semester,
          year: att?.year,
          dayOfTheWeek: att?.dayOfTheWeek,
          time: att?.time,
          createdAt: att?.createdAt,
          updatedAt: att?.updatedAt,
          date: parseDate(att?.date),
        };
        return attObj;
      });
      foundClassAttendance = updatedAttendance;
    }
    // Search By Semester
    if (data?.semester) {
      const allAttendance = await ClassAttendance.find({
        semester: data?.semester,
        lecturer: data?.lecturer,
        classLevelSection: data?.classSection,
      }).populate([
        {
          path: "lecturer",
          select:
            "_id uniqueId personalInfo.profilePicture personalInfo.fullName",
        },
        {
          path: "students",
          select: "_id status",
          populate: [
            {
              path: "student",
              select:
                "_id uniqueId personalInfo.profilePicture personalInfo.fullName",
              // populate: [{ path: "studentSchoolData.program" }],
            },
          ],
        },
      ]);
      const updatedAttendance = allAttendance?.map((att) => {
        const attObj = {
          _id: att?._id,
          classLevelSection: att?.classLevelSection,
          students: att?.students,
          lecturer: att?.lecturer,
          semester: att?.semester,
          year: att?.year,
          dayOfTheWeek: att?.dayOfTheWeek,
          time: att?.time,
          createdAt: att?.createdAt,
          updatedAt: att?.updatedAt,
          date: parseDate(att?.date),
        };
        return attObj;
      });
      foundClassAttendance = updatedAttendance;
    }
    res.status(200).json({
      successMessage: "Attendance Fetched Successfully",
      foundClassAttendance,
    });
    console.log(foundClassAttendance);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      errorMessage: {
        message: [`Internal Sever Error!`, error?.message],
      },
    });
    return;
  }
};
