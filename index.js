require("dotenv").config();
require("./utils/paymentCron");
const Sentry = require("@sentry/node");
const express = require("express");
const cors = require("cors");
const compression = require("compression");
const sanitize = require("mongo-sanitize");
const responseTime = require("response-time");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const hpp = require("hpp");
const connectDB = require("./database");
const logger = require("./utils/logger");

// ============================
// 🔹 SENTRY INIT (TOP)
// ============================
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || "development",
  tracesSampleRate: 1.0,
});
const mongoose = require("mongoose");

mongoose.set("debug", function (collectionName, method, query, doc) {
  const message = `MongoDB Query: ${collectionName}.${method}`;
  
  if (method === "find" || method === "findOne") {
    console.log(message);
  }
});
console.log("SENTRY_DSN:", process.env.SENTRY_DSN);


// ============================
// 🔹 ROUTES IMPORT
// ============================
const authRoutes = require("./routes/authRoutes");
const protectedRoutes = require("./routes/protectedRoutes");
const adminRoutes = require("./routes/adminRoutes");
const courseRoutes = require("./routes/courseRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const contentRoutes = require("./routes/contentRoutes");
const courseContentRoutes = require("./routes/courseContentRoutes");
const adminContentRoutes = require("./routes/adminContentRoutes");
const lessonRoutes = require("./routes/lessonRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const profileRoutes = require("./routes/profileRoutes");

// ============================
// 🔹 CONNECT DATABASE
// ============================
connectDB();

const app = express();
const helmet = require("helmet");
app.use(helmet());


app.set("trust proxy", 1);

// ============================
// 🔹 REQUEST LOGGING
// ============================
app.use(
  morgan("combined", {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);
app.use((req, res, next) => {
  res.set("Cache-Control", "public, max-age=600");
  next();
});
// ============================
// 🔹 RATE LIMITER
// ============================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests. Please try again later.",
});

app.use(limiter);

// ============================
// 🔹 CORS
// ============================
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://earnprojectacademy-frontend.vercel.app",
      "https://earnprojectacademy.com",
      "https://www.earnprojectacademy.com",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// ============================
// 🔹 BODY PARSER
// ============================
app.use(express.json());
app.use(compression());
app.use(responseTime());
app.use((req, res, next) => {
  if (req.body) {
    req.body = sanitize(req.body);
  }

  if (req.query && typeof req.query === "object") {
    Object.keys(req.query).forEach((key) => {
      req.query[key] = sanitize(req.query[key]);
    });
  }

  next();
});
app.use(hpp());
app.disable("x-powered-by");
// ============================
// 🔹 HEALTH CHECK
// ============================
app.get("/health", (req, res) => {
  const dbState = mongoose.connection.readyState;

  const states = {
    0: "Disconnected",
    1: "Connected",
    2: "Connecting",
    3: "Disconnecting",
  };

  res.status(200).json({
    status: "OK",
    database: states[dbState] || "Unknown",
    uptime: process.uptime(),
    timestamp: new Date(),
  });
});

// ============================
// 🔹 API ROUTES
// ============================

app.use("/api/auth", authRoutes);
app.use("/api/protected", protectedRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/coupons", require("./routes/couponRoutes"));
app.use("/api/courses", courseRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/course-content", courseContentRoutes);
app.use("/api/admin/content", adminContentRoutes);
app.use("/api/admin/analytics", require("./routes/adminAnalyticsRoutes"));
app.use("/api/lessons", lessonRoutes);
app.use("/api/announcements", require("./routes/announcementRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/settings", require("./routes/settingsRoutes"));
app.use("/api/live-classes", require("./routes/liveClassRoutes"));
app.use("/api/profile", profileRoutes);

// ============================
// 🔹 TEST ROUTES (OPTIONAL)
// ============================
app.get("/", (req, res) => {
  res.send("EarnProjectAcademy Backend is running");
});



// ============================
// 🔹 SENTRY ERROR HANDLER (AFTER ROUTES)
// ============================
Sentry.setupExpressErrorHandler(app);

// ============================
// 🔹 GLOBAL ERROR HANDLER (FINAL)
// ============================
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(500).json({
    message: "Something went wrong. Please try again later.",
  });
});

// ============================
// 🔹 START SERVER (ALWAYS LAST)
// ============================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  Sentry.captureException(err);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  Sentry.captureException(err);
});
















