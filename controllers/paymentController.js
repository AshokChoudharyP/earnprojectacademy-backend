const razorpay = require("../config/razorpay");
const crypto = require("crypto");
const Enrollment = require("../models/Enrollment");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

exports.createOrder = async (req, res) => {
  try {
    const { enrollmentId, amount } = req.body;

    const order = await razorpay.orders.create({
      amount: amount * 100, // Razorpay uses paise
      currency: "INR",
      receipt: `receipt_${enrollmentId}`,
    });

    res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    res.status(500).json({ message: "Order creation failed" });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      enrollmentId,
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    // ✅ Payment verified
    const enrollment = await Enrollment.findById(enrollmentId).populate("user");

    enrollment.status = "ACTIVE";
    enrollment.paymentStatus = "PAID";
    enrollment.paymentId = razorpay_payment_id;
    await enrollment.save();

    // ✅ Send confirmation email
    await sendEmail({
      to: enrollment.user.email,
      subject: "Payment Successful – EarnProjectAcademy",
      html: `
        <h2>Payment Successful 🎉</h2>
        <p>Your enrollment is confirmed.</p>
        <p><b>Program:</b> Freelance Income Accelerator</p>
        <p>You can now login and access your dashboard.</p>
      `,
    });

    res.status(200).json({ message: "Payment verified successfully" });
  } catch (error) {
    res.status(500).json({ message: "Payment verification failed" });
  }
};