const asyncHandler = require('express-async-handler');
const couponService = require('../services/couponService');

const createCoupon = asyncHandler(async (req, res) => {
  const data = await couponService.createCoupon(req.body);

  res.status(201).json({
    success: true,
    message: 'Coupon created successfully',
    data,
  });
});

const getCoupons = asyncHandler(async (req, res) => {
  const data = await couponService.getCoupons();
  res.json({
    success: true,
    data,
  });
});

const updateCoupon = asyncHandler(async (req, res) => {
  const data = await couponService.updateCoupon(req.params.id, req.body);

  res.json({
    success: true,
    message: 'Coupon updated successfully',
    data,
  });
});

const deleteCoupon = asyncHandler(async (req, res) => {
  await couponService.deleteCoupon(req.params.id);

  res.json({
    success: true,
    message: 'Coupon deleted successfully',
  });
});

const validateCouponCode = asyncHandler(async (req, res) => {
  const data = await couponService.validateCouponCode({
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
  const data = await couponService.validateCouponCode({
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
