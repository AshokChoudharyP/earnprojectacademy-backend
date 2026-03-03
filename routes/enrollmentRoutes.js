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
      res.status(400).json({ message: "Course ID is required" });
      return;
    }

    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    const existingEnrollment = await Enrollment.findOne({
      user: req.user._id,
      course: courseId,
    });

    if (existingEnrollment) {
      res.status(400).json({
        message: "Already enrolled in this course",
        enrollmentId: existingEnrollment._id,
        paymentStatus: existingEnrollment.paymentStatus,
      });
      return;
    }

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
    return;

  } catch (error) {
    res.status(500).json({ message: error.message });
    return;
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
    return;
  } catch (error) {
    res.status(500).json({ message: error.message });
return;
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
    return;
  } catch (error) {
    res.status(500).json({ message: error.message });
    return;
  }
});

module.exports = router;