const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    discountPercent: {
      type: Number,
      required: true, // 5, 8, 10 etc
      min: 1,
      max: 100,
    },

    maxUsage: {
      type: Number,
      default: 100,
    },

    usedCount: {
      type: Number,
      default: 0,
    },

    validFrom: {
      type: Date,
      default: Date.now,
    },

    validUntil: {
      type: Date,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    applicablePlan: {
      type: String,
      enum: ["FULL", "INSTALLMENT", "ALL"],
      default: "FULL",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Coupon", couponSchema);