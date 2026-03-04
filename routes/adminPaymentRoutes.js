const express = require("express");
const router = express.Router();
const Enrollment = require("../models/Enrollment");
const { protect, isAdmin } = require("../middleware/authMiddleware");

router.get("/payments", protect, isAdmin, async (req, res) => {

  const enrollments = await Enrollment.find()
    .populate("user", "name email")
    .populate("course", "title price")
    .sort({ createdAt: -1 });

  res.json(enrollments);

});

module.exports = router;