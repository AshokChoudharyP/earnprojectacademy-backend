const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const sendEmail = require("../utils/sendEmail");
const paymentSuccessTemplate = require("../templates/paymentSuccess");
const User = require("../models/User");
const Course = require("../models/Course");

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
    const { enrollmentId } = req.body;

    if (!enrollmentId) {
      return res.status(400).json({ message: "Enrollment ID is required" });
    }

    const enrollment = await Enrollment.findById(enrollmentId).populate("course");

    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    if (enrollment.paymentStatus === "PAID") {
      return res.status(400).json({ message: "Payment already completed" });
    }

    const amount = enrollment.course.price * 100; // Razorpay uses paise

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `receipt_${enrollmentId}`,
    });

    res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
  console.error("🔥 ORDER CREATE ERROR:", error);
  res.status(500).json({
    message: error.message,
    stack: error.stack,
  });
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
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !enrollmentId
    ) {
      return res.status(400).json({ message: "Missing payment details" });
    }

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
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    // ✅ Payment verified
    enrollment.paymentStatus = "PAID";
    enrollment.status = "ACTIVE";
    enrollment.paymentId = razorpay_payment_id;

    await enrollment.save();

    const transporter = require("../config/mailer");
const User = require("../models/User");

const user = await User.findById(enrollment.user);
const course = await Course.findById(enrollment.course);

try {
  await sendEmail({
    to: user.email,
    subject: "Payment Successful – Welcome to EarnProjectAcademy 🎉",
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>🎉 Payment Successful</h2>

        <p>Hi <strong>${user.name}</strong>,</p>

        <p>Your payment has been successfully received.</p>

        <p>
          <strong>Course:</strong> ${course.title}
        </p>

        <p>
          ✅ Your dashboard is now unlocked <br/>
          ✅ You can start learning immediately
        </p>

        <a href="http://localhost:3000/dashboard"
           style="
             display:inline-block;
             margin-top:16px;
             padding:12px 18px;
             background:#4f46e5;
             color:#fff;
             text-decoration:none;
             border-radius:6px;
           ">
          Go to Dashboard
        </a>

        <p style="margin-top:24px;">
          – EarnProjectAcademy Team
        </p>
      </div>
    `,
  });
} catch (emailError) {
  console.error("❌ Email failed:", emailError.message);
}

    res.status(200).json({
      message: "Payment verified successfully",
      enrollmentId: enrollment._id,
    });
  } catch (error) {
    console.error("❌ Payment verification error:", error);
    res.status(500).json({ message: "Payment verification failed" });
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
module.exports = router;