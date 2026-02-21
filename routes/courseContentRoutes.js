const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const Enrollment = require("../models/Enrollment");
const Module = require("../models/Module");
const Lesson = require("../models/Lesson");
const Progress = require("../models/Progress");

/**
 * GET course content + progress
 */
router.get("/:courseId", protect, async (req, res) => {
  try {
    const { courseId } = req.params;

    // 1️⃣ Check enrollment
    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: courseId,
      paymentStatus: "PAID",
    });

    if (!enrollment) {
      return res.status(403).json({ message: "Access denied" });
    }

    // 2️⃣ Get modules
    const modules = await Module.find({ course: courseId }).sort({ order: 1 });

    // 3️⃣ Attach lessons to each module
    const modulesWithLessons = [];

    for (const module of modules) {
      const lessons = await Lesson.find({
        module: module._id,
      }).sort({ order: 1 });

      modulesWithLessons.push({
        ...module.toObject(),
        lessons,
      });
    }

    // 4️⃣ Get or create progress
    let progress = await Progress.findOne({
      user: req.user._id,
      course: courseId,
    });

    if (!progress) {
      progress = await Progress.create({
        user: req.user._id,
        course: courseId,
        completedLessons: [],
        progressPercentage: 0,
      });
    }

    res.json({
      modules: modulesWithLessons,
      progress,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * MARK LESSON COMPLETE
 */
router.post("/complete", protect, async (req, res) => {
  try {
    const { courseId, lessonId } = req.body;

    // 1️⃣ Ensure enrollment
    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: courseId,
      paymentStatus: "PAID",
    });

    if (!enrollment) {
      return res.status(403).json({ message: "Access denied" });
    }

    // 2️⃣ Get progress
    let progress = await Progress.findOne({
      user: req.user._id,
      course: courseId,
    });

    if (!progress) {
      progress = await Progress.create({
        user: req.user._id,
        course: courseId,
        completedLessons: [],
        progressPercentage: 0,
      });
    }

    // 3️⃣ Mark lesson complete
    if (!progress.completedLessons.includes(lessonId)) {
      progress.completedLessons.push(lessonId);
    }

    progress.lastAccessedLesson = lessonId;

    // 4️⃣ Calculate progress SAFELY
    const totalLessons = await Lesson.countDocuments({ course: courseId });

    progress.progressPercentage = Math.round(
      (progress.completedLessons.length / totalLessons) * 100
    );

    await progress.save();

    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/today/live", protect, async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const liveLesson = await Lesson.findOne({
    type: "LIVE",
    scheduledAt: {
      $gte: today,
      $lt: new Date(today.getTime() + 86400000),
    },
  }).populate("course");

  res.json(liveLesson);
});

module.exports = router;