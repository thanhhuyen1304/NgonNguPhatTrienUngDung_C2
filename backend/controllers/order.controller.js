const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { 
  validateStatusTransition, 
  logStatusChange, 
  logValidationFailure, 
  getStatusDisplayName,
  getAvailableStatusesForRole,
  ADMIN_ALLOWED_STATUSES,
  SHIPPER_EXCLUSIVE_STATUSES
} = require('../utils/orderStatusValidation');
const { 
  emitOrderStatusUpdate, 
  emitNewOrderNotification,
  emitOrderAssignmentNotification 
} = require('../socket/socketServer');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod, note } = req.body;

  // Get user's cart
  const cart = await Cart.findOne({ user: req.user._id }).populate({
    path: 'items.product',
    select: 'name price images stock isActive',
  });

  if (!cart || cart.items.length === 0) {
    res.status(400);
    throw new Error('Cart is empty');
  }

  // Validate products and stock
  const orderItems = [];
  for (const item of cart.items) {
    if (!item.product || !item.product.isActive) {
      res.status(400);
      throw new Error(`Product "${item.product?.name || 'Unknown'}" is no longer available`);
    }

    if (item.product.stock < item.quantity) {
      res.status(400);
      throw new Error(
        `Not enough stock for "${item.product.name}". Available: ${item.product.stock}`
      );
    }

    orderItems.push({
      product: item.product._id,
      name: item.product.name,
      image: item.product.images[0]?.url || '',
      price: item.product.price,
      quantity: item.quantity,
    });

    // Update product stock
    await Product.findByIdAndUpdate(item.product._id, {
      $inc: { stock: -item.quantity, sold: item.quantity },
    });
  }

  // Create order
  const order = new Order({
    user: req.user._id,
    items: orderItems,
    shippingAddress: {
      ...shippingAddress,
      latitude: shippingAddress.latitude,
      longitude: shippingAddress.longitude
    },
    paymentMethod: paymentMethod || 'cod',
    note,
  });

  // Calculate prices
  order.calculatePrices();

  // Add initial status to history
  order.statusHistory.push({
    status: 'pending',
    note: 'Order placed',
    updatedAt: new Date(),
  });

  await order.save();

  // Clear user's cart
  await Cart.findOneAndUpdate(
    { user: req.user._id },
    { items: [], totalItems: 0, totalPrice: 0 }
  );

  // Emit new order notification to admins and shippers
  emitNewOrderNotification(order);

  res.status(201).json({
    success: true,
    message: 'Order placed successfully',
    data: { order },
  });
});

// @desc    Get user orders
// @route   GET /api/orders/my-orders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const query = { user: req.user._id };

  // Filter by status
  if (req.query.status) {
    query.status = req.query.status;
  }

  const total = await Order.countDocuments(query);
  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({
    success: true,
    data: {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    'user',
    'name email'
  );

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check if user owns the order or is admin
  if (
    order.user._id.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    res.status(403);
    throw new Error('Not authorized to view this order');
  }

  res.json({
    success: true,
    data: { order },
  });
});

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check if user owns the order
  if (order.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to cancel this order');
  }

  // Can only cancel pending or confirmed orders
  if (!['pending', 'confirmed'].includes(order.status)) {
    res.status(400);
    throw new Error('Cannot cancel order in current status');
  }

  // Restore product stock
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity, sold: -item.quantity },
    });
  }

  order.status = 'cancelled';
  order.cancelReason = reason || 'Cancelled by customer';
  await order.save();

  res.json({
    success: true,
    message: 'Order cancelled successfully',
    data: { order },
  });
});

// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Private/Admin
const getAllOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const query = {};

  // Filter by status
  if (req.query.status) {
    query.status = req.query.status;
  }

  // Filter by payment status
  if (req.query.paymentStatus) {
    query.paymentStatus = req.query.paymentStatus;
  }

  // Filter by date range
  if (req.query.startDate || req.query.endDate) {
    query.createdAt = {};
    if (req.query.startDate) {
      query.createdAt.$gte = new Date(req.query.startDate);
    }
    if (req.query.endDate) {
      query.createdAt.$lte = new Date(req.query.endDate);
    }
  }

  // Search by order number
  if (req.query.search) {
    query.$or = [
      { orderNumber: { $regex: req.query.search, $options: 'i' } },
      { 'shippingAddress.fullName': { $regex: req.query.search, $options: 'i' } },
      { 'shippingAddress.phone': { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const total = await Order.countDocuments(query);
  const orders = await Order.find(query)
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({
    success: true,
    data: {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

// @desc    Update order status (Admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  try {
    // Validate status transition - even admins must follow business rules
    validateStatusTransition(order.status, status, 'admin');
  } catch (validationError) {
    // Log validation failure for audit
    await logValidationFailure(
      order._id.toString(),
      order.orderNumber,
      order.status,
      status,
      req.user._id.toString(),
      'admin',
      validationError.message,
      req
    );
    
    res.status(400);
    throw new Error(`Status validation failed: ${validationError.message}`);
  }

  // Log the status change for audit
  await logStatusChange(order, status, req.user._id, note || `Updated by admin to ${getStatusDisplayName(status)}`, 'admin', req);

  // Store previous status for real-time update
  const previousStatus = order.status;

  // If cancelling, restore stock
  if (status === 'cancelled') {
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity, sold: -item.quantity },
      });
    }
    order.cancelReason = note || 'Cancelled by admin';
  }

  order.status = status;

  await order.save();

  // Emit real-time status update
  emitOrderStatusUpdate(order, previousStatus, req.user._id, note || `Updated by admin to ${getStatusDisplayName(status)}`);

  res.json({
    success: true,
    message: `Order status updated to ${getStatusDisplayName(status)}`,
    data: { order },
  });
});

// @desc    Update payment status (Admin)
// @route   PUT /api/orders/:id/payment
// @access  Private/Admin
const updatePaymentStatus = asyncHandler(async (req, res) => {
  const { paymentStatus, transactionId } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  order.paymentStatus = paymentStatus;
  if (paymentStatus === 'paid') {
    order.paymentDetails = {
      transactionId: transactionId || 'MANUAL',
      paidAt: new Date(),
    };
  }

  await order.save();

  res.json({
    success: true,
    message: 'Payment status updated',
    data: { order },
  });
});

// @desc    Get order statistics (Admin)
// @route   GET /api/orders/admin/stats
// @access  Private/Admin
const getOrderStats = asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate
      ? new Date(startDate)
      : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    const stats = await Order.getOrderStats(start, end);
    const revenue = await Order.getRevenueByPeriod('daily', 30);

    // Order counts by status
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const processingOrders = await Order.countDocuments({
      status: { $in: ['confirmed', 'processing', 'shipped'] },
    });

    // Today's orders
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = await Order.countDocuments({
      createdAt: { $gte: today },
    });

    const todayRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: today },
          status: { $ne: 'cancelled' },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalPrice' },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        ...stats,
        revenue,
        pendingOrders,
        processingOrders,
        todayOrders,
        todayRevenue: todayRevenue[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error('Order stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Get revenue report (Admin)
// @route   GET /api/orders/revenue
// @access  Private/Admin
const getRevenueReport = asyncHandler(async (req, res) => {
  const { period = 'daily', days = 30 } = req.query;

  const revenue = await Order.getRevenueByPeriod(period, parseInt(days));

  // Calculate total revenue
  const totalRevenue = revenue.reduce((acc, item) => acc + item.revenue, 0);
  const totalOrders = revenue.reduce((acc, item) => acc + item.orders, 0);

  res.json({
    success: true,
    data: {
      period,
      days: parseInt(days),
      totalRevenue,
      totalOrders,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      data: revenue,
    },
  });
});

// @desc    Get all available orders for shippers (not just assigned ones)
// @route   GET /api/orders/shipper/available
// @access  Private/Shipper
const getAvailableOrdersForShippers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  // Show all orders that are ready for delivery (confirmed) or in progress
  const query = {
    status: { $in: ['confirmed', 'processing', 'completed', 'shipped', 'delivered'] }
  };

  // Filter by status if provided
  if (req.query.status) {
    // Support multiple statuses separated by comma
    const statuses = req.query.status.split(',').map(s => s.trim());
    query.status = { $in: statuses };
  }

  // Filter by location if provided
  if (req.query.city) {
    query['shippingAddress.city'] = { $regex: req.query.city, $options: 'i' };
  }

  const total = await Order.countDocuments(query);
  const orders = await Order.find(query)
    .populate('user', 'name email phone')
    .populate('shipper', 'name email phone')
    .sort({ createdAt: 1 }) // Oldest first (FIFO)
    .skip(skip)
    .limit(limit);

  res.json({
    success: true,
    data: {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

// @desc    Update order status by shipper (can take over any order)
// @route   PUT /api/orders/:id/shipper-update
// @access  Private/Shipper
const updateOrderByShipper = asyncHandler(async (req, res) => {
  const { status, note, location } = req.body;
  
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Đơn hàng không tồn tại');
  }

  // Shipper can take over any order that's confirmed or in progress
  const allowedCurrentStatuses = ['confirmed', 'processing', 'completed', 'shipped'];
  if (!allowedCurrentStatuses.includes(order.status)) {
    res.status(400);
    throw new Error('Không thể cập nhật đơn hàng ở trạng thái này');
  }

  try {
    // Validate status transition with shipper role restrictions
    validateStatusTransition(order.status, status, 'shipper');
  } catch (validationError) {
    // Log validation failure for audit
    await logValidationFailure(
      order._id.toString(),
      order.orderNumber,
      order.status,
      status,
      req.user._id.toString(),
      'shipper',
      validationError.message,
      req
    );
    
    res.status(400);
    throw new Error(`Validation failed: ${validationError.message}`);
  }

  // If shipper is taking over the order, assign them
  if (!order.shipper && status === 'processing') {
    order.shipper = req.user._id;
  }

  // If different shipper is updating, allow takeover for processing/completed/shipped orders
  if (order.shipper && order.shipper.toString() !== req.user._id.toString()) {
    if (['processing', 'completed', 'shipped'].includes(status)) {
      order.shipper = req.user._id; // Transfer to current shipper
    }
  }

  // Log the status change for audit
  await logStatusChange(order, status, req.user._id, note || `Cập nhật bởi shipper: ${getStatusDisplayName(status)}`, 'shipper', req);

  // Store previous status for real-time update
  const previousStatus = order.status;

  order.status = status;

  // Add location if provided (for tracking)
  if (location) {
    order.currentLocation = location;
  }

  // Set delivery date if delivered
  if (status === 'delivered') {
    order.deliveredAt = new Date();
  }

  await order.save();

  // Emit real-time status update
  emitOrderStatusUpdate(order, previousStatus, req.user._id, note || `Cập nhật bởi shipper: ${getStatusDisplayName(status)}`);

  res.json({
    success: true,
    message: 'Đã cập nhật trạng thái đơn hàng',
    data: { order },
  });
});

// @desc    Accept order for delivery (Shipper)
// @route   PUT /api/orders/:id/accept
// @access  Private/Shipper
const acceptOrderForDelivery = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Đơn hàng không tồn tại');
  }

  // Check if order is available for pickup
  if (order.status !== 'confirmed') {
    res.status(400);
    throw new Error('Đơn hàng không ở trạng thái chờ lấy hàng');
  }

  if (order.shipper) {
    res.status(400);
    throw new Error('Đơn hàng đã được shipper khác nhận');
  }

  // Assign shipper and update status
  order.shipper = req.user._id;
  order.status = 'processing';
  order.statusHistory.push({
    status: 'processing',
    note: 'Đơn hàng đã được shipper nhận',
    updatedAt: new Date(),
    updatedBy: req.user._id,
  });

  await order.save();

  res.json({
    success: true,
    message: 'Đã nhận đơn hàng thành công',
    data: { order },
  });
});

// @desc    Get shipper's assigned orders
// @route   GET /api/orders/shipper/my-orders
// @access  Private/Shipper
const getShipperOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const query = { shipper: req.user._id };

  // Filter by status
  if (req.query.status) {
    query.status = req.query.status;
  }

  const total = await Order.countDocuments(query);
  const orders = await Order.find(query)
    .populate('user', 'name email phone')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({
    success: true,
    data: {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

// @desc    Update delivery status (Shipper)
// @route   PUT /api/orders/:id/delivery-status
// @access  Private/Shipper
const updateDeliveryStatus = asyncHandler(async (req, res) => {
  const { status, note, location } = req.body;
  
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Đơn hàng không tồn tại');
  }

  // Check if shipper owns this order
  if (order.shipper.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Bạn không có quyền cập nhật đơn hàng này');
  }

  // Validate status transitions for shippers
  const validTransitions = {
    'processing': ['shipped', 'cancelled'],
    'shipped': ['delivered', 'cancelled'],
  };

  if (!validTransitions[order.status]?.includes(status)) {
    res.status(400);
    throw new Error('Không thể chuyển trạng thái đơn hàng');
  }

  order.status = status;
  order.statusHistory.push({
    status,
    note: note || `Cập nhật bởi shipper: ${status}`,
    updatedAt: new Date(),
    updatedBy: req.user._id,
  });

  // Add location if provided (for tracking)
  if (location) {
    order.currentLocation = location;
  }

  await order.save();

  res.json({
    success: true,
    message: 'Đã cập nhật trạng thái đơn hàng',
    data: { order },
  });
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
  getAvailableOrdersForShippers,
  acceptOrderForDelivery,
  getShipperOrders,
  updateDeliveryStatus,
  updateOrderByShipper,
};
