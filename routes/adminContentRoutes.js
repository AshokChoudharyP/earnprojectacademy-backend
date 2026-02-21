const express = require("express");
const router = express.Router();

const { protect, isAdmin } = require("../middleware/authMiddleware");
const Module = require("../models/Module");

/**
 * CREATE MODULE
 */
router.post("/module", protect, isAdmin, async (req, res) => {
  const { courseId, title } = req.body;

  const module = await Module.create({
    course: courseId,
    title,
    lessons: [],
  });

  res.status(201).json(module);
});

/**
 * ADD LESSON TO MODULE
 */
router.post("/lesson", protect, isAdmin, async (req, res) => {
  const { moduleId, title, type, content } = req.body;

  const module = await Module.findById(moduleId);
  if (!module) {
    return res.status(404).json({ message: "Module not found" });
  }

  module.lessons.push({ title, type, content });
  await module.save();

  res.status(200).json(module);
});

module.exports = router;