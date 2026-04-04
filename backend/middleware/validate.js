const { body, param, query, validationResult } = require('express-validator');

const strongPasswordRule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s])(?=\S+$).{8,}$/;
const strongPasswordMessage = 'Password must be at least 8 characters and include uppercase, lowercase, number, special character, and no spaces';

const requiredEmail = (field = 'email') => body(field)
  .trim()
  .notEmpty()
  .withMessage('Email is required')
  .isEmail()
  .withMessage('Please provide a valid email')
  .normalizeEmail();

const requiredPassword = (field = 'password', label = 'Password') => body(field)
  .notEmpty()
  .withMessage(`${label} is required`);

const requiredStrongPassword = (field = 'password', label = 'Password') => body(field)
  .notEmpty()
  .withMessage(`${label} is required`)
  .matches(strongPasswordRule)
  .withMessage(strongPasswordMessage);

const optionalMongoId = (field, message) => body(field)
  .optional({ checkFalsy: true })
  .isMongoId()
  .withMessage(message);

const requiredMongoId = (field, message) => body(field)
  .notEmpty()
  .withMessage(`${message} is required`)
  .isMongoId()
  .withMessage(`Invalid ${message}`);

const optionalPage = () => query('page')
  .optional()
  .isInt({ min: 1 })
  .withMessage('Page must be a positive integer');

const optionalLimit = () => query('limit')
  .optional()
  .isInt({ min: 1, max: 1000 })
  .withMessage('Limit must be between 1 and 1000');

// Handle validation result
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

// User validation rules
const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  requiredEmail(),
  requiredStrongPassword(),
  handleValidation,
];

const loginValidation = [
  requiredEmail(),
  requiredPassword(),
  handleValidation,
];

const forgotPasswordValidation = [
  requiredEmail(),
  handleValidation,
];

const resetPasswordValidation = [
  param('token')
    .trim()
    .notEmpty()
    .withMessage('Reset token is required'),
  requiredStrongPassword('newPassword', 'New password'),
  handleValidation,
];

const changePasswordValidation = [
  requiredPassword('currentPassword', 'Current password'),
  requiredStrongPassword('newPassword', 'New password'),
  handleValidation,
];

// Product validation rules
const productValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ max: 200 })
    .withMessage('Product name cannot exceed 200 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Product description is required')
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('comparePrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Compare price must be a positive number'),
  requiredMongoId('category', 'category ID'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  body('brand')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Brand cannot exceed 100 characters'),
  handleValidation,
];

// Category validation rules
const categoryValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ max: 50 })
    .withMessage('Category name cannot exceed 50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  optionalMongoId('parent', 'Invalid parent category ID'),
  handleValidation,
];

// Cart validation rules
const addToCartValidation = [
  requiredMongoId('productId', 'product ID'),
  body('quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  handleValidation,
];

const updateCartValidation = [
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer'),
  handleValidation,
];

// Order validation rules
const createOrderValidation = [
  body('shippingAddress.fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required'),
  body('shippingAddress.phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[0-9+\-\s]+$/)
    .withMessage('Invalid phone number format'),
  body('shippingAddress.street')
    .trim()
    .notEmpty()
    .withMessage('Street address is required'),
  body('shippingAddress.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('paymentMethod')
    .optional()
    .isIn(['cod', 'bank_transfer', 'credit_card', 'momo', 'zalopay'])
    .withMessage('Invalid payment method'),
  body('checkoutRequestKey')
    .optional()
    .isString()
    .withMessage('checkoutRequestKey must be a string')
    .trim()
    .isLength({ min: 8, max: 100 })
    .withMessage('checkoutRequestKey must be between 8 and 100 characters'),
  handleValidation,
];

const updateOrderStatusValidation = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid order status'),
  body('note')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Note cannot exceed 500 characters'),
  handleValidation,
];

// MongoDB ObjectId validation
const mongoIdValidation = (paramName) => [
  param(paramName).isMongoId().withMessage(`Invalid ${paramName}`),
  handleValidation,
];

// Pagination validation
const paginationValidation = [
  optionalPage(),
  optionalLimit(),
  handleValidation,
];

const supportMessageValidation = [
  body('text')
    .optional()
    .isString()
    .withMessage('Message text must be a string')
    .isLength({ max: 2000 })
    .withMessage('Message text cannot exceed 2000 characters'),
  handleValidation,
];

const supportConversationStatusValidation = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['open', 'closed'])
    .withMessage('Invalid support conversation status'),
  handleValidation,
];

module.exports = {
  handleValidation,
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
  productValidation,
  categoryValidation,
  addToCartValidation,
  updateCartValidation,
  createOrderValidation,
  updateOrderStatusValidation,
  mongoIdValidation,
  paginationValidation,
  supportMessageValidation,
  supportConversationStatusValidation,
};
