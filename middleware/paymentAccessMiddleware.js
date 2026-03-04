const Enrollment = require("../models/Enrollment");

const checkPaymentAccess = async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findOne({
      user: req.user._id,
    });

    if (!enrollment) {
      return next();
    }

    // Block access if payment overdue
    if (enrollment.isBlocked) {
      return res.status(403).json({
        message: "Your course access is blocked due to pending payment.",
      });
    }

    next();

  } catch (error) {
    console.error("Payment access error:", error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = checkPaymentAccess;