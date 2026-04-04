const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed_amount'],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrderValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },
    oncePerUser: {
      type: Boolean,
      default: false,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    usageLimit: {
      type: Number,
      default: 0,
      min: 0,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'disabled'],
      default: 'active',
    },
    appliedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

couponSchema.index({ code: 1 }, { unique: true });

couponSchema.virtual('isExpired').get(function () {
  if (!this.endDate) return false;
  return new Date() > this.endDate;
});

couponSchema.methods.getStatus = function () {
  if (this.status === 'disabled') {
    return 'disabled';
  }
  if (this.isExpired) {
    return 'expired';
  }
  if (this.usageLimit > 0 && this.usedCount >= this.usageLimit) {
    return 'expired';
  }
  return 'active';
};

couponSchema.methods.computeDiscount = function (orderAmount) {
  if (!orderAmount || orderAmount <= 0) {
    return 0;
  }

  if (this.discountType === 'percentage') {
    const rawDiscount = Math.round((orderAmount * this.discountValue) / 100);
    if (this.maxDiscount && this.maxDiscount > 0) {
      return Math.min(rawDiscount, this.maxDiscount);
    }
    return rawDiscount;
  }

  return Math.min(this.discountValue, orderAmount);
};

couponSchema.methods.isValidForOrder = function (userId, orderAmount) {
  const now = new Date();

  if (this.status === 'disabled') {
    return { valid: false, reason: 'Coupon is disabled' };
  }

  if (this.startDate && now < this.startDate) {
    return { valid: false, reason: 'Coupon is not active yet' };
  }

  if (this.isExpired) {
    return { valid: false, reason: 'Coupon has expired' };
  }

  if (this.minOrderValue && orderAmount < this.minOrderValue) {
    return { valid: false, reason: `Order must be at least ${this.minOrderValue}` };
  }

  if (this.usageLimit > 0 && this.usedCount >= this.usageLimit) {
    return { valid: false, reason: 'Coupon usage limit has been reached' };
  }

  if (this.oncePerUser && userId && this.appliedUsers.some((user) => user.toString() === userId.toString())) {
    return { valid: false, reason: 'Coupon can only be used once per user' };
  }

  return { valid: true };
};

const Coupon = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);

module.exports = Coupon;
