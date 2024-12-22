const mongoose = require("mongoose");

const PersonalInfo = require("./PersonalInfoModel");
const ContactAddress = require("./ContactAddressModel");
const Status = require("./StatusModel");
const Employment = require("./EmploymentModel");
const AdminExtendedStatus = require("./userRefs/forAdmins/AdminExtendedStatusModel");
// const AdminActionsData = require("./userRefs/forAdmins/AdminActionsDataModel");
const NTStaffExtendedStatus = require("./userRefs/forNTStaffs/NTStaffExtendedStatusModel");
const LecturerSchoolData = require("./userRefs/forLecturers/LecturerSchoolDataModel");
const LecturerExtendedStatus = require("./userRefs/forLecturers/LecturerExtendedStatusModel");
const StudentsSchoolData = require("./userRefs/forStudents/StudentSchoolDataModel");
const StudentPromotion = require("./userRefs/forStudents/StudentPromotionModel");
const SensosaSchoolData = require("./userRefs/forStudents/SensosaSchoolDataModel");
const StudentParent = require("./userRefs/forStudents/ParentsModel");
const StudentGuardian = require("./userRefs/forStudents/GuardianModel");
const SignUpInfo = require("./userRefs/signUpModel/SignUpModel");

const UsersModelSchema = new mongoose.Schema(
  {
    userSignUpDetails: {
      type: SignUpInfo.schema,
    },
    uniqueId: {
      type: String,
      unique: true,
    },
    personalInfo: {
      type: PersonalInfo.schema,
    },
    contactAddress: {
      type: ContactAddress.schema,
    },
    status: {
      type: Status.schema,
    },
    employment: {
      type: Employment.schema,
    },
    // adminActionsData: {
    //   type: AdminActionsData.schema,
    // },
    adminStatusExtend: {
      type: AdminExtendedStatus.schema,
    },
    nTStaffStatusExtend: {
      type: NTStaffExtendedStatus.schema,
    },
    lecturerSchoolData: {
      type: LecturerSchoolData.schema,
    },
    lecturerStatusExtend: {
      type: LecturerExtendedStatus.schema,
    },
    studentSchoolData: {
      type: StudentsSchoolData.schema,
    },
    sensosaSchoolData: {
      type: SensosaSchoolData.schema,
    },
    studentStatusExtend: {
      type: StudentPromotion.schema,
    },
    parent: {
      type: StudentParent.schema,
    },
    guardian: {
      type: StudentGuardian.schema,
    },
    signedUp: {
      type: Boolean,
      default: false,
    },
    signedUpSensosan: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isVerifiedSensosa: {
      type: Boolean,
      default: false,
    },
    hasBeenNotifiedForNextSemester: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    previouslyUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedDate: {
      type: Date,
    },
    roles: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", UsersModelSchema);

module.exports = User;
