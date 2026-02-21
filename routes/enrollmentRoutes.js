const express = require("express");
const router = express.Router();

const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const { protect, isAdmin } = require("../middleware/authMiddleware");

/**
 * @route   POST /api/enrollments
 * @desc    Create enrollment (Step before payment)
 * @access  Private (Student)
 */
router.post("/", protect, async (req, res) => {
  try {
    const {
      courseId,
      education,
      experience,
      currentRole,
      skills,
      expectations,
    } = req.body;

    if (!courseId) {
      return res.status(400).json({ message: "Course ID is required" });
    }

    // 1️⃣ Check course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // 2️⃣ Prevent duplicate enrollment
    const existingEnrollment = await Enrollment.findOne({
      user: req.user._id,
      course: courseId,
    });

    if (existingEnrollment) {
      return res.status(400).json({
        message: "Already enrolled in this course",
        enrollmentId: existingEnrollment._id,
        paymentStatus: existingEnrollment.paymentStatus,
      });
    }

    // 3️⃣ Create enrollment (NO PAYMENT YET)
    const enrollment = await Enrollment.create({
      user: req.user._id,
      course: courseId,
      education,
      experience,
      currentRole,
      skills,
      expectations,
      status: "PENDING_PAYMENT",
      paymentStatus: "UNPAID",
    });

    res.status(201).json({
      enrollmentId: enrollment._id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   GET /api/enrollments/my
 * @desc    Get logged-in user's enrollments
 * @access  Private (Student)
 */
router.get("/my", protect, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({
      user: req.user._id,
    }).populate("course", "title description price");

    res.status(200).json(enrollments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route   GET /api/enrollments
 * @desc    Get all enrollments (Admin)
 * @access  Private (Admin)
 */
router.get("/", protect, isAdmin, async (req, res) => {
  try {
    const enrollments = await Enrollment.find()
      .populate("user", "name email role")
      .populate("course", "title price");

    res.status(200).json(enrollments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;