const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const app = express();
const cors = require("cors");

const UsersRoute = require("./routes/auth/UserRoute");
const StudentsRoute = require("./routes/students/studentRoutes");
const ProgrammesRoute = require("./routes/academics/programs/programsRoutes");
const SubjectsRoute = require("./routes/academics/subjects/subjectsRoutes");
const ClassLevelRoute = require("./routes/academics/class/classLevelRoutes");
const ClassLevelSectionRoute = require("./routes/academics/class/classLevelSectionRoutes");
const AcademicYearRoute = require("./routes/academics/year/academicYearRoutes");

const start = async () => {
  const mongodbConnection = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_URL}/sensec_website`;
  if (!mongodbConnection) {
    throw new Error("auth DB_URI must be defined");
  }
  try {
    await mongoose.connect(mongodbConnection);
    console.log("MongoDB connection successful...");
  } catch (err) {
    console.error(err);
    throw err;
  }

  app.use(express.json({ limit: "2mb" })); // to parse the incoming request with JSON payloads [from: req.body]
  app.use(cookieParser());
  app.use(express.urlencoded({ extended: true }));
  app.use(cors());

  const port = process.env.PORT || 7006;

  app.use(express.static("public"));

  // Admins routes
  //   app.use("/api/admin");

  //   // Teachers routes
  //   app.use("/api/teacher");

  //   // Staffs routes
  //   app.use("/api/nt_staff");

  // Students routes
  app.use(
    "/api/sensec_db/v1",
    UsersRoute,
    StudentsRoute,
    ProgrammesRoute,
    SubjectsRoute,
    ClassLevelRoute,
    ClassLevelSectionRoute,
    AcademicYearRoute
  );

  //   // Users routes
  //   app.use("/api/user");

  //   // Sensosa routes
  //   app.use("/api/sensosa/v1/users");

  app.listen(port, () => console.log(`Server listening at port ${port}`));
};

start();
