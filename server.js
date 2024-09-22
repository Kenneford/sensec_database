const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const app = express();
const cors = require("cors");
const CircuitBreaker = require("opossum");

const UsersRoute = require("./routes/auth/UserRoute");
const StudentsRoute = require("./routes/students/studentRoutes");
const ProgrammesRoute = require("./routes/academics/programs/programsRoutes");
const SubjectsRoute = require("./routes/academics/subjects/subjectsRoutes");
const ClassLevelRoute = require("./routes/academics/class/classLevelRoutes");
const ClassLevelSectionRoute = require("./routes/academics/class/classLevelSectionRoutes");
const AcademicYearRoute = require("./routes/academics/year/academicYearRoutes");
const AcademicTermRoute = require("./routes/academics/term/academicTermRoutes");
const AcademicBatchRoute = require("./routes/academics/batches/batchesRoutes");

const start = async () => {
  // Database connection error middleware
  function dbErrorHandler(err, req, res, next) {
    if (
      err.name === "MongoNetworkError" ||
      err.message.includes("failed to connect")
    ) {
      console.error("Database connection failed");
      return res
        .status(500)
        .json({ message: "Database unavailable, please try again later" });
    }
    next(err); // Pass to the next error handler
  }

  try {
    const mongodbConnection = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_URL}/sensec_website`;
    if (!mongodbConnection) {
      throw new Error("auth DB_URI must be defined");
    }
    try {
      const connect = await mongoose.connect(mongodbConnection, {
        connectTimeoutMS: 10000, // 10 seconds to establish a connection
        socketTimeoutMS: 45000, // 45 seconds for socket inactivity
      });
      const breaker = new CircuitBreaker(connect, {
        errorThresholdPercentage: 50, // Fail if 50% of requests fail
        timeout: 10000, // Timeout in 10 seconds
        resetTimeout: 30000, // Try again after 30 seconds
      });

      breaker
        .fire()
        .then(() => console.log("MongoDB connection successful..."))
        .catch((err) => console.error("MongoDB connection failed:", err));
      // console.log("MongoDB connection successful...");
    } catch (err) {
      console.error(err);
      throw err;
    }

    app.use(express.json({ limit: "2mb" })); // to parse the incoming request with JSON payloads [from: req.body]
    app.use(cookieParser());
    app.use(express.urlencoded({ extended: true }));
    app.use(cors());
    app.use(dbErrorHandler);

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
      AcademicYearRoute,
      AcademicTermRoute,
      AcademicBatchRoute
    );

    app.listen(port, () => console.log(`Server listening at port ${port}`));
  } catch (error) {
    throw new Error(`Server could not start!`);
  }
};

start();
