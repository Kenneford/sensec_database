const mongoose = require("mongoose");

const { Schema } = mongoose;

const StudentsSchoolDataSchema = new Schema(
  {
    jhsAttended: {
      type: String,
      // required: true,
    },
    completedJhs: {
      type: String,
      // required: true,
    },
    jhsIndexNo: {
      type: String,
      // required: true,
    },
    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      // required: true,
    },
    divisionProgram: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProgramDivision",
      // required: true,
    },
    programOfOS: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      // required: true,
    },
    electiveSubjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
      },
    ],
    coreSubjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
      },
    ],
    currentClassTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    classTeachers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    currentClassLevel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClassLevel",
    },
    currentClassLevelSection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClassLevelSection",
    },
    classLevels: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ClassLevel",
      },
    ],
    //Get id of current academic year when student enrol or is promoted
    currentAcademicYear: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicYear",
    },
    //Push the current academic year into student's academic years
    academicYears: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AcademicYear",
      },
    ],
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      // required: true,
    },
    // behaviorReport: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "BehaviorReport",
    //   },
    // ],
    // financialReport: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "FinancialReport",
    //   },
    // ],
    positionHolding: {
      type: String,
    },
    house: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "House",
    },
    attendance: [{ type: mongoose.Schema.ObjectId, ref: "StudentAttendance" }],
    attendanceStatus: {
      type: String,
    },
    examResults: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ExamResult",
      },
    ],
    enrollmentCode: {
      type: String,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);
const StudentsSchoolData = mongoose.model(
  "StudentsSchoolData",
  StudentsSchoolDataSchema
);

module.exports = StudentsSchoolData;
