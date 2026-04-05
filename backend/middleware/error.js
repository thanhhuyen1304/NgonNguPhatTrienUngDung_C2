// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Không tìm thấy dữ liệu';
    error = new AppError(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} đã tồn tại`;
    error = new AppError(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    const message = messages.join('. ');
    error = new AppError(message, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Token không hợp lệ. Vui lòng đăng nhập lại.';
    error = new AppError(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    error = new AppError(message, 401);
  }

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'Tệp quá lớn. Kích thước tối đa là 5MB';
    error = new AppError(message, 400);
  }

  // Multer unexpected field
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Bạn đã tải lên quá nhiều tệp';
    error = new AppError(message, 400);
  }

  const statusCode = error.statusCode || err.statusCode || 500;
  const message = error.message || 'Lỗi máy chủ nội bộ';

  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      error: err,
    }),
  });
};

// Async handler wrapper
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Not found handler
const notFound = (req, res, next) => {
  const error = new AppError(`Không tìm thấy tài nguyên - ${req.originalUrl}`, 404);
  next(error);
};

module.exports = errorHandler;
module.exports.AppError = AppError;
module.exports.asyncHandler = asyncHandler;
module.exports.notFound = notFound;
