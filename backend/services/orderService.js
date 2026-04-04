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
const { validateCoupon, applyCouponToOrder } = require('./couponService');

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

  const validation = await validateCoupon({
    code: couponCode,
    userId,
    orderAmount,
  });

  if (!validation.valid) {
    throw new AppError(validation.reason, 400);
  }

  return {
    discountAmount: validation.discountAmount,
    normalizedCouponCode: validation.coupon.code,
    validation,
  };
};

const createOrder = async ({ body, user }) => {
  const { shippingAddress, paymentMethod, note, checkoutRequestKey, couponCode } = body;

  if (checkoutRequestKey) {
    const existingOrder = await Order.findOne({
      user: user._id,
      checkoutRequestKey,
    });

    if (existingOrder) {
      return {
        statusCode: 200,
        message: 'Order already created',
        data: { order: existingOrder },
      };
    }
  }

  const session = await mongoose.startSession();
  let createdOrder;

  try {
    await session.withTransaction(async () => {
      const cart = await Cart.findOne({ user: user._id })
        .populate({
          path: 'items.product',
          select: 'name price images stock isActive',
        })
        .session(session);

      if (!cart || cart.items.length === 0) {
        throw new AppError('Cart is empty', 400);
      }

      const orderItems = await buildOrderItems(cart.items, session);
      const { discountAmount, normalizedCouponCode, validation } =
        await resolveCouponData({
          couponCode,
          userId: user._id,
          orderAmount: cart.totalPrice,
        });

      const order = new Order({
        user: user._id,
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
        await applyCouponToOrder({
          coupon: validation.coupon,
          userId: user._id,
          session,
        });
      }

      await Cart.findOneAndUpdate(
        { user: user._id },
        { items: [], totalItems: 0, totalPrice: 0 },
        { session }
      );

      createdOrder = order;
    });
  } finally {
    await session.endSession();
  }

  emitNewOrderNotification(createdOrder);

  return {
    statusCode: 201,
    message: 'Order placed successfully',
    data: { order: createdOrder },
  };
};

const getMyOrders = async ({ userId, queryParams = {} }) => {
  const page = parseInt(queryParams.page, 10) || 1;
  const limit = parseInt(queryParams.limit, 10) || DEFAULT_USER_PAGE_SIZE;
  const skip = (page - 1) * limit;
  const query = { user: userId };

  if (queryParams.status) {
    query.status = queryParams.status;
  }

  const total = await Order.countDocuments(query);
  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    orders,
    pagination: getPagination(page, limit, total),
  };
};

const getOrderById = async ({ orderId, user }) => {
  const order = await Order.findById(orderId).populate('user', 'name email');

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (order.user._id.toString() !== user._id.toString() && user.role !== 'admin') {
    throw new AppError('Not authorized to view this order', 403);
  }

  return { order };
};

const cancelOrder = async ({ orderId, userId, reason }) => {
  const order = await getOrderOrThrow(orderId);

  if (order.user.toString() !== userId.toString()) {
    throw new AppError('Not authorized to cancel this order', 403);
  }

  if (!['pending', 'confirmed'].includes(order.status)) {
    throw new AppError('Cannot cancel order in current status', 400);
  }

  await releaseOrderStock(order);
  order.status = 'cancelled';
  order.cancelReason = reason || 'Cancelled by customer';
  await order.save();

  return { order };
};

const getAllOrders = async (queryParams = {}) => {
  const page = parseInt(queryParams.page, 10) || 1;
  const limit = parseInt(queryParams.limit, 10) || DEFAULT_ADMIN_PAGE_SIZE;
  const skip = (page - 1) * limit;
  const query = buildAdminOrderQuery(queryParams);

  const total = await Order.countDocuments(query);
  const orders = await Order.find(query)
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    orders,
    pagination: getPagination(page, limit, total),
  };
};

const updateOrderStatus = async ({
  orderId,
  status,
  note,
  actor,
  request,
}) => {
  const order = await getOrderOrThrow(orderId);

  try {
    validateStatusTransition(order.status, status, 'admin');
  } catch (validationError) {
    await logValidationFailure(
      order._id.toString(),
      order.orderNumber,
      order.status,
      status,
      actor._id.toString(),
      'admin',
      validationError.message,
      request
    );

    throw new AppError(`Status validation failed: ${validationError.message}`, 400);
  }

  await logStatusChange(
    order,
    status,
    actor._id,
    note || `Updated by admin to ${getStatusDisplayName(status)}`,
    'admin',
    request
  );

  const previousStatus = order.status;

  if (status === 'cancelled') {
    await releaseOrderStock(order);
    order.cancelReason = note || 'Cancelled by admin';
  }

  order.status = status;
  await order.save();

  await sendNotification({
    recipient: order.user.toString(),
    title: 'Cập nhật trạng thái đơn hàng',
    message: `Đơn hàng #${order.orderNumber} của bạn đã chuyển sang trạng thái: ${STATUS_LABELS[status] || status}`,
    type: 'order',
    link: `/profile/orders/${order._id}`,
  });

  emitOrderStatusUpdate(
    order,
    previousStatus,
    actor._id,
    note || `Updated by admin to ${getStatusDisplayName(status)}`
  );

  return { order };
};

const updatePaymentStatus = async ({ orderId, paymentStatus, transactionId }) => {
  const order = await getOrderOrThrow(orderId);
  order.paymentStatus = paymentStatus;

  if (paymentStatus === 'paid') {
    order.paymentDetails = {
      transactionId: transactionId || 'MANUAL',
      paidAt: new Date(),
    };
  }

  await order.save();
  return { order };
};

const getOrderStats = async (queryParams = {}) => {
  const start = queryParams.startDate
    ? new Date(queryParams.startDate)
    : new Date(new Date().setDate(new Date().getDate() - 30));
  const end = queryParams.endDate ? new Date(queryParams.endDate) : new Date();

  const stats = await Order.getOrderStats(start, end);
  const revenue = await Order.getRevenueByPeriod('daily', 30);
  const pendingOrders = await Order.countDocuments({ status: 'pending' });
  const processingOrders = await Order.countDocuments({
    status: { $in: ['confirmed', 'processing', 'shipped'] },
  });

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

  return {
    ...stats,
    revenue,
    pendingOrders,
    processingOrders,
    todayOrders,
    todayRevenue: todayRevenue[0]?.total || 0,
  };
};

const getRevenueReport = async ({ period = 'daily', days = 30 }) => {
  const parsedDays = parseInt(days, 10);
  const revenue = await Order.getRevenueByPeriod(period, parsedDays);
  const totalRevenue = revenue.reduce((acc, item) => acc + item.revenue, 0);
  const totalOrders = revenue.reduce((acc, item) => acc + item.orders, 0);

  return {
    period,
    days: parsedDays,
    totalRevenue,
    totalOrders,
    averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    data: revenue,
  };
};

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
