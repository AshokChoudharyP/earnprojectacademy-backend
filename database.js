const mongoose = require("mongoose");
const dns = require("dns");
const Sentry = require("@sentry/node");

dns.setDefaultResultOrder("ipv4first");

const connectDB = async () => {
  try {
    console.log("MONGO_URL =", process.env.MONGO_URL);

    await mongoose.connect(process.env.MONGO_URL);

    console.log("MongoDB connected successfully");

  } catch (error) {
    console.error("MongoDB connection error:", error.message);

    // ✅ NEW: Send DB connection error to Sentry
    Sentry.captureException(error);

    process.exit(1);
  }
};

// ✅ NEW: Connection Event Monitoring

mongoose.connection.on("connected", () => {
  console.log("MongoDB connection established");
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB runtime error:", err);

  // Send runtime DB errors to Sentry
  Sentry.captureException(err);
});

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected");
});

mongoose.connection.on("reconnected", () => {
  console.log("MongoDB reconnected");
});

// ✅ OPTIONAL (Safe Debug - only in development)
if (process.env.NODE_ENV === "development") {
  mongoose.set("debug", true);
}

module.exports = connectDB;