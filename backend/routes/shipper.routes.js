const express = require('express');
const router = express.Router();
const { protect, shipper } = require('../middleware/auth');
const Order = require('../models/Order');

// @desc    Get shipper dashboard
// @route   GET /api/shipper/dashboard
// @access  Private/Shipper
router.get('/dashboard', protect, shipper, async (req, res) => {
  try {
    const user = req.user;
    
    // Get statistics
    const totalDeliveries = await Order.countDocuments({ 
      shipper: user._id, 
      status: 'delivered' 
    });
    
    const activeDeliveries = await Order.countDocuments({ 
      shipper: user._id, 
      status: { $in: ['processing', 'shipped'] } 
    });

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        shipperInfo: {
          ...user.shipperInfo,
          totalDeliveries // Update real count
        },
        stats: {
          totalDeliveries,
          activeDeliveries
        }
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message,
    });
  }
});

// @desc    Get shipper orders (available and assigned)
// @route   GET /api/shipper/orders
// @access  Private/Shipper
router.get('/orders', protect, shipper, async (req, res) => {
  try {
    const { type } = req.query; // 'available' or 'my-orders' or undefined (all)

    let query = {};

    if (type === 'available') {
      // Orders that are confirmed/processing but have no shipper
      query = {
        status: { $in: ['confirmed', 'processing'] },
        shipper: null
      };
    } else if (type === 'active') {
       // Orders assigned to this shipper and not yet delivered
       query = {
        shipper: req.user._id,
        status: { $in: ['processing', 'shipped'] }
      };
    } else if (type === 'history') {
      // Delivered orders
      query = {
        shipper: req.user._id,
        status: 'delivered'
      };
    } else {
      // Default: show my active orders
       query = {
        shipper: req.user._id,
        status: { $in: ['processing', 'shipped'] }
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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message,
    });
  }
});

// @desc    Accept delivery order
// @route   POST /api/shipper/orders/:orderId/accept
// @access  Private/Shipper
router.post('/orders/:orderId/accept', protect, shipper, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.shipper) {
      return res.status(400).json({ success: false, message: 'Order already assigned to a shipper' });
    }

    if (order.status === 'delivered' || order.status === 'cancelled') {
        return res.status(400).json({ success: false, message: 'Cannot accept completed or cancelled order' });
    }

    order.shipper = req.user._id;
    // If it was just confirmed, move it to processing when shipper accepts
    if (order.status === 'confirmed') {
        order.status = 'processing';
    }
    
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order accepted successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error accepting order',
      error: error.message,
    });
  }
});

// @desc    Update delivery status
// @route   PUT /api/shipper/orders/:orderId/status
// @access  Private/Shipper
router.put('/orders/:orderId/status', protect, shipper, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['shipped', 'delivered', 'cancelled']; // processing is set on accept

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const order = await Order.findOne({
      _id: req.params.orderId,
      shipper: req.user._id
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found or not assigned to you' });
    }

    order.status = status;
    
    // Add to status history
    order.statusHistory.push({
      status,
      note: `Status updated by shipper ${req.user.name}`,
      updatedBy: req.user._id
    });

    if (status === 'delivered') {
      order.paymentStatus = 'paid'; // Assuming COD or confirming delivery
      order.deliveredAt = Date.now();
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating status',
      error: error.message,
    });
  }
});

// @desc    Get shipper route
// @route   GET /api/shipper/route
// @access  Private/Shipper
router.get('/route', protect, shipper, async (req, res) => {
  try {
    // Get active orders with address info
    const orders = await Order.find({
      shipper: req.user._id,
      status: { $in: ['processing', 'shipped'] }
    }).select('shippingAddress status orderNumber total');

    // Simple implementation: List of stops based on orders
    const stops = orders.map(order => ({
        id: order._id,
        address: order.shippingAddress,
        status: order.status,
        orderNumber: order.orderNumber
    }));

    res.status(200).json({
      success: true,
      data: {
        route: {
          totalStops: stops.length,
          stops: stops
        }
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching route',
      error: error.message,
    });
  }
});

module.exports = router;
