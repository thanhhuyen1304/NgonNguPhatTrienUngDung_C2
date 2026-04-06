const express = require('express');
const router = express.Router();
const {
  createCoupon,
  getCoupons,
  updateCoupon,
  deleteCoupon,
  validateCouponCode,
  applyCoupon,
} = require('../controllers/coupon');
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

router.post('/', protect, admin, couponValidation, createCoupon);
router.get('/', protect, admin, getCoupons);
router.get('/validate/:code', protect, validateCouponCode);
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
], applyCoupon);
router.put('/:id', protect, admin, couponUpdateValidation, updateCoupon);
router.delete('/:id', protect, admin, deleteCoupon);

module.exports = router;
