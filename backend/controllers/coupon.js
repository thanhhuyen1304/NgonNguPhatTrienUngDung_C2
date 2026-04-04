const asyncHandler = require('express-async-handler');
const Coupon = require('../schemas/Coupon');
const { validateCoupon, applyCouponToOrder } = require('../services/couponService');

const createCoupon = asyncHandler(async (req, res) => {
  const payload = {
    code: req.body.code,
    discountType: req.body.discountType,
    discountValue: req.body.discountValue,
    minOrderValue: req.body.minOrderValue || 0,
    maxDiscount: req.body.maxDiscount || 0,
    oncePerUser: req.body.oncePerUser || false,
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    usageLimit: req.body.usageLimit || 0,
    status: req.body.status || 'active',
  };

  const coupon = await Coupon.create(payload);

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
  const coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    res.status(404);
    throw new Error('Coupon not found');
  }

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
  const coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    res.status(404);
    throw new Error('Coupon not found');
  }

  await coupon.deleteOne();

  res.json({
    success: true,
    message: 'Coupon deleted successfully',
  });
});

const validateCouponCode = asyncHandler(async (req, res) => {
  const code = req.params.code;
  const orderAmount = Number(req.query.orderAmount) || 0;
  const userId = req.user?._id;

  const result = await validateCoupon({ code, userId, orderAmount });

  if (!result.valid) {
    return res.status(400).json({
      success: false,
      message: result.reason,
    });
  }

  return res.json({
    success: true,
    data: {
      coupon: {
        _id: result.coupon._id,
        code: result.coupon.code,
        discountType: result.coupon.discountType,
        discountValue: result.coupon.discountValue,
        minOrderValue: result.coupon.minOrderValue,
        maxDiscount: result.coupon.maxDiscount,
        oncePerUser: result.coupon.oncePerUser,
        startDate: result.coupon.startDate,
        endDate: result.coupon.endDate,
        usageLimit: result.coupon.usageLimit,
        usedCount: result.coupon.usedCount,
        status: result.coupon.getStatus(),
      },
      discountAmount: result.discountAmount,
    },
  });
});

const applyCoupon = asyncHandler(async (req, res) => {
  const { code, orderAmount = 0 } = req.body;
  const userId = req.user._id;

  const result = await validateCoupon({ code, userId, orderAmount });

  if (!result.valid) {
    return res.status(400).json({
      success: false,
      message: result.reason,
    });
  }

  return res.json({
    success: true,
    data: {
      coupon: {
        _id: result.coupon._id,
        code: result.coupon.code,
        discountType: result.coupon.discountType,
        discountValue: result.coupon.discountValue,
        minOrderValue: result.coupon.minOrderValue,
        maxDiscount: result.coupon.maxDiscount,
        oncePerUser: result.coupon.oncePerUser,
        startDate: result.coupon.startDate,
        endDate: result.coupon.endDate,
        usageLimit: result.coupon.usageLimit,
        usedCount: result.coupon.usedCount,
        status: result.coupon.getStatus(),
      },
      discountAmount: result.discountAmount,
    },
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
