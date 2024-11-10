const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const app = express();
const cors = require("cors");
const CircuitBreaker = require("opossum");

const UsersRoute = require("./routes/auth/UserRoute");
const AdminsRoute = require("./routes/admins/adminRoutes");
const EmploymentRoute = require("./routes/employmentRoutes/employmentRoutes");
const StudentsRoute = require("./routes/students/studentRoutes");
const ProgrammesRoute = require("./routes/academics/programs/programsRoutes");
const SubjectsRoute = require("./routes/academics/subjects/subjectsRoutes");
const ClassLevelRoute = require("./routes/academics/class/classLevelRoutes");
const ClassLevelSectionRoute = require("./routes/academics/class/classLevelSectionRoutes");
const AcademicYearRoute = require("./routes/academics/year/academicYearRoutes");
const AcademicTermRoute = require("./routes/academics/term/academicTermRoutes");
const AcademicBatchRoute = require("./routes/academics/batches/batchesRoutes");
const SensosanRoute = require("./routes/graduatesRoutes/OldStudentsRoutes");
const StudentPlacementRoute = require("./routes/studentPlacementRoutes/StudentPlacementRoutes");
const PlacementBatchRoute = require("./routes/studentPlacementRoutes/placementBatchRoutes/placementBatchRoutes");
const HouseRoute = require("./routes/academics/house/HouseRoutes");

const start = async () => {
  // Configure CORS options if needed
  const corsOptions = {
    origin: "*", // or '*' to allow all origins
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    // allowedHeaders: "Content-Type,Authorization",
  };
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
    // Error handling middleware for mongo server error
    app.use((err, req, res, next) => {
      console.error(err); // Log the error details
      // Check if the error is related to MongoDB
      if (
        err.name === "MongoNetworkError" ||
        err.name === "MongooseServerSelectionError"
      ) {
        return res.status(503).json({
          message: "Service temporarily unavailable. Please try again later.",
        });
      }
      // For other errors, send a generic error message
      res.status(500).json({ message: "Internal server error." });
    });
    app.use(express.json({ limit: "10mb" })); // to parse the incoming request with JSON payloads [from: req.body]
    app.use(cookieParser());
    app.use(express.urlencoded({ limit: "10mb", extended: true }));
    app.use(cors(corsOptions));
    app.use(dbErrorHandler);

    const port = process.env.PORT || 7006;

    app.use(express.static("public"));
    // Routes
    app.use(
      "/api/sensec_db/v1",
      UsersRoute,
      AdminsRoute,
      EmploymentRoute,
      StudentsRoute,
      ProgrammesRoute,
      SubjectsRoute,
      ClassLevelRoute,
      ClassLevelSectionRoute,
      AcademicYearRoute,
      AcademicTermRoute,
      AcademicBatchRoute,
      SensosanRoute,
      StudentPlacementRoute,
      PlacementBatchRoute,
      HouseRoute
    );

    app.listen(port, () => console.log(`Server listening at port ${port}`));
  } catch (error) {
    throw new Error(`Server could not start!`);
  }
};

start();
