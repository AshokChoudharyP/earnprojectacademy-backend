const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const Enrollment = require("../models/Enrollment");
const Module = require("../models/Module");

/**
 * @route   GET /api/content/:courseId
 * @desc    Get course content (PAID students only)
 * @access  Private
 */
router.get("/:courseId", protect, async (req, res) => {
  try {
    const { courseId } = req.params;

    // Check if user has PAID enrollment
    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: courseId,
      paymentStatus: "PAID",
    });

    if (!enrollment) {
      return res
        .status(403)
        .json({ message: "Access denied. Payment required." });
    }

    const modules = await Module.find({ course: courseId });

    res.status(200).json(modules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;