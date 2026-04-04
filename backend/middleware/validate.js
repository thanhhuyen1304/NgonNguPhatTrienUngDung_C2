const { body, param, query, validationResult } = require('express-validator');

const strongPasswordRule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s])(?=\S+$).{8,}$/;
const strongPasswordMessage = 'Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số, ký tự đặc biệt và không có dấu cách';

const requiredEmail = (field = 'email') => body(field)
  .trim()
  .notEmpty()
  .withMessage('Email là bắt buộc')
  .isEmail()
  .withMessage('Vui lòng nhập email hợp lệ')
  .normalizeEmail();

const requiredPassword = (field = 'password', label = 'Mật khẩu') => body(field)
  .notEmpty()
  .withMessage(`${label} là bắt buộc`);

const requiredStrongPassword = (field = 'password', label = 'Mật khẩu') => body(field)
  .notEmpty()
  .withMessage(`${label} là bắt buộc`)
  .matches(strongPasswordRule)
  .withMessage(strongPasswordMessage);

const optionalMongoId = (field, message) => body(field)
  .optional({ checkFalsy: true })
  .isMongoId()
  .withMessage(message);

const requiredMongoId = (field, message) => body(field)
  .notEmpty()
  .withMessage(`${message} là bắt buộc`)
  .isMongoId()
  .withMessage(`${message} không hợp lệ`);

const optionalPage = () => query('page')
  .optional()
  .isInt({ min: 1 })
  .withMessage('Trang phải là số nguyên dương');

const optionalLimit = () => query('limit')
  .optional()
  .isInt({ min: 1, max: 1000 })
  .withMessage('Giới hạn phải nằm trong khoảng từ 1 đến 1000');

// Handle validation result
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Lỗi xác thực dữ liệu',
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
    .withMessage('Tên là bắt buộc')
    .isLength({ min: 2, max: 50 })
    .withMessage('Tên phải có từ 2 đến 50 ký tự'),
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
    .withMessage('Thiếu mã đặt lại mật khẩu'),
  requiredStrongPassword('newPassword', 'Mật khẩu mới'),
  handleValidation,
];

const changePasswordValidation = [
  requiredPassword('currentPassword', 'Mật khẩu hiện tại'),
  requiredStrongPassword('newPassword', 'Mật khẩu mới'),
  handleValidation,
];

// Product validation rules
const productValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Tên sản phẩm là bắt buộc')
    .isLength({ max: 200 })
    .withMessage('Tên sản phẩm không được vượt quá 200 ký tự'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Mô tả sản phẩm là bắt buộc')
    .isLength({ max: 2000 })
    .withMessage('Mô tả không được vượt quá 2000 ký tự'),
  body('price')
    .notEmpty()
    .withMessage('Giá là bắt buộc')
    .isFloat({ min: 0 })
    .withMessage('Giá phải là số không âm'),
  body('comparePrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Giá so sánh phải là số không âm'),
  requiredMongoId('category', 'ID danh mục'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Tồn kho phải là số nguyên không âm'),
  body('brand')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Thương hiệu không được vượt quá 100 ký tự'),
  handleValidation,
];

// Category validation rules
const categoryValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Tên danh mục là bắt buộc')
    .isLength({ max: 50 })
    .withMessage('Tên danh mục không được vượt quá 50 ký tự'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Mô tả không được vượt quá 500 ký tự'),
  optionalMongoId('parent', 'ID danh mục cha không hợp lệ'),
  handleValidation,
];

// Cart validation rules
const addToCartValidation = [
  requiredMongoId('productId', 'ID sản phẩm'),
  body('quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Số lượng phải lớn hơn hoặc bằng 1'),
  handleValidation,
];

const updateCartValidation = [
  body('quantity')
    .notEmpty()
    .withMessage('Số lượng là bắt buộc')
    .isInt({ min: 0 })
    .withMessage('Số lượng phải là số nguyên không âm'),
  handleValidation,
];

// Order validation rules
const createOrderValidation = [
  body('shippingAddress.fullName')
    .trim()
    .notEmpty()
    .withMessage('Họ và tên là bắt buộc'),
  body('shippingAddress.phone')
    .trim()
    .notEmpty()
    .withMessage('Số điện thoại là bắt buộc')
    .matches(/^[0-9+\-\s]+$/)
    .withMessage('Định dạng số điện thoại không hợp lệ'),
  body('shippingAddress.street')
    .trim()
    .notEmpty()
    .withMessage('Địa chỉ là bắt buộc'),
  body('shippingAddress.city')
    .trim()
    .notEmpty()
    .withMessage('Thành phố là bắt buộc'),
  body('paymentMethod')
    .optional()
    .isIn(['cod', 'bank_transfer', 'credit_card', 'momo', 'zalopay'])
    .withMessage('Phương thức thanh toán không hợp lệ'),
  body('checkoutRequestKey')
    .optional()
    .isString()
    .withMessage('checkoutRequestKey phải là chuỗi')
    .trim()
    .isLength({ min: 8, max: 100 })
    .withMessage('checkoutRequestKey phải có từ 8 đến 100 ký tự'),
  handleValidation,
];

const updateOrderStatusValidation = [
  body('status')
    .notEmpty()
    .withMessage('Trạng thái là bắt buộc')
    .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Trạng thái đơn hàng không hợp lệ'),
  body('note')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Ghi chú không được vượt quá 500 ký tự'),
  handleValidation,
];

// MongoDB ObjectId validation
const mongoIdValidation = (paramName) => [
  param(paramName).isMongoId().withMessage(`${paramName} không hợp lệ`),
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
    .withMessage('Nội dung tin nhắn phải là chuỗi')
    .isLength({ max: 2000 })
    .withMessage('Nội dung tin nhắn không được vượt quá 2000 ký tự'),
  handleValidation,
];

const supportConversationStatusValidation = [
  body('status')
    .notEmpty()
    .withMessage('Trạng thái là bắt buộc')
    .isIn(['open', 'closed'])
    .withMessage('Trạng thái hội thoại hỗ trợ không hợp lệ'),
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
