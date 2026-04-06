const Coupon = require('../schemas/Coupon');
const { AppError } = require('../middleware/error');

const serializeCoupon = (coupon) => ({
  _id: coupon._id,
  code: coupon.code,
  discountType: coupon.discountType,
  discountValue: coupon.discountValue,
  minOrderValue: coupon.minOrderValue,
  maxDiscount: coupon.maxDiscount,
  oncePerUser: coupon.oncePerUser,
  startDate: coupon.startDate,
  endDate: coupon.endDate,
  usageLimit: coupon.usageLimit,
  usedCount: coupon.usedCount,
  status: typeof coupon.getStatus === 'function' ? coupon.getStatus() : coupon.status,
});

const buildCouponPayload = (payload = {}) => ({
  code: payload.code,
  discountType: payload.discountType,
  discountValue: payload.discountValue,
  minOrderValue: payload.minOrderValue || 0,
  maxDiscount: payload.maxDiscount || 0,
  oncePerUser: payload.oncePerUser || false,
  startDate: payload.startDate,
  endDate: payload.endDate,
  usageLimit: payload.usageLimit || 0,
  status: payload.status || 'active',
});

const getCouponOrThrow = async (couponId) => {
  const coupon = await Coupon.findById(couponId);
  if (!coupon) {
    throw new AppError('Coupon not found', 404);
  }
  return coupon;
};

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

  return { valid: true, coupon, discountAmount };
};

const applyCouponToOrder = async ({ coupon, userId, session }) => {
  if (!coupon) {
    throw new Error('Coupon is required to apply');
  }

  const updatePayload = { $inc: { usedCount: 1 } };
  if (coupon.oncePerUser) {
    updatePayload.$addToSet = { appliedUsers: userId };
  }
  if (coupon.usageLimit > 0 && coupon.usedCount + 1 >= coupon.usageLimit) {
    updatePayload.$set = { status: 'expired' };
  }

  const updated = await Coupon.findOneAndUpdate(
    { _id: coupon._id },
    updatePayload,
    { new: true, session }
  );

  if (!updated) {
    throw new Error('Failed to update coupon usage');
  }

  return updated;
};

const validateCouponCode = async ({ code, userId, orderAmount = 0 }) => {
  const result = await validateCoupon({ code, userId, orderAmount });

  if (!result.valid) {
    throw new AppError(result.reason, 400);
  }

  return {
    coupon: serializeCoupon(result.coupon),
    discountAmount: result.discountAmount,
  };
};

module.exports = {
  serializeCoupon,
  buildCouponPayload,
  getCouponOrThrow,
  getCouponByCode,
  calculateCouponDiscount,
  validateCoupon,
  applyCouponToOrder,
  validateCouponCode,
};
