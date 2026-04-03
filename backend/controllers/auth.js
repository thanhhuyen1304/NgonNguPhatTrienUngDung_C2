const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const User = require('../schemas/User');
const { AppError } = require('../middleware/error');
const {
  passwordResetExpiresMinutes,
  allowInternalPasswordResetPreview,
  hashToken,
  buildSafeUser,
  clearAuthCookies,
  issueAuthSession,
  buildResetPasswordUrl,
  verifyRefreshToken,
} = require('./auth.helpers');
const { uploadBuffer } = require('../config/cloudinary');

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const userExists = await User.findOne({ email });

  if (userExists) {
    throw new AppError('User already exists with this email', 400);
  }

  const user = await User.create({ name, email, password, role: 'user' });
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

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password +passwordResetToken +passwordResetExpires');

  let previewResetUrl = null;

  if (user && user.isActive && user.password) {
    const rawResetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = hashToken(rawResetToken);
    user.passwordResetExpires = new Date(Date.now() + passwordResetExpiresMinutes * 60 * 1000);
    await user.save();

    if (allowInternalPasswordResetPreview) {
      previewResetUrl = buildResetPasswordUrl(rawResetToken);
    }
  }

  res.json({
    success: true,
    message: 'If that email exists, a password reset link is ready.',
    data: {
      previewResetUrl,
      expiresInMinutes: allowInternalPasswordResetPreview && previewResetUrl ? passwordResetExpiresMinutes : undefined,
    },
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  const user = await User.findOne({
    passwordResetToken: hashToken(token),
    passwordResetExpires: { $gt: new Date() },
  }).select('+password +refreshToken +passwordResetToken +passwordResetExpires');

  if (!user) {
    throw new AppError('Reset token is invalid or has expired', 400);
  }

  if (!user.isActive) {
    throw new AppError('Your account has been deactivated', 401);
  }

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  const accessToken = await issueAuthSession(user, res);

  res.json({
    success: true,
    message: 'Password reset successful',
    data: {
      user: buildSafeUser(user),
      accessToken,
    },
  });
});

const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body.refreshToken;

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
    data: { accessToken },
  });
});

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

const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
  clearAuthCookies(res);

  res.json({ success: true, message: 'Logged out successfully' });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  res.json({
    success: true,
    data: { user: buildSafeUser(user) },
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, street, city, state, zipCode, country, address } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  user.name = name || user.name;
  user.phone = phone || user.phone;

  const nextAddress = address && typeof address === 'object'
    ? address
    : { street, city, state, zipCode, country };

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
    data: { user: buildSafeUser(updatedUser) },
  });
});

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
    data: { accessToken },
  });
});

const applyShipper = asyncHandler(async (req, res) => {
  const { vehicleType, licensePlate, drivingLicense, phone, experience, workingHours } = req.body;

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

  if (user.shipperInfo && user.shipperInfo.status === 'pending') {
    throw new AppError('You already have a pending shipper application', 400);
  }

  user.shipperInfo = {
    vehicleType,
    licensePlate,
    drivingLicense: drivingLicense || user.shipperInfo?.drivingLicense,
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
    data: { user: buildSafeUser(user) },
  });
});

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  refreshToken,
  googleCallback,
  logout,
  getMe,
  updateProfile,
  changePassword,
  applyShipper,
};
