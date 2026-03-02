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

    status: {
      type: String,
      enum: ["PENDING_PAYMENT", "ACTIVE"],
      default: "PENDING_PAYMENT",
    },

    paymentStatus: {
      type: String,
      enum: ["UNPAID", "PAID"],
      default: "UNPAID",
    },

    paymentId: String,

    paymentPlan: {
  type: String,
  enum: ["FULL", "INSTALLMENT"],
  default: "FULL",
},

totalAmount: {
  type: Number,
  default: 27000,
},

amountPaid: {
  type: Number,
  default: 0,
},

remainingAmount: {
  type: Number,
  default: 27000,
},

installmentStage: {
  type: Number,
  default: 0, // 0 = not started, 1 = seat paid, 2 = first paid, 3 = complete
},

nextDueDate: {
  type: Date,
},

isBlocked: {
  type: Boolean,
  default: false,
},

couponApplied: {
  type: String,
},
},
  { timestamps: true }
);

module.exports = mongoose.model("Enrollment", enrollmentSchema);