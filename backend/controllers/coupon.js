const asyncHandler = require('express-async-handler');
const Coupon = require('../schemas/Coupon');
const { AppError } = require('../middleware/error');
const {
  buildCouponPayload,
  getCouponOrThrow,
  validateCouponCode: validateCouponCodeHelper,
} = require('../utils/couponHelpers');

const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create(buildCouponPayload(req.body));

  res.status(201).json({
    success: true,
    message: 'Coupon created successfully',
    data: { coupon },
  });
});

const getCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.json({
    success: true,
    data: { coupons },
  });
});

const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await getCouponOrThrow(req.params.id);

  coupon.code = req.body.code || coupon.code;
  coupon.discountType = req.body.discountType || coupon.discountType;
  coupon.discountValue = req.body.discountValue ?? coupon.discountValue;
  coupon.minOrderValue = req.body.minOrderValue ?? coupon.minOrderValue;
  coupon.maxDiscount = req.body.maxDiscount ?? coupon.maxDiscount;
  coupon.oncePerUser = req.body.oncePerUser ?? coupon.oncePerUser;
  coupon.startDate = req.body.startDate || coupon.startDate;
  coupon.endDate = req.body.endDate || coupon.endDate;
  coupon.usageLimit = req.body.usageLimit ?? coupon.usageLimit;
  coupon.status = req.body.status || coupon.status;

  await coupon.save();

  res.json({
    success: true,
    message: 'Coupon updated successfully',
    data: { coupon },
  });
});

const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await getCouponOrThrow(req.params.id);
  await coupon.deleteOne();

  res.json({
    success: true,
    message: 'Coupon deleted successfully',
  });
});

const validateCouponCode = asyncHandler(async (req, res) => {
  const data = await validateCouponCodeHelper({
    code: req.params.code,
    userId: req.user?._id,
    orderAmount: Number(req.query.orderAmount) || 0,
  });

  return res.json({
    success: true,
    data,
  });
});

const applyCoupon = asyncHandler(async (req, res) => {
  const data = await validateCouponCodeHelper({
    code: req.body.code,
    userId: req.user._id,
    orderAmount: req.body.orderAmount || 0,
  });

  return res.json({
    success: true,
    data,
  });
});

module.exports = {
  createCoupon,
  getCoupons,
  updateCoupon,
  deleteCoupon,
  validateCouponCode,
  applyCoupon,
};
