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
  },
  { timestamps: true }
);

module.exports = mongoose.model("Enrollment", enrollmentSchema);