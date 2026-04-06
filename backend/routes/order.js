const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Order = require('../schemas/Order');
const Product = require('../schemas/Product');
const Cart = require('../schemas/Cart');
const { AppError } = require('../middleware/error');
const {
  validateStatusTransition,
  logStatusChange,
  logValidationFailure,
  getStatusDisplayName,
} = require('../utils/orderStatus');
const {
  emitOrderStatusUpdate,
  emitNewOrderNotification,
  sendNotification,
} = require('../socket/socketServer');
const { validateCoupon, applyCouponToOrder } = require('../services/couponService');

const { protect, admin, shipper, customerOnly } = require('../middleware/auth');
const {
  createOrderValidation,
  updateOrderStatusValidation,
  mongoIdValidation,
  paginationValidation,
} = require('../middleware/validate');

const DEFAULT_USER_PAGE_SIZE = 10;
const DEFAULT_ADMIN_PAGE_SIZE = 20;

const STATUS_LABELS = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  processing: 'Đang xử lý',
  shipped: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
};

const getPagination = (page, limit, total) => ({
  page,
  limit,
  total,
  pages: Math.ceil(total / limit),
});

const getOrderOrThrow = async (orderId) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  return order;
};

const releaseOrderStock = async (order, session) => {
  if (!order.stockCommitted || order.stockReleased) {
    return;
  }

  for (const item of order.items) {
    await Product.findByIdAndUpdate(
      item.product,
      {
        $inc: { stock: item.quantity, sold: -item.quantity },
      },
      session ? { session } : undefined
    );
  }

  order.stockReleased = true;
};

const buildAdminOrderQuery = (queryParams = {}) => {
  const query = {};

  if (queryParams.status) {
    query.status = queryParams.status;
  }

  if (queryParams.paymentStatus) {
    query.paymentStatus = queryParams.paymentStatus;
  }

  if (queryParams.startDate || queryParams.endDate) {
    query.createdAt = {};
    if (queryParams.startDate) {
      query.createdAt.$gte = new Date(queryParams.startDate);
    }
    if (queryParams.endDate) {
      query.createdAt.$lte = new Date(queryParams.endDate);
    }
  }

  if (queryParams.search) {
    query.$or = [
      { orderNumber: { $regex: queryParams.search, $options: 'i' } },
      { 'shippingAddress.fullName': { $regex: queryParams.search, $options: 'i' } },
      { 'shippingAddress.phone': { $regex: queryParams.search, $options: 'i' } },
    ];
  }

  return query;
};

const buildOrderItems = async (cartItems, session) => {
  const orderItems = [];

  for (const item of cartItems) {
    if (!item.product || !item.product.isActive) {
      throw new AppError(
        `Product "${item.product?.name || 'Unknown'}" is no longer available`,
        400
      );
    }

    const stockResult = await Product.updateOne(
      {
        _id: item.product._id,
        isActive: true,
        stock: { $gte: item.quantity },
      },
      {
        $inc: { stock: -item.quantity, sold: item.quantity },
      },
      { session }
    );

    if (!stockResult.modifiedCount) {
      throw new AppError(`Not enough stock for "${item.product.name}".`, 409);
    }

    orderItems.push({
      product: item.product._id,
      name: item.product.name,
      image: item.product.images[0]?.url || '',
      price: item.product.price,
      quantity: item.quantity,
    });
  }

  return orderItems;
};

const resolveCouponData = async ({ couponCode, userId, orderAmount }) => {
  if (!couponCode) {
    return {
      discountAmount: 0,
      normalizedCouponCode: null,
      validation: null,
    };
  }

  const validation = await validateCoupon({ code: couponCode, userId, orderAmount });

  if (!validation.valid) {
    throw new AppError(validation.reason, 400);
  }

  return {
    discountAmount: validation.discountAmount,
    normalizedCouponCode: validation.coupon.code,
    validation,
  };
};

// User routes (require authentication)
router.post('/', protect, customerOnly, createOrderValidation, asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod, note, checkoutRequestKey, couponCode } = req.body;

  if (checkoutRequestKey) {
    const existingOrder = await Order.findOne({
      user: req.user._id,
      checkoutRequestKey,
    });

    if (existingOrder) {
      return res.status(200).json({
        success: true,
        message: 'Order already created',
        data: { order: existingOrder },
      });
    }
  }

  const session = await mongoose.startSession();
  let createdOrder;

  try {
    await session.withTransaction(async () => {
      const cart = await Cart.findOne({ user: req.user._id })
        .populate({ path: 'items.product', select: 'name price images stock isActive' })
        .session(session);

      if (!cart || cart.items.length === 0) {
        throw new AppError('Cart is empty', 400);
      }

      const orderItems = await buildOrderItems(cart.items, session);
      const { discountAmount, normalizedCouponCode, validation } = await resolveCouponData({
        couponCode,
        userId: req.user._id,
        orderAmount: cart.totalPrice,
      });

      const order = new Order({
        user: req.user._id,
        checkoutRequestKey: checkoutRequestKey || null,
        items: orderItems,
        shippingAddress: {
          ...shippingAddress,
          latitude: shippingAddress.latitude,
          longitude: shippingAddress.longitude,
        },
        paymentMethod: paymentMethod || 'cod',
        note,
        couponCode: normalizedCouponCode,
        discountAmount,
        stockCommitted: true,
      });

      order.calculatePrices(undefined, undefined, discountAmount);
      order.statusHistory.push({
        status: 'pending',
        note: 'Order placed',
        updatedAt: new Date(),
      });

      await order.save({ session });

      if (normalizedCouponCode) {
        await applyCouponToOrder({ coupon: validation.coupon, userId: req.user._id, session });
      }

      await Cart.findOneAndUpdate(
        { user: req.user._id },
        { items: [], totalItems: 0, totalPrice: 0 },
        { session }
      );

      createdOrder = order;
    });
  } finally {
    await session.endSession();
  }

  emitNewOrderNotification(createdOrder);

  res.status(201).json({
    success: true,
    message: 'Order placed successfully',
    data: { order: createdOrder },
  });
}));

router.get('/my-orders', protect, customerOnly, paginationValidation, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || DEFAULT_USER_PAGE_SIZE;
  const skip = (page - 1) * limit;
  const query = { user: req.user._id };

  if (req.query.status) {
    query.status = req.query.status;
  }

  const total = await Order.countDocuments(query);
  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({ success: true, data: { orders, pagination: getPagination(page, limit, total) } });
}));


// Admin routes (must come before /:id route)
router.get('/admin/all', protect, admin, paginationValidation, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || DEFAULT_ADMIN_PAGE_SIZE;
  const skip = (page - 1) * limit;
  const query = buildAdminOrderQuery(req.query);

  const total = await Order.countDocuments(query);
  const orders = await Order.find(query)
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({ success: true, data: { orders, pagination: getPagination(page, limit, total) } });
}));

router.get('/admin/stats', protect, admin, asyncHandler(async (req, res) => {
  const start = req.query.startDate
    ? new Date(req.query.startDate)
    : new Date(new Date().setDate(new Date().getDate() - 30));
  const end = req.query.endDate ? new Date(req.query.endDate) : new Date();

  const stats = await Order.getOrderStats(start, end);
  const revenue = await Order.getRevenueByPeriod('daily', 30);
  const pendingOrders = await Order.countDocuments({ status: 'pending' });
  const processingOrders = await Order.countDocuments({ status: { $in: ['confirmed', 'processing', 'shipped'] } });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayOrders = await Order.countDocuments({ createdAt: { $gte: today } });
  const todayRevenue = await Order.aggregate([
    { $match: { createdAt: { $gte: today }, status: { $ne: 'cancelled' } } },
    { $group: { _id: null, total: { $sum: '$totalPrice' } } },
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
}));

router.get('/admin/revenue', protect, admin, asyncHandler(async (req, res) => {
  const period = req.query.period || 'daily';
  const days = parseInt(req.query.days, 10) || 30;
  const revenue = await Order.getRevenueByPeriod(period, days);
  const totalRevenue = revenue.reduce((acc, item) => acc + item.revenue, 0);
  const totalOrders = revenue.reduce((acc, item) => acc + item.orders, 0);

  res.json({
    success: true,
    data: {
      period,
      days,
      totalRevenue,
      totalOrders,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      data: revenue,
    },
  });
}));

router.put(
  '/:id/status',
  protect,
  admin,
  mongoIdValidation('id'),
  updateOrderStatusValidation,
  asyncHandler(async (req, res) => {
    const order = await getOrderOrThrow(req.params.id);

    try {
      validateStatusTransition(order.status, req.body.status, 'admin');
    } catch (validationError) {
      await logValidationFailure(
        order._id.toString(),
        order.orderNumber,
        order.status,
        req.body.status,
        req.user._id.toString(),
        'admin',
        validationError.message,
        req
      );

      throw new AppError(`Status validation failed: ${validationError.message}`, 400);
    }

    await logStatusChange(
      order,
      req.body.status,
      req.user._id,
      req.body.note || `Updated by admin to ${getStatusDisplayName(req.body.status)}`,
      'admin',
      req
    );

    const previousStatus = order.status;

    if (req.body.status === 'cancelled') {
      await releaseOrderStock(order);
      order.cancelReason = req.body.note || 'Cancelled by admin';
    }

    order.status = req.body.status;
    await order.save();

    await sendNotification({
      recipient: order.user.toString(),
      title: 'Cập nhật trạng thái đơn hàng',
      message: `Đơn hàng #${order.orderNumber} của bạn đã chuyển sang trạng thái: ${STATUS_LABELS[req.body.status] || req.body.status}`,
      type: 'order',
      link: `/profile/orders/${order._id}`,
    });

    emitOrderStatusUpdate(
      order,
      previousStatus,
      req.user._id,
      req.body.note || `Updated by admin to ${getStatusDisplayName(req.body.status)}`
    );

    res.json({
      success: true,
      message: `Order status updated to ${req.body.status}`,
      data: { order },
    });
  })
);
router.put('/:id/payment', protect, admin, mongoIdValidation('id'), asyncHandler(async (req, res) => {
  const order = await getOrderOrThrow(req.params.id);
  order.paymentStatus = req.body.paymentStatus;

  if (req.body.paymentStatus === 'paid') {
    order.paymentDetails = {
      transactionId: req.body.transactionId || 'MANUAL',
      paidAt: new Date(),
    };
  }

  await order.save();

  res.json({
    success: true,
    message: 'Payment status updated',
    data: { order },
  });
}));

// User routes with ID parameter (must come after admin routes)
router.get('/:id', protect, customerOnly, mongoIdValidation('id'), asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('Not authorized to view this order', 403);
  }

  res.json({ success: true, data: { order } });
}));

router.put('/:id/cancel', protect, customerOnly, mongoIdValidation('id'), asyncHandler(async (req, res) => {
  const order = await getOrderOrThrow(req.params.id);

  if (order.user.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to cancel this order', 403);
  }

  if (!['pending', 'confirmed'].includes(order.status)) {
    throw new AppError('Cannot cancel order in current status', 400);
  }

  await releaseOrderStock(order);
  order.status = 'cancelled';
  order.cancelReason = req.body.reason || 'Cancelled by customer';
  await order.save();

  res.json({ success: true, message: 'Order cancelled successfully', data: { order } });
}));

module.exports = router;
