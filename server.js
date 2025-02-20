const dotenv = require("dotenv");
const envFile =
  process.env.NODE_ENV === "production" ? ".env.production" : ".env";
dotenv.config({ path: envFile });
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const app = express();
const cors = require("cors");
const CircuitBreaker = require("opossum");
const cron = require("node-cron");
const path = require("path");

const UsersRoute = require("./routes/auth/UserRoute");
const AdminsRoute = require("./routes/admins/adminRoutes");
const EmploymentRoute = require("./routes/employmentRoutes/employmentRoutes");
const StudentsRoute = require("./routes/students/StudentRoutes");
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
const BlogRoute = require("./routes/blogRoutes/blogRoute");
const StudentReportRoute = require("./routes/academics/reports/studentReportRoutes");
const AttendanceRoute = require("./routes/academics/attendance/attendanceRoutes");
const {
  updateCurrentSemester,
  updateAcademicYear,
  notifyNextSemester,
  createNextAcademicYear,
} = require("./middlewares/academics/semesterService");

const start = async (req, res) => {
  try {
    // List of allowed origins
    const allowedOrigins = [
      "https://senyashs.com",
      "https://www.senyashs.com",
      // "https://backend.senyashs.com",
      "https://official-sensec-website.onrender.com",
      "http://localhost:2025",
      "http://192.168.178.22:2025",
      "*",
    ];
    // Configure CORS options if needed
    const corsOptions = {
      origin: function (origin, callback) {
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
          // Allow the request if the origin is in the list or if it's a server-side request (no origin)
          callback(null, true);
        } else {
          // Reject the request if the origin is not in the list
          callback(new Error("Not allowed by CORS"), false);
        }
      },
      // origin: "*",
      // origin: "https://senyashs.com",
      // origin: "https://official-sensec-website.onrender.com", // or '*' to allow all origins
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
    };
    if (process.env.NODE_ENV === "development") {
      app.use(
        cors({
          origin: "http://192.168.178.22:2025", // Local dev server
        })
      );
    }
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

    const mongodbConnection = `${process.env.MONGO_URL}`;
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
        err.name === "MongoServerError" ||
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

    const PORT = process.env.PORT || 7006;
    const HOST = process.env.HOST;
    const API_URL = process.env.API_BASE_URL || `http://${HOST}:7006`;
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
      HouseRoute,
      BlogRoute,
      StudentReportRoute,
      AttendanceRoute
    );

    // Run the update function immediately on server start
    // (async () => {
    //   console.log("Running enrollment code...");
    //   await sendEnrollmentCodeSMS();
    // })();
    // (async () => {
    //   console.log("Running initial semester update...");
    //   await updateCurrentSemester();
    // })();
    // // Run the academic year update on server start
    // (async () => {
    //   console.log("Running initial academic year update...");
    //   await updateAcademicYear(); // Set the current academic year on server start
    // })();
    // (async () => {
    //   console.log("Running next semester notification...");
    //   await notifyNextSemester(); // Set next semester notification on server start
    // })();
    // (async () => {
    //   console.log("Running create next academic year...");
    //   await createNextAcademicYear(); // Set next semester notification on server start
    // })();
    // Schedule the cron job
    cron.schedule("0 0 * * *", async () => {
      await updateCurrentSemester();
    });
    // Cron job to update the academic year daily at midnight
    cron.schedule("0 0 * * *", async () => {
      await updateAcademicYear();
    });
    // Run daily at midnight
    cron.schedule("0 0 * * *", async () => {
      await notifyNextSemester();
    });
    // Schedule the function to run at midnight on September 1
    cron.schedule("0 0 1 9 *", async () => {
      await createNextAcademicYear();
    });

    app.listen(PORT, HOST, () =>
      console.log(
        `Server running in ${process.env.NODE_ENV} mode and hosted on ${API_URL}`
      )
    );
  } catch (error) {
    console.log(error);
    res.status(500).json({
      errorMessage: {
        message: [`Server could not start!`],
      },
    });
    process.exit(1); // Exit the app if the connection fails
    // throw new Error(`Server could not start!`);
  }
};

start();

// // For Server Setting on VPS
// proxy_pass http://localhost:7006;
// proxy_http_version 1.1;
// proxy_set_header Upgrade $http_upgrade;
// proxy_set_header Connection 'upgrade';
// proxy_set_header Host $host;
// proxy_cache_bypass $http_upgrade;
// proxy_set_header X-Real-IP $remote_addr;
// proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
// proxy_set_header X-Forwarded-Proto $scheme;
// proxy_connect_timeout 90;
// proxy_send_timeout 90;
// proxy_read_timeout 90;
// server {
//     if ($host = www.senyashs.com) {
//         return 301 https://$host$request_uri;
//     } # managed by Certbot

//     if ($host = senyashs.com) {
//         return 301 https://$host$request_uri;
//     } # managed by Certbot

//     listen 80;
//     server_name senyashs.com www.senyashs.com;

//     return 301 https://$host$request_uri;
// }
// # Error page or redirect if needed
//     error_page 502 /502.html;
//     location = /502.html {
//         root /usr/share/nginx/html;
//         internal;
//     }
