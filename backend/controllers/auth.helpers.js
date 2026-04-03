const crypto = require('crypto');
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

const passwordResetExpiresMinutes = Number(process.env.PASSWORD_RESET_EXPIRE_MINUTES || 15);

const allowInternalPasswordResetPreview = (() => {
  if (process.env.ALLOW_INTERNAL_PASSWORD_RESET_PREVIEW === 'true') {
    return true;
  }

  if (process.env.ALLOW_INTERNAL_PASSWORD_RESET_PREVIEW === 'false') {
    return false;
  }

  return !isProduction;
})();

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const buildSafeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  googleId: user.googleId,
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

const buildResetPasswordUrl = (token) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  return `${frontendUrl}/reset-password/${token}`;
};

module.exports = {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  passwordResetExpiresMinutes,
  allowInternalPasswordResetPreview,
  hashToken,
  buildSafeUser,
  clearAuthCookies,
  issueAuthSession,
  buildResetPasswordUrl,
  verifyRefreshToken,
};
