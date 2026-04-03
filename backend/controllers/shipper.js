const asyncHandler = require('express-async-handler');
const Order = require('../schemas/Order');

const getDashboard = asyncHandler(async (req, res) => {
  const user = req.user;

  const totalDeliveries = await Order.countDocuments({
    shipper: user._id,
    status: 'delivered',
  });

  const activeDeliveries = await Order.countDocuments({
    shipper: user._id,
    status: { $in: ['processing', 'shipped'] },
  });

  res.status(200).json({
    success: true,
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      shipperInfo: {
        ...user.shipperInfo,
        totalDeliveries,
      },
      stats: {
        totalDeliveries,
        activeDeliveries,
      },
    },
  });
});

const getOrders = asyncHandler(async (req, res) => {
  const { type } = req.query;
  let query = {};

  if (type === 'available') {
    query = {
      status: { $in: ['confirmed', 'processing'] },
      shipper: null,
    };
  } else if (type === 'active') {
    query = {
      shipper: req.user._id,
      status: { $in: ['processing', 'shipped'] },
    };
  } else if (type === 'history') {
    query = {
      shipper: req.user._id,
      status: 'delivered',
    };
  } else {
    query = {
      shipper: req.user._id,
      status: { $in: ['processing', 'shipped'] },
    };
  }

  const orders = await Order.find(query)
    .populate('user', 'name phone address')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: {
      orders,
      total: orders.length,
    },
  });
});

const acceptOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOneAndUpdate(
    {
      _id: req.params.orderId,
      shipper: null,
      status: 'confirmed',
    },
    {
      $set: {
        shipper: req.user._id,
        status: 'processing',
      },
      $push: {
        statusHistory: {
          status: 'processing',
          note: 'Đơn hàng đã được shipper nhận',
          updatedAt: new Date(),
          updatedBy: req.user._id,
        },
      },
    },
    { new: true }
  );

  if (!order) {
    return res.status(409).json({ success: false, message: 'Order is no longer available' });
  }

  res.status(200).json({
    success: true,
    message: 'Order accepted successfully',
    data: order,
  });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['shipped', 'delivered', 'cancelled'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  const order = await Order.findOne({
    _id: req.params.orderId,
    shipper: req.user._id,
  });

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found or not assigned to you' });
  }

  order.status = status;
  order.statusHistory.push({
    status,
    note: `Status updated by shipper ${req.user.name}`,
    updatedBy: req.user._id,
  });

  if (status === 'delivered') {
    order.paymentStatus = 'paid';
    order.deliveredAt = Date.now();
  }

  await order.save();

  res.status(200).json({
    success: true,
    message: 'Status updated successfully',
    data: order,
  });
});

const getRoute = asyncHandler(async (req, res) => {
  const orders = await Order.find({
    shipper: req.user._id,
    status: { $in: ['processing', 'shipped'] },
  }).select('shippingAddress status orderNumber total');

  const stops = orders.map((order) => ({
    id: order._id,
    address: order.shippingAddress,
    status: order.status,
    orderNumber: order.orderNumber,
  }));

  res.status(200).json({
    success: true,
    data: {
      route: {
        totalStops: stops.length,
        stops,
      },
    },
  });
});

module.exports = {
  getDashboard,
  getOrders,
  acceptOrder,
  updateOrderStatus,
  getRoute,
};
