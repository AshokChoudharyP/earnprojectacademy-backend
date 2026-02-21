const express = require("express");
const router = express.Router();
const Course = require("../models/Course");
const { protect, isAdmin } = require("../middleware/authMiddleware");

// CREATE COURSE (ADMIN ONLY)
router.post("/", protect, isAdmin, async (req, res) => {
  try {
    const { title, description, price, duration } = req.body;

    if (!title || !description || price == null) {
      return res.status(400).json({ message: "All fields required" });
    }

    const course = await Course.create({
      title,
      description,
      price,
      duration,
    });

    res.status(201).json(course);

  } catch (error) {
    console.error("CREATE COURSE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
});

// GET ALL COURSES (PUBLIC)
router.get("/", async (req, res) => {
  const courses = await Course.find();
  res.json(courses);
});

module.exports = router;