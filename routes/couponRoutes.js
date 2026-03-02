const express = require("express");
const router = express.Router();
const Coupon = require("../models/Coupon");

// Validate Coupon
router.post("/validate", async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Coupon code required" });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return res.status(404).json({ message: "Invalid coupon" });
    }

    if (!coupon.isActive) {
      return res.status(400).json({ message: "Coupon inactive" });
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return res.status(400).json({ message: "Coupon expired" });
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ message: "Coupon limit reached" });
    }

    res.status(200).json({
      discountPercent: coupon.discountPercent,
    });

  } catch (err) {
    console.error("Coupon validation error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;