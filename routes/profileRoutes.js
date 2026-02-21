const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const User = require("../models/User");

// ✅ Get logged-in profile
router.get("/me", protect, async (req, res) => {
  res.json(req.user);
});

// ✅ Update profile (name only)
router.put("/update", protect, async (req, res) => {
  const { name } = req.body;

  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  user.name = name || user.name;
  await user.save();

  res.json({
    message: "Profile updated",
    user,
  });
});

module.exports = router;