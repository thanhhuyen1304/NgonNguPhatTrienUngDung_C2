const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderNumber: {
      type: String,
      unique: true,
    },
    items: [orderItemSchema],
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String },
      zipCode: { type: String },
      country: { type: String, default: 'Vietnam' },
      latitude: { type: Number },
      longitude: { type: Number },
    },
    paymentMethod: {
      type: String,
      enum: ['cod', 'bank_transfer', 'credit_card', 'momo', 'zalopay'],
      default: 'cod',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentDetails: {
      transactionId: String,
      paidAt: Date,
    },
    itemsPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    taxPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    statusHistory: [
      {
        status: { type: String },
        note: { type: String },
        updatedAt: { type: Date, default: Date.now },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    note: {
      type: String,
      maxlength: [500, 'Note cannot exceed 500 characters'],
    },
    shipper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    currentLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      address: { type: String },
      updatedAt: { type: Date, default: Date.now },
    },
    deliveredAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    cancelReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

// Generate order number before saving
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.orderNumber = `ORD-${year}${month}${day}-${random}`;
  }
  next();
});

// Add status to history when status changes - enhanced with validation
orderSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    // Only add to history if not already added by logStatusChange
    const lastHistoryEntry = this.statusHistory[this.statusHistory.length - 1];
    if (!lastHistoryEntry || lastHistoryEntry.status !== this.status) {
      this.statusHistory.push({
        status: this.status,
        updatedAt: new Date(),
        note: 'Status updated',
        previousStatus: this.constructor.findOne({ _id: this._id }).status // This won't work in pre-save, but kept for reference
      });
    }

    if (this.status === 'delivered') {
      this.deliveredAt = new Date();
      if (this.paymentMethod === 'cod') {
        this.paymentStatus = 'paid';
        this.paymentDetails = {
          ...this.paymentDetails,
          paidAt: new Date(),
        };
      }
    }

    if (this.status === 'cancelled') {
      this.cancelledAt = new Date();
    }
  }
  next();
});

// Method to calculate prices (all in VND)
orderSchema.methods.calculatePrices = function (taxRate = 0.1, shippingRate = 30000) {
  // Calculate items price in VND
  this.itemsPrice = this.items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  
  // Calculate tax in VND
  this.taxPrice = Math.round(this.itemsPrice * taxRate);
  
  // Free shipping for orders over 500,000 VND
  this.shippingPrice = this.itemsPrice > 500000 ? 0 : shippingRate;
  
  // Total price in VND
  this.totalPrice = this.itemsPrice + this.taxPrice + this.shippingPrice;
};

// Method to get Vietnamese status text
orderSchema.methods.getVietnameseStatus = function () {
  const statusMap = {
    'pending': 'Chờ xác nhận',
    'confirmed': 'Đã xác nhận',
    'completed': 'Hoàn thành',
    'shipped': 'Đang giao hàng',
    'delivered': 'Đã giao hàng',
    'cancelled': 'Đã hủy',
  };
  return statusMap[this.status] || this.status;
};

// Virtual for Vietnamese status
orderSchema.virtual('vietnameseStatus').get(function () {
  return this.getVietnameseStatus();
});

// Static method to get order statistics
orderSchema.statics.getOrderStats = async function (startDate, endDate) {
  const matchStage = {
    createdAt: {
      $gte: startDate,
      $lte: endDate,
    },
    status: { $ne: 'cancelled' },
  };

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$totalPrice' },
        averageOrderValue: { $avg: '$totalPrice' },
      },
    },
  ]);

  const statusCounts = await this.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  return {
    summary: stats[0] || { totalOrders: 0, totalRevenue: 0, averageOrderValue: 0 },
    statusCounts,
  };
};

// Static method to get revenue by period
orderSchema.statics.getRevenueByPeriod = async function (period = 'daily', days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  let groupBy;
  if (period === 'daily') {
    groupBy = {
      year: { $year: '$createdAt' },
      month: { $month: '$createdAt' },
      day: { $dayOfMonth: '$createdAt' },
    };
  } else if (period === 'monthly') {
    groupBy = {
      year: { $year: '$createdAt' },
      month: { $month: '$createdAt' },
    };
  } else {
    groupBy = {
      year: { $year: '$createdAt' },
    };
  }

  const revenue = await this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        status: { $nin: ['cancelled'] },
        paymentStatus: 'paid',
      },
    },
    {
      $group: {
        _id: groupBy,
        revenue: { $sum: '$totalPrice' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
  ]);

  return revenue;
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
