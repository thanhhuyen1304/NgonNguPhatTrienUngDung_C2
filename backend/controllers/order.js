const asyncHandler = require('express-async-handler');
const orderService = require('../services/orderService');

const createOrder = asyncHandler(async (req, res) => {
  const result = await orderService.createOrder({ body: req.body, user: req.user });
  res.status(result.statusCode).json({
    success: true,
    message: result.message,
    data: result.data,
  });
});

const getMyOrders = asyncHandler(async (req, res) => {
  const data = await orderService.getMyOrders({ userId: req.user._id, queryParams: req.query });
  res.json({ success: true, data });
});

const getOrderById = asyncHandler(async (req, res) => {
  const data = await orderService.getOrderById({ orderId: req.params.id, user: req.user });
  res.json({ success: true, data });
});

const cancelOrder = asyncHandler(async (req, res) => {
  const data = await orderService.cancelOrder({
    orderId: req.params.id,
    userId: req.user._id,
    reason: req.body.reason,
  });
  res.json({ success: true, message: 'Order cancelled successfully', data });
});

// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Private/Admin
const getAllOrders = asyncHandler(async (req, res) => {
  const data = await orderService.getAllOrders(req.query);
  res.json({ success: true, data });
});

// @desc    Update order status (Admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
  const data = await orderService.updateOrderStatus({
    orderId: req.params.id,
    status: req.body.status,
    note: req.body.note,
    actor: req.user,
    request: req,
  });
  res.json({
    success: true,
    message: `Order status updated to ${req.body.status}`,
    data,
  });
});

// @desc    Update payment status (Admin)
// @route   PUT /api/orders/:id/payment
// @access  Private/Admin
const updatePaymentStatus = asyncHandler(async (req, res) => {
  const data = await orderService.updatePaymentStatus({
    orderId: req.params.id,
    paymentStatus: req.body.paymentStatus,
    transactionId: req.body.transactionId,
  });
  res.json({
    success: true,
    message: 'Payment status updated',
    data,
  });
});

// @desc    Get order statistics (Admin)
// @route   GET /api/orders/admin/stats
// @access  Private/Admin
const getOrderStats = asyncHandler(async (req, res) => {
  const data = await orderService.getOrderStats(req.query);
  res.json({ success: true, data });
});

// @desc    Get revenue report (Admin)
// @route   GET /api/orders/revenue
// @access  Private/Admin
const getRevenueReport = asyncHandler(async (req, res) => {
  const data = await orderService.getRevenueReport(req.query);
  res.json({ success: true, data });
});

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  updatePaymentStatus,
  getOrderStats,
  getRevenueReport,
};
