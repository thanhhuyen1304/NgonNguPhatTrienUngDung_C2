const express = require('express');
const router = express.Router();

const {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  updatePaymentStatus,
  getOrderStats,
  getRevenueReport,
  getAvailableOrdersForShippers,
  acceptOrderForDelivery,
  getShipperOrders,
  updateDeliveryStatus,
  updateOrderByShipper,
} = require('../controllers/order.controller');

const { protect, admin, shipper } = require('../middleware/auth');
const {
  createOrderValidation,
  updateOrderStatusValidation,
  mongoIdValidation,
  paginationValidation,
} = require('../middleware/validate');

// User routes (require authentication)
router.post('/', protect, createOrderValidation, createOrder);
router.get('/my-orders', protect, paginationValidation, getMyOrders);

// Shipper routes (require shipper role)
router.get('/shipper/available', protect, shipper, paginationValidation, getAvailableOrdersForShippers);
router.get('/shipper/my-orders', protect, shipper, paginationValidation, getShipperOrders);
router.put('/:id/accept', protect, shipper, mongoIdValidation('id'), acceptOrderForDelivery);
router.put('/:id/delivery-status', protect, shipper, mongoIdValidation('id'), updateDeliveryStatus);
router.put('/:id/shipper-update', protect, shipper, mongoIdValidation('id'), updateOrderByShipper);

// Admin routes (must come before /:id route)
router.get('/admin/all', protect, admin, paginationValidation, getAllOrders);
router.get('/admin/stats', protect, admin, getOrderStats);
router.get('/admin/revenue', protect, admin, getRevenueReport);
router.put(
  '/:id/status',
  protect,
  admin,
  mongoIdValidation('id'),
  updateOrderStatusValidation,
  updateOrderStatus
);
router.put('/:id/payment', protect, admin, mongoIdValidation('id'), updatePaymentStatus);

// User routes with ID parameter (must come after admin routes)
router.get('/:id', protect, mongoIdValidation('id'), getOrderById);
router.put('/:id/cancel', protect, mongoIdValidation('id'), cancelOrder);

module.exports = router;
