const express = require("express");
const router = express.Router();
const Coupon = require("../models/Coupon");
const { protect, isAdmin } = require("../middleware/authMiddleware");

// =====================================
// 🔹 VALIDATE COUPON (Public - Used During Payment)
// =====================================
router.post("/validate", async (req, res) => {
  try {
    const { code, plan } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Coupon code required" });
    }

    const coupon = await Coupon.findOne({
      code: code.toUpperCase().trim(),
    });

    if (!coupon) {
      return res.status(404).json({ message: "Invalid coupon" });
    }

    if (!coupon.isActive) {
      return res.status(400).json({ message: "Coupon inactive" });
    }

    if (coupon.validFrom && coupon.validFrom > new Date()) {
      return res.status(400).json({ message: "Coupon not started yet" });
    }

    if (coupon.validUntil && coupon.validUntil < new Date()) {
      return res.status(400).json({ message: "Coupon expired" });
    }

    if (coupon.usedCount >= coupon.maxUsage) {
      return res.status(400).json({ message: "Coupon usage limit reached" });
    }

    // Plan validation
    if (
      coupon.applicablePlan !== "ALL" &&
      coupon.applicablePlan !== plan?.toUpperCase()
    ) {
      return res.status(400).json({
        message: "Coupon not valid for selected plan",
      });
    }

    return res.status(200).json({
      discountPercent: coupon.discountPercent,
    });

  } catch (err) {
    console.error("Coupon validation error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// =====================================
// 🔹 CREATE COUPON (Admin Only)
// =====================================
router.post("/", protect, isAdmin, async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    return res.status(201).json(coupon);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// =====================================
// 🔹 GET ALL COUPONS (Admin)
// =====================================
router.get("/", protect, isAdmin, async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return res.status(200).json(coupons);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;