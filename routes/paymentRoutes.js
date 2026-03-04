const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const Coupon = require("../models/Coupon");
const paymentSuccessTemplate = require("../templates/paymentSuccess");
const User = require("../models/User");
const Course = require("../models/Course");
const { sendPaymentEmail } = require("../utils/resendMailer");
const { protect } = require("../middleware/authMiddleware");
const razorpay = require("../config/razorpay");
const Enrollment = require("../models/Enrollment");

console.log("KEY:", process.env.RAZORPAY_KEY_ID);
console.log("SECRET:", process.env.RAZORPAY_KEY_SECRET);



/**
 * @route   POST /api/payments/create-order
 * @desc    Create Razorpay order
 * @access  Private (Student)
 */
router.post("/create-order", protect, async (req, res) => {
  try {
    const { enrollmentId, couponCode } = req.body;
    const plan = req.body.plan?.toLowerCase();
    console.log("PLAN RECEIVED:", plan);
    if (!enrollmentId || !plan) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const enrollment = await Enrollment.findById(enrollmentId).populate("course");

    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    let finalAmount;

    // ==========================
    // 🔹 PLAN LOGIC
    // ==========================
    if (plan === "full") {
      finalAmount = enrollment.course.price; // ₹27,000
    } 
    else if (plan === "admission") {
      finalAmount = 4999; // Admission fee
    } 
    else {
      return res.status(400).json({ message: "Invalid plan selected" });
    }

    // ==========================
    // 🔹 COUPON LOGIC (FULL ONLY)
    // ==========================
    if (couponCode && plan === "full") {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase().trim(),
      });

      if (!coupon) {
        return res.status(400).json({ message: "Invalid coupon" });
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

      if (
        coupon.applicablePlan !== "ALL" &&
        coupon.applicablePlan !== "FULL"
      ) {
        return res.status(400).json({
          message: "Coupon not valid for this plan",
        });
      }

      const discount = (finalAmount * coupon.discountPercent) / 100;
      finalAmount = finalAmount - discount;
    }

    // ==========================
    // 🔹 CREATE RAZORPAY ORDER
    // ==========================
    const order = await razorpay.orders.create({
      amount: Math.round(finalAmount * 100), // convert to paise
      currency: "INR",
      receipt: `inst_${enrollmentId.slice(-8)}_${Date.now().toString().slice(-6)}`,
    });

    return res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });

  } catch (error) {
    console.error("ORDER CREATE ERROR:", error);
    return res.status(500).json({ message: "Payment failed" });
  }
});


/**
 * @route   POST /api/payments/verify
 * @desc    Verify Razorpay payment
 * @access  Private (Student)
 */
router.post("/verify", protect, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      enrollmentId,
      plan,
      couponCode,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !enrollmentId ||
      !plan
    ) {
      return res.status(400).json({ message: "Missing payment details" });
    }

    const enrollment = await Enrollment.findById(enrollmentId).populate("course");

    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    // ==============================
    // 🔐 SIGNATURE VERIFICATION
    // ==============================
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    const coursePrice = enrollment.course.price;

    // ======================================
    // 💰 FULL PAYMENT LOGIC
    // ======================================
    if (plan === "full") {

      enrollment.paymentPlan = "FULL";
      enrollment.totalPaid = coursePrice;
      enrollment.remainingAmount = 0;
      enrollment.paymentStatus = "PAID";
      enrollment.status = "ACTIVE";
      enrollment.installmentStage = 3;
      enrollment.isBlocked = false;

      // Handle coupon increment
      if (couponCode) {
        const coupon = await Coupon.findOne({
          code: couponCode.toUpperCase(),
        });

        if (coupon) {
          coupon.usedCount += 1;
          await coupon.save();

          enrollment.appliedCoupon = coupon.code;
          enrollment.discountPercent = coupon.discountPercent;
        }
      }
    }

    // ======================================
    // 💳 INSTALLMENT (ADMISSION) LOGIC
    // ======================================
    if (plan === "admission") {

      enrollment.paymentPlan = "INSTALLMENT";
      enrollment.totalPaid = 4999;
      enrollment.remainingAmount = coursePrice - 4999;
      enrollment.paymentStatus = "PARTIAL";
      enrollment.status = "ACTIVE";
      enrollment.installmentStage = 1;

      // Next due date = 30 days from now
      const nextDue = new Date();
      nextDue.setDate(nextDue.getDate() + 30);
      enrollment.nextDueDate = nextDue;

      enrollment.isBlocked = false;
    }

    enrollment.paymentId = razorpay_payment_id;

    await enrollment.save();

    // ======================================
    // 📧 SEND PAYMENT EMAIL
    // ======================================
    const { sendPaymentEmail } = require("../utils/resendMailer");
    const User = require("../models/User");
    const Course = require("../models/Course");

    const user = await User.findById(enrollment.user);
    const course = await Course.findById(enrollment.course);

    try {
      await sendPaymentEmail({
        to: user.email,
        userName: user.name,
        courseTitle: course.title,
      });
    } catch (emailError) {
      console.error("❌ Email failed:", emailError.message);
    }

    return res.status(200).json({
      message: "Payment verified successfully",
      enrollmentId: enrollment._id,
    });

  } catch (error) {
    console.error("❌ Payment verification error:", error);
    return res.status(500).json({ message: "Payment verification failed" });
  }
});

router.get("/test-razorpay", async (req, res) => {
  try {
    const order = await razorpay.orders.create({
      amount: 100,
      currency: "INR",
      receipt: "test_receipt",
    });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/create-installment-order", protect, async (req, res) => {
  try {
    const { enrollmentId } = req.body;

    const enrollment = await Enrollment.findById(enrollmentId);

    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    if (enrollment.paymentPlan !== "INSTALLMENT") {
      return res.status(400).json({ message: "Not installment plan" });
    }

    if (enrollment.paymentStatus === "PAID") {
      return res.status(400).json({ message: "Already fully paid" });
    }

    let amount;

    if (enrollment.installmentStage === 1) {
      amount = 10000;
    } else if (enrollment.installmentStage === 2) {
      amount = 12000;
    } else {
      return res.status(400).json({ message: "Invalid installment stage" });
    }

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `inst_${enrollmentId.slice(-8)}_${Date.now().toString().slice(-6)}`,
    });

    return res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });

  } catch (error) {
    console.error("Installment order error:", error);
    return res.status(500).json({ message: "Failed to create installment order" });
  }
});

router.post("/verify-installment", protect, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      enrollmentId,
    } = req.body;

    const enrollment = await Enrollment.findById(enrollmentId);

    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    // =============================
    // STAGE UPDATE LOGIC
    // =============================
    if (enrollment.installmentStage === 1) {
      enrollment.totalPaid += 10000;
      enrollment.remainingAmount -= 10000;
      enrollment.installmentStage = 2;

      const nextDue = new Date();
      nextDue.setDate(nextDue.getDate() + 30);
      enrollment.nextDueDate = nextDue;

    } else if (enrollment.installmentStage === 2) {
      enrollment.totalPaid += 12000;
      enrollment.remainingAmount -= 12000;
      enrollment.installmentStage = 3;
      enrollment.paymentStatus = "PAID";
      enrollment.nextDueDate = null;
    }

    enrollment.isBlocked = false;

    await enrollment.save();

    return res.status(200).json({
      message: "Installment payment successful",
    });

  } catch (error) {
    console.error("Installment verify error:", error);
    return res.status(500).json({ message: "Installment verification failed" });
  }
});
module.exports = router;