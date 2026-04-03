const express = require('express');
const router = express.Router();
const { protect, shipper } = require('../middleware/auth');
const {
  getDashboard,
  getOrders,
  acceptOrder,
  updateOrderStatus,
  getRoute,
} = require('../controllers/shipper');

// @desc    Get shipper dashboard
// @route   GET /api/shipper/dashboard
// @access  Private/Shipper
router.get('/dashboard', protect, shipper, getDashboard);

// @desc    Get shipper orders (available and assigned)
// @route   GET /api/shipper/orders
// @access  Private/Shipper
router.get('/orders', protect, shipper, getOrders);

// @desc    Accept delivery order
// @route   POST /api/shipper/orders/:orderId/accept
// @access  Private/Shipper
router.post('/orders/:orderId/accept', protect, shipper, acceptOrder);

// @desc    Update delivery status
// @route   PUT /api/shipper/orders/:orderId/status
// @access  Private/Shipper
router.put('/orders/:orderId/status', protect, shipper, updateOrderStatus);

// @desc    Get shipper route
// @route   GET /api/shipper/route
// @access  Private/Shipper
router.get('/route', protect, shipper, getRoute);

module.exports = router;
