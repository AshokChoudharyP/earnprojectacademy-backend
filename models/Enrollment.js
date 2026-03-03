const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    education: String,
    experience: String,
    currentRole: String,
    skills: [String],
    expectations: String,

    // =========================
    // 🔹 COURSE STATUS
    // =========================
    status: {
      type: String,
      enum: ["PENDING_PAYMENT", "ACTIVE"],
      default: "PENDING_PAYMENT",
    },

    // =========================
    // 🔹 PAYMENT STATUS
    // =========================
    paymentStatus: {
      type: String,
      enum: ["UNPAID", "PARTIAL", "PAID"],
      default: "UNPAID",
    },

    paymentId: String,

    // =========================
    // 🔹 PAYMENT PLAN
    // =========================
    paymentPlan: {
      type: String,
      enum: ["FULL", "INSTALLMENT"],
      default: "FULL",
    },

    // =========================
    // 🔹 BILLING TRACKING
    // =========================
    totalAmount: {
      type: Number,
      default: 27000,
    },

    totalPaid: {
      type: Number,
      default: 0,
    },

    remainingAmount: {
      type: Number,
      default: 27000,
    },

    installmentStage: {
      type: Number,
      default: 0,
      // 0 = none
      // 1 = admission paid
      // 2 = first installment paid
      // 3 = completed
    },

    nextDueDate: {
      type: Date,
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    // =========================
    // 🔹 COUPON TRACKING
    // =========================
    appliedCoupon: {
      type: String,
    },

    discountPercent: {
      type: Number,
      default: 0,
    },

  },
  { timestamps: true }
);

module.exports = mongoose.model("Enrollment", enrollmentSchema);