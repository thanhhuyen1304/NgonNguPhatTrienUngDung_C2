const express = require('express');
const rateLimit = require('express-rate-limit');
const passport = require('passport');
const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const router = express.Router();
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
} = require('../services/authHelpers');
const { uploadBuffer } = require('../config/cloudinary');

const { protect } = require('../middleware/auth');
const {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
} = require('../middleware/validate');
const { upload } = require('../config/cloudinary');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Bạn đã thử xác thực quá nhiều lần. Vui lòng thử lại sau.',
  },
});

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const userExists = await User.findOne({ email });

  if (userExists) {
    throw new AppError('Email này đã được sử dụng', 400);
  }

  const user = await User.create({ name, email, password, role: 'user' });
  const accessToken = await issueAuthSession(user, res);

  res.status(201).json({
    success: true,
    message: 'Đăng ký thành công',
    data: { user: buildSafeUser(user), accessToken },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password +refreshToken');

  if (!user) {
    throw new AppError('Email hoặc mật khẩu không đúng', 401);
  }

  if (!user.password) {
    throw new AppError('Vui lòng đăng nhập bằng Google', 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Email hoặc mật khẩu không đúng', 401);
  }

  if (!user.isActive) {
    throw new AppError('Tài khoản của bạn đã bị vô hiệu hóa', 401);
  }

  const accessToken = await issueAuthSession(user, res);

  res.json({
    success: true,
    message: 'Đăng nhập thành công',
    data: { user: buildSafeUser(user), accessToken },
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
    message: 'Nếu email tồn tại, hệ thống đã sẵn sàng liên kết đặt lại mật khẩu.',
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
    throw new AppError('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn', 400);
  }

  if (!user.isActive) {
    throw new AppError('Tài khoản của bạn đã bị vô hiệu hóa', 401);
  }

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  const accessToken = await issueAuthSession(user, res);

  res.json({
    success: true,
    message: 'Đặt lại mật khẩu thành công',
    data: { user: buildSafeUser(user), accessToken },
  });
});

const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body.refreshToken;

  if (!token) {
    clearAuthCookies(res);
    return res.status(401).json({ success: false, message: 'Thiếu refresh token' });
  }

  const decoded = verifyRefreshToken(token);
  if (!decoded) {
    clearAuthCookies(res);
    throw new AppError('Refresh token không hợp lệ hoặc đã hết hạn', 401);
  }

  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || !user.refreshToken || user.refreshToken !== hashToken(token)) {
    clearAuthCookies(res);
    throw new AppError('Refresh token không hợp lệ', 401);
  }

  if (!user.isActive) {
    clearAuthCookies(res);
    throw new AppError('Tài khoản của bạn đã bị vô hiệu hóa', 401);
  }

  const accessToken = await issueAuthSession(user, res);

  res.json({ success: true, data: { accessToken } });
});

const googleCallback = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+refreshToken');

  if (!user || !user.isActive) {
    clearAuthCookies(res);
    throw new AppError('Tài khoản của bạn đã bị vô hiệu hóa', 401);
  }

  await issueAuthSession(user, res);
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  res.redirect(`${frontendUrl}/auth/google/callback?status=success`);
});

const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
  clearAuthCookies(res);
  res.json({ success: true, message: 'Đăng xuất thành công' });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, data: { user: buildSafeUser(user) } });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, street, city, state, zipCode, country, address } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new AppError('Không tìm thấy người dùng', 404);
  }

  if (name !== undefined) {
    user.name = name;
  }

  if (phone !== undefined) {
    user.phone = phone;
  }

  const nextAddress = address && typeof address === 'object'
    ? address
    : { street, city, state, zipCode, country };

  if (Object.values(nextAddress).some((value) => value !== undefined)) {
    user.address = {
      street: nextAddress.street !== undefined ? nextAddress.street : user.address?.street,
      city: nextAddress.city !== undefined ? nextAddress.city : user.address?.city,
      state: nextAddress.state !== undefined ? nextAddress.state : user.address?.state,
      zipCode: nextAddress.zipCode !== undefined ? nextAddress.zipCode : user.address?.zipCode,
      country: nextAddress.country !== undefined ? nextAddress.country : user.address?.country,
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
    message: 'Cập nhật hồ sơ thành công',
    data: { user: buildSafeUser(updatedUser) },
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password +refreshToken');

  if (!user.password) {
    throw new AppError('Không thể đổi mật khẩu cho tài khoản chỉ đăng nhập bằng Google', 400);
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new AppError('Mật khẩu hiện tại không đúng', 401);
  }

  user.password = newPassword;
  const accessToken = await issueAuthSession(user, res);

  res.json({
    success: true,
    message: 'Đổi mật khẩu thành công',
    data: { accessToken },
  });
});

const applyShipper = asyncHandler(async (req, res) => {
  const { vehicleType, licensePlate, drivingLicense, phone, experience, workingHours } = req.body;

  if (!vehicleType || !licensePlate || !phone) {
    throw new AppError('Loại xe, biển số và số điện thoại là bắt buộc', 400);
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    throw new AppError('Không tìm thấy người dùng', 404);
  }

  if (user.role === 'shipper') {
    throw new AppError('Bạn đã là đối tác giao hàng', 400);
  }

  if (user.shipperInfo && user.shipperInfo.status === 'pending') {
    throw new AppError('Bạn đã có đơn đăng ký shipper đang chờ duyệt', 400);
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
    message: 'Đơn đăng ký shipper đã được gửi thành công. Chúng tôi sẽ xem xét trong vòng 24-48 giờ.',
    data: { user: buildSafeUser(user) },
  });
});

// Public routes
router.post('/register', authLimiter, registerValidation, register);
router.post('/login', authLimiter, loginValidation, login);
router.post('/forgot-password', authLimiter, forgotPasswordValidation, forgotPassword);
router.post('/reset-password/:token', authLimiter, resetPasswordValidation, resetPassword);
router.post('/refresh-token', authLimiter, refreshToken);

// Google OAuth routes
router.get(
  '/google',
  authLimiter,
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

router.get(
  '/google/callback',
  authLimiter,
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=google_auth_failed`,
  }),
  googleCallback
);

// Protected routes
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/profile', protect, upload.single('avatar'), updateProfile);
router.put('/change-password', protect, changePasswordValidation, changePassword);
router.post('/apply-shipper', protect, applyShipper);

module.exports = router;
