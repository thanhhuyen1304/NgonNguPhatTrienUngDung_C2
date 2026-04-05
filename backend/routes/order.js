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
} = require('../controllers/order');

const { protect, admin, shipper, customerOnly } = require('../middleware/auth');
const {
  createOrderValidation,
  updateOrderStatusValidation,
  mongoIdValidation,
  paginationValidation,
} = require('../middleware/validate');

// User routes (require authentication)
router.post('/', protect, customerOnly, createOrderValidation, createOrder);
router.get('/my-orders', protect, customerOnly, paginationValidation, getMyOrders);


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
router.get('/:id', protect, customerOnly, mongoIdValidation('id'), getOrderById);
router.put('/:id/cancel', protect, customerOnly, mongoIdValidation('id'), cancelOrder);

module.exports = router;
