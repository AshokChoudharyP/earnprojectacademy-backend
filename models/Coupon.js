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

  description: {
    type: String,
  },

  discountPercent: {
    type: Number,
    required: true,
    min: 1,
    max: 100,
  },

  applicablePlan: {
    type: String,
    enum: ["FULL", "INSTALLMENT", "ALL"],
    default: "FULL",
  },

  minPurchaseAmount: {
    type: Number,
    default: 0,
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

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }

},
{ timestamps: true }
);

module.exports = mongoose.model("Coupon", couponSchema);