const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../schemas/User');

const getAccessTokenFromRequest = (req) => {
  // 1. Check Authorization Header (Bearer token) - usually more explicit from clients
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return req.headers.authorization.split(' ')[1];
  }

  // 2. Check HTTP-only Cookies
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }

  return null;
};

// Protect routes - verify JWT token
const protect = asyncHandler(async (req, res, next) => {
  const token = getAccessTokenFromRequest(req);

  if (token) {
    try {
      // Verify token
      console.log('🗝️ Verifying token...');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Token decoded for user ID:', decoded.id);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password -refreshToken');

      if (!req.user) {
        console.warn('❌ User not found for token ID:', decoded.id);
        res.status(401);
        throw new Error('User not found');
      }

      if (!req.user.isActive) {
        console.warn('❌ User account is deactivated:', req.user.email);
        res.status(401);
        throw new Error('User account is deactivated');
      }

      return next();
    } catch (error) {
      console.error('❌ Auth Middleware Error:', error.message, error.name);
      
      // Handle specific JWT errors
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token đã hết hạn'
        });
      } else if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Token không hợp lệ'
        });
      } else if (error.message === 'User not found') {
        return res.status(401).json({
          success: false,
          message: 'Không tìm thấy người dùng'
        });
      } else if (error.message === 'User account is deactivated') {
        return res.status(401).json({
          success: false,
          message: 'Tài khoản người dùng đã bị vô hiệu hóa'
        });
      } else {
        return res.status(401).json({
          success: false,
          message: 'Không được phép truy cập, token không hợp lệ'
        });
      }
    }
  }

  return res.status(401).json({
    success: false,
    message: 'Không được phép truy cập, thiếu token'
  });
});

// Admin middleware
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền quản trị viên'
    });
  }
};

const customerOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Quản trị viên chỉ được phép hoạt động trong dashboard'
    });
  }

  next();
};

// Shipper middleware
const shipper = (req, res, next) => {
  if (req.user && req.user.role === 'shipper') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền shipper'
    });
  }
};

// Optional auth - doesn't fail if no token
const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = getAccessTokenFromRequest(req);

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password -refreshToken');
    } catch (error) {
      // Token invalid, but continue without user
      req.user = null;
    }
  }

  next();
});

// Generate Access Token
const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '15m',
  });
};

// Generate Refresh Token
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
  });
};

// Verify Refresh Token
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = {
  protect,
  admin,
  customerOnly,
  shipper,
  optionalAuth,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getAccessTokenFromRequest,
};
