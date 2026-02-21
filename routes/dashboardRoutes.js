const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const Enrollment = require("../models/Enrollment");
const Announcement = require("../models/Announcement");
const Lesson = require("../models/Lesson");

// STUDENT DASHBOARD
router.get("/student", protect, async (req, res) => {
  try {
    // Courses
    const enrollments = await Enrollment.find({ user: req.user._id })
      .populate("course");

    const courses = enrollments.map(e => ({
      _id: e.course._id,
      title: e.course.title,
      duration: e.course.duration,
      progress: e.progressPercentage || 0,
    }));

    // Today Live Class
    const todayLive = await Lesson.findOne({
      type: "LIVE",
      scheduledAt: {
        $gte: new Date(new Date().setHours(0, 0, 0)),
        $lte: new Date(new Date().setHours(23, 59, 59)),
      },
    });

    // Announcements
    const announcements = await Announcement.find()
      .sort({ createdAt: -1 })
      .limit(3);

    res.json({
      courses,
      todayLive: todayLive
        ? {
            title: todayLive.title,
            time: todayLive.scheduledAt,
            link: todayLive.liveLink,
          }
        : null,
      announcements,
    });

  } catch (err) {
    res.status(500).json({ message: "Dashboard error" });
  }
});

module.exports = router;