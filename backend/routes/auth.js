const express = require('express');
const rateLimit = require('express-rate-limit');
const passport = require('passport');
const router = express.Router();

const {
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
} = require('../controllers/auth');

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
    message: 'Too many authentication attempts. Please try again later.',
  },
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
