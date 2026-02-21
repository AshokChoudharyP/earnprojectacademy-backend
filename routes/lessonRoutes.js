const express = require("express");
const router = express.Router();

const Lesson = require("../models/Lesson");
const { protect, isAdmin } = require("../middleware/authMiddleware");

/**
 * @route   POST /api/lessons
 * @desc    Create lesson (Admin)
 */
router.post("/", protect, isAdmin, async (req, res) => {
  try {
    const lesson = await Lesson.create(req.body);
    res.status(201).json(lesson);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;