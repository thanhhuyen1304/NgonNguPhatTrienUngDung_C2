const mongoose = require('mongoose');
const Coupon = require('../schemas/Coupon');

const getCouponByCode = async (code) => {
  if (!code) return null;
  return Coupon.findOne({ code: code.trim().toUpperCase() });
};

const calculateCouponDiscount = (coupon, orderAmount) => {
  if (!coupon || orderAmount <= 0) {
    return 0;
  }
  return coupon.computeDiscount(orderAmount);
};

const validateCoupon = async ({ code, userId, orderAmount = 0 }) => {
  const coupon = await getCouponByCode(code);
  if (!coupon) {
    return { valid: false, reason: 'Coupon not found' };
  }

  const validation = coupon.isValidForOrder(userId, orderAmount);
  if (!validation.valid) {
    return { valid: false, reason: validation.reason };
  }

  const discountAmount = calculateCouponDiscount(coupon, orderAmount);
  if (discountAmount <= 0) {
    return { valid: false, reason: 'Coupon does not apply to this order amount' };
  }

  return {
    valid: true,
    coupon,
    discountAmount,
  };
};

const applyCouponToOrder = async ({ coupon, userId, session }) => {
  if (!coupon) {
    throw new Error('Coupon is required to apply');
  }

  const updateQuery = { _id: coupon._id };
  const updatePayload = {
    $inc: { usedCount: 1 },
  };

  if (coupon.oncePerUser) {
    updatePayload.$addToSet = { appliedUsers: userId };
  }

  if (coupon.usageLimit > 0 && coupon.usedCount + 1 >= coupon.usageLimit) {
    updatePayload.$set = { status: 'expired' };
  }

  const updated = await Coupon.findOneAndUpdate(updateQuery, updatePayload, {
    new: true,
    session,
  });

  if (!updated) {
    throw new Error('Failed to update coupon usage');
  }

  return updated;
};

module.exports = {
  getCouponByCode,
  calculateCouponDiscount,
  validateCoupon,
  applyCouponToOrder,
};
