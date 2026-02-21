const express = require("express");
const router = express.Router();

const LiveClass = require("../models/LiveClass");
const Enrollment = require("../models/Enrollment");
const { protect, isAdmin } = require("../middleware/authMiddleware");

/**
 * ADMIN → Create Live Class
 */
router.post("/", protect, isAdmin, async (req, res) => {
  try {
    const liveClass = await LiveClass.create(req.body);
    res.status(201).json(liveClass);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * STUDENT → Get Live Classes for enrolled course
 */
router.get("/my/:courseId", protect, async (req, res) => {
  const { courseId } = req.params;

  const enrolled = await Enrollment.findOne({
    user: req.user._id,
    course: courseId,
    paymentStatus: "PAID",
  });

  if (!enrolled) {
    return res.status(403).json({ message: "Access denied" });
  }

  const classes = await LiveClass.find({ course: courseId });
  res.json(classes);
});

module.exports = router;