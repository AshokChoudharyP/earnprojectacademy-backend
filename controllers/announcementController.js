const Announcement = require("../models/Announcement");

/**
 * @desc   Create announcement (Admin)
 * @route  POST /api/announcements
 * @access Admin
 */
exports.createAnnouncement = async (req, res) => {
  try {
    const { title, message, course } = req.body;

    if (!title || !message) {
      return res.status(400).json({ message: "Title and message required" });
    }

    const announcement = await Announcement.create({
      title,
      message,
      course: course || null,
      createdBy: req.user._id,
    });

    res.status(201).json(announcement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc   Get announcements for logged-in student
 * @route  GET /api/announcements/my
 * @access Student
 */
exports.getMyAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find({
      isActive: true,
      $or: [{ course: null }, { course: { $in: req.user.enrolledCourses } }],
    })
      .sort({ createdAt: -1 })
      .populate("createdBy", "name");

    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc   Mark announcement as read
 * @route  PUT /api/announcements/read/:id
 * @access Student
 */
exports.markAsRead = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    if (!announcement.readBy.includes(req.user._id)) {
      announcement.readBy.push(req.user._id);
      await announcement.save();
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};