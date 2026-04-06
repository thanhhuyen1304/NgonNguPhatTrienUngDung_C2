const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const couponService = require('../services/couponService');
const { protect, admin } = require('../middleware/auth');
const { body, param, query, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: errors.array().map((err) => ({ field: err.path, message: err.msg })),
    });
  }
  next();
};

const couponValidation = [
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Coupon code is required'),
  body('discountType')
    .notEmpty()
    .withMessage('Discount type is required')
    .isIn(['percentage', 'fixed_amount'])
    .withMessage('Discount type must be percentage or fixed_amount'),
  body('discountValue')
    .notEmpty()
    .withMessage('Discount value is required')
    .isFloat({ min: 0 })
    .withMessage('Discount value must be a positive number'),
  body('minOrderValue')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum order value must be a positive number'),
  body('maxDiscount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum discount must be a positive number'),
  body('oncePerUser')
    .optional()
    .isBoolean()
    .withMessage('oncePerUser must be a boolean'),
  body('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('End date must be a valid date'),
  body('usageLimit')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Usage limit must be a non-negative integer'),
  body('status')
    .optional()
    .isIn(['active', 'expired', 'disabled'])
    .withMessage('Status must be active, expired, or disabled'),
  handleValidation,
];

const couponUpdateValidation = [
  body('code')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Coupon code cannot be empty'),
  body('discountType')
    .optional()
    .isIn(['percentage', 'fixed_amount'])
    .withMessage('Discount type must be percentage or fixed_amount'),
  body('discountValue')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount value must be a positive number'),
  body('minOrderValue')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum order value must be a positive number'),
  body('maxDiscount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum discount must be a positive number'),
  body('oncePerUser')
    .optional()
    .isBoolean()
    .withMessage('oncePerUser must be a boolean'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  body('usageLimit')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Usage limit must be a non-negative integer'),
  body('status')
    .optional()
    .isIn(['active', 'expired', 'disabled'])
    .withMessage('Status must be active, expired, or disabled'),
  handleValidation,
];

router.post('/', protect, admin, couponValidation, asyncHandler(async (req, res) => {
  const data = await couponService.createCoupon(req.body);

  res.status(201).json({
    success: true,
    message: 'Coupon created successfully',
    data,
  });
}));

router.get('/', protect, admin, asyncHandler(async (req, res) => {
  const data = await couponService.getCoupons();
  res.json({ success: true, data });
}));

router.get('/validate/:code', protect, asyncHandler(async (req, res) => {
  const data = await couponService.validateCouponCode({
    code: req.params.code,
    userId: req.user?._id,
    orderAmount: Number(req.query.orderAmount) || 0,
  });

  res.json({ success: true, data });
}));

router.post('/apply', protect, [
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Coupon code is required'),
  body('orderAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Order amount must be a non-negative number'),
  handleValidation,
], asyncHandler(async (req, res) => {
  const data = await couponService.validateCouponCode({
    code: req.body.code,
    userId: req.user._id,
    orderAmount: req.body.orderAmount || 0,
  });

  res.json({ success: true, data });
}));

router.put('/:id', protect, admin, couponUpdateValidation, asyncHandler(async (req, res) => {
  const data = await couponService.updateCoupon(req.params.id, req.body);

  res.json({
    success: true,
    message: 'Coupon updated successfully',
    data,
  });
}));

router.delete('/:id', protect, admin, asyncHandler(async (req, res) => {
  await couponService.deleteCoupon(req.params.id);

  res.json({
    success: true,
    message: 'Coupon deleted successfully',
  });
}));

module.exports = router;
