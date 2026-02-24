require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const connectDB = require("./database");


// ROUTES
const authRoutes = require("./routes/authRoutes");
const protectedRoutes = require("./routes/protectedRoutes");
const adminRoutes = require("./routes/adminRoutes")
const courseRoutes = require("./routes/courseRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const contentRoutes = require("./routes/contentRoutes");
const courseContentRoutes = require("./routes/courseContentRoutes");
const adminContentRoutes = require("./routes/adminContentRoutes");
const lessonRoutes = require("./routes/lessonRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const profileRoutes = require("./routes/profileRoutes");

connectDB();

const app = express();
app.set("trust proxy", 1); // ✅ Add this

const morgan = require("morgan");
const logger = require("./utils/logger");

// 🔽 STEP 4 — REQUEST LOGGING
app.use(
  morgan("combined", {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max requests per IP
  message: "Too many requests. Please try again later.",
});

// CORS Middleware
app.use(
  cors({
    origin: [
      "http://localhost:3000", // local dev
      "https://earnprojectacademy-frontend.vercel.app", // production frontend
        "https://earnprojectacademy.com",
         "https://www.earnprojectacademy.com"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  })
);

// 🔹 Middleware to read JSON body
app.use(express.json());

// HEALTH CHECK (DEPLOYMENT REQUIRED)
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    uptime: process.uptime(),
    timestamp: new Date(),
  });
});

//RATE LIMIT HERE
app.use(limiter);

// 🔹 PUBLIC ROUTES
app.use("/api/auth", authRoutes);

// 🔐 AUTHENTICATED ROUTES
app.use("/api/protected", protectedRoutes);

// 👑 ADMIN ONLY ROUTES
app.use("/api/admin", adminRoutes);

// 📚 COURSE ROUTES
app.use("/api/courses", courseRoutes);

// 🎓 ENROLLMENT ROUTES
app.use("/api/enrollments", enrollmentRoutes);

// 🧾 Payment Routes
app.use("/api/payments", paymentRoutes);

// 📖 Content Routes
app.use("/api/content", contentRoutes);

// 🔹 COURSE CONTENT ROUTES (PAID ACCESS)
app.use("/api/course-content", courseContentRoutes);


// 🔹 ADMIN CONTENT ROUTES
app.use("/api/admin/content", adminContentRoutes);

// 🔹 ADMIN ANALYTICS ROUTES
app.use("/api/admin/analytics", require("./routes/adminAnalyticsRoutes"));

// 🔹 LESSON ROUTES
app.use("/api/lessons", lessonRoutes);

app.use("/api/announcements", require("./routes/announcementRoutes"));

// 🔹 DASHBOARD ROUTES
app.use("/api/dashboard", dashboardRoutes);

app.use("/api/announcements", require("./routes/announcementRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/settings", require("./routes/settingsRoutes"));
app.use("/api/live-classes", require("./routes/liveClassRoutes"));


app.use("/api/profile", profileRoutes);

// 🔹 Health check
app.get("/", (req, res) => {
  res.send("EarnProjectAcademy Backend is running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log("server running on port 5000");
});

app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(500).json({
    message: "Something went wrong. Please try again later.",
  });
});


// 🔽 STEP 5 — GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
  logger.error(err.message, { stack: err.stack });
  res.status(500).json({ message: "Internal Server Error" });
});
















