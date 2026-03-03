const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Enrollment = require("../models/Enrollment");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;

    // ✅ MOVE BLOCK CHECK BEFORE next()
    const enrollment = await Enrollment.findOne({ user: req.user._id });

    if (enrollment?.isBlocked) {
      return res.status(403).json({
        message: "Your access is blocked due to pending payment.",
      });
    }

    next(); // 👈 MUST BE LAST LINE

  } catch (error) {
    return res.status(401).json({
      message: "Not authorized, token failed",
    });
  }
};


// 🛡 Admin Role Middleware
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authorized" });
  }

  if (req.user.role?.toLowerCase() !== "admin") {
    return res.status(403).json({ message: "Admin access only" });
  }

  next();
};

module.exports = { protect, isAdmin };
