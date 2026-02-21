const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const Notification = require("../models/Notification");

// GET NOTIFICATIONS
router.get("/", protect, async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
    .populate("announcement")
    .sort({ createdAt: -1 });

  res.json(notifications);
});

// MARK AS READ
router.post("/read/:id", protect, async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, {
    isRead: true,
  });

  res.json({ message: "Notification marked as read" });
});

module.exports = router;