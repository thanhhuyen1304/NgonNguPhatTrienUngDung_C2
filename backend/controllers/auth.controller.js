const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../middleware/auth');

const ACCESS_COOKIE_NAME = 'accessToken';
const REFRESH_COOKIE_NAME = 'refreshToken';

const isProduction = process.env.NODE_ENV === 'production';

const baseCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
};

const accessCookieOptions = {
  ...baseCookieOptions,
  maxAge: 15 * 60 * 1000,
};

const refreshCookieOptions = {
  ...baseCookieOptions,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const buildSafeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  phone: user.phone,
  address: user.address,
  shipperInfo: user.shipperInfo,
  isEmailVerified: user.isEmailVerified,
});

const clearAuthCookies = (res) => {
  res.clearCookie(ACCESS_COOKIE_NAME, baseCookieOptions);
  res.clearCookie(REFRESH_COOKIE_NAME, baseCookieOptions);
};

const issueAuthSession = async (user, res) => {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = hashToken(refreshToken);
  await user.save();

  res.cookie(ACCESS_COOKIE_NAME, accessToken, accessCookieOptions);
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);

  return accessToken;
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new AppError('User already exists with this email', 400);
  }

  const user = await User.create({
    name,
    email,
    password,
    role: 'user',
  });

  const accessToken = await issueAuthSession(user, res);

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: {
      user: buildSafeUser(user),
      accessToken,
    },
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password +refreshToken');

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.password) {
    throw new AppError('Please login using Google', 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.isActive) {
    throw new AppError('Your account has been deactivated', 401);
  }

  const accessToken = await issueAuthSession(user, res);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: buildSafeUser(user),
      accessToken,
    },
  });
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public
const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME] || req.body.refreshToken;

  if (!token) {
    clearAuthCookies(res);
    return res.status(401).json({
      success: false,
      message: 'Refresh token is required',
    });
  }

  const decoded = verifyRefreshToken(token);
  if (!decoded) {
    clearAuthCookies(res);
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || !user.refreshToken || user.refreshToken !== hashToken(token)) {
    clearAuthCookies(res);
    throw new AppError('Invalid refresh token', 401);
  }

  if (!user.isActive) {
    clearAuthCookies(res);
    throw new AppError('Your account has been deactivated', 401);
  }

  const accessToken = await issueAuthSession(user, res);

  res.json({
    success: true,
    data: {
      accessToken,
    },
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
  clearAuthCookies(res);

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  res.json({
    success: true,
    data: {
      user: buildSafeUser(user),
    },
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const {
    name,
    phone,
    street,
    city,
    state,
    zipCode,
    country,
    address,
  } = req.body;

  const user = await User.findById(req.user._id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  user.name = name || user.name;
  user.phone = phone || user.phone;

  const nextAddress = address && typeof address === 'object' ? address : {
    street,
    city,
    state,
    zipCode,
    country,
  };

  if (Object.values(nextAddress).some(Boolean)) {
    user.address = {
      street: nextAddress.street || user.address?.street,
      city: nextAddress.city || user.address?.city,
      state: nextAddress.state || user.address?.state,
      zipCode: nextAddress.zipCode || user.address?.zipCode,
      country: nextAddress.country || user.address?.country,
    };
  }

  if (req.file) {
    if (req.file.path) {
      user.avatar = req.file.path;
    } else if (req.file.buffer) {
      const { uploadBuffer } = require('../config/cloudinary');
      try {
        const uploadResult = await uploadBuffer(req.file.buffer, 'ecommerce/avatars');
        if (uploadResult && (uploadResult.secure_url || uploadResult.url)) {
          user.avatar = uploadResult.secure_url || uploadResult.url;
        }
      } catch (err) {
        console.error('Avatar upload failed:', err);
      }
    }
  }

  const updatedUser = await user.save();

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: buildSafeUser(updatedUser),
    },
  });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password +refreshToken');

  if (!user.password) {
    throw new AppError('Cannot change password for Google-only account', 400);
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new AppError('Current password is incorrect', 401);
  }

  user.password = newPassword;
  const accessToken = await issueAuthSession(user, res);

  res.json({
    success: true,
    message: 'Password changed successfully',
    data: {
      accessToken,
    },
  });
});

// @desc    Google OAuth callback handler
// @route   GET /api/auth/google/callback
// @access  Public
const googleCallback = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+refreshToken');

  if (!user || !user.isActive) {
    clearAuthCookies(res);
    throw new AppError('Your account has been deactivated', 401);
  }

  await issueAuthSession(user, res);

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  res.redirect(`${frontendUrl}/auth/google/callback?status=success`);
});

// @desc    Apply to become a shipper
// @route   POST /api/auth/apply-shipper
// @access  Private
const applyShipper = asyncHandler(async (req, res) => {
  const { vehicleType, licensePlate, phone, experience, workingHours } = req.body;

  if (!vehicleType || !licensePlate || !phone) {
    throw new AppError('Vehicle type, license plate, and phone are required', 400);
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.role === 'shipper') {
    throw new AppError('You are already a delivery partner', 400);
  }

  user.shipperInfo = {
    vehicleType,
    licensePlate,
    phone,
    experience: experience || 0,
    workingHours: workingHours || 'full-time',
    isVerified: false,
    rating: 5,
    totalDeliveries: 0,
    applicationDate: new Date(),
    status: 'pending',
  };

  await user.save();

  res.json({
    success: true,
    message: 'Shipper application submitted successfully. We will review your application within 24-48 hours.',
    data: {
      user: buildSafeUser(user),
    },
  });
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  updateProfile,
  changePassword,
  applyShipper,
  googleCallback,
};
