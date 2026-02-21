const express = require("express");
const router = express.Router();

const Announcement = require("../models/Announcement");
const { protect, isAdmin } = require("../middleware/authMiddleware");

/**
 * ADMIN → Create announcement
 */
router.post("/", protect, isAdmin, async (req, res) => {
  try {
    const { title, message, course } = req.body;

    const announcement = await Announcement.create({
      title,
      message,
      course: course || null,
      createdBy: req.user._id,
    });

    res.status(201).json(announcement);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * STUDENT → Get announcements (global + course)
 */
router.get("/my", protect, async (req, res) => {
  try {
    const announcements = await Announcement.find({
      isActive: true,
      $or: [
        { course: null },
        { course: { $in: req.user.enrolledCourses || [] } },
      ],
    })
      .sort({ createdAt: -1 })
      .populate("createdBy", "name");

    res.json(announcements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * STUDENT → Mark announcement as read
 */
router.post("/:id/read", protect, async (req, res) => {
  try {
    await Announcement.findByIdAndUpdate(req.params.id, {
      $addToSet: { readBy: req.user._id },
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;