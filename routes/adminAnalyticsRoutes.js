const express = require("express");
const router = express.Router();

const { protect, isAdmin } = require("../middleware/authMiddleware");
const Enrollment = require("../models/Enrollment");
const User = require("../models/User");
const Course = require("../models/Course");

/**
 * @route   GET /api/admin/analytics/overview
 * @desc    Admin analytics overview
 * @access  Private (Admin)
 */
router.get("/overview", protect, isAdmin, async (req, res) => {
  try {
    // Total students
    const totalStudents = await User.countDocuments({ role: "student" });

    // Total courses
    const totalCourses = await Course.countDocuments();

    // Paid enrollments
    const paidEnrollments = await Enrollment.find({
      paymentStatus: "PAID",
    });

    // Total revenue
    let totalRevenue = 0;
    paidEnrollments.forEach((enroll) => {
      totalRevenue += enroll.amount || 0;
    });

    res.json({
      totalStudents,
      totalCourses,
      paidEnrollments: paidEnrollments.length,
      totalRevenue,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   GET /api/admin/analytics/payments
 * @desc    Get recent payments
 * @access  Private (Admin)
 */
router.get("/payments", protect, isAdmin, async (req, res) => {
  try {
    const payments = await Enrollment.find({
      paymentStatus: "PAID",
    })
      .populate("user", "name email")
      .populate("course", "title price")
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;