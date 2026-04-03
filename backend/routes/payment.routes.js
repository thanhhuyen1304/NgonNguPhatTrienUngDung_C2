const express = require('express');
const router = express.Router();

const {
  createMomoPayment,
  momoIPN,
  verifyMomoPayment,
} = require('../controllers/payment.controller');

const { protect } = require('../middleware/auth');

// MoMo routes
router.post('/momo/create', protect, createMomoPayment);   // Tạo payment + order
router.post('/momo/ipn', momoIPN);                          // MoMo IPN callback (public)
router.get('/momo/verify', protect, verifyMomoPayment);     // Frontend verify sau redirect

module.exports = router;
