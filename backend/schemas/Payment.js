const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    paymentCode: {
      type: String,
      unique: true,
    },
    provider: {
      type: String,
      enum: ['cod', 'bank_transfer', 'credit_card', 'momo', 'zalopay'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'cancelled', 'refunded'],
      default: 'pending',
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    checkoutRequestKey: {
      type: String,
      default: null,
      trim: true,
    },
    providerOrderId: {
      type: String,
      default: null,
      trim: true,
    },
    providerTransactionId: {
      type: String,
      default: null,
      trim: true,
    },
    requestPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    responsePayload: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    callbackPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    note: {
      type: String,
      default: null,
      trim: true,
      maxlength: [500, 'Note cannot exceed 500 characters'],
    },
    paidAt: {
      type: Date,
      default: null,
    },
    failedAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    refundedAt: {
      type: Date,
      default: null,
    },
    lastResultCode: {
      type: String,
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ order: 1 }, { unique: true });
paymentSchema.index({ provider: 1, providerOrderId: 1 }, { sparse: true });
paymentSchema.index({ provider: 1, providerTransactionId: 1 }, { sparse: true });
paymentSchema.index({ user: 1, checkoutRequestKey: 1 }, { sparse: true });

paymentSchema.pre('save', function (next) {
  if (!this.paymentCode) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.paymentCode = `PAY-${year}${month}${day}-${random}`;
  }

  next();
});

paymentSchema.methods.markPaid = function ({ transactionId, resultCode } = {}) {
  this.status = 'paid';
  this.paidAt = new Date();

  if (transactionId) {
    this.providerTransactionId = transactionId;
  }

  if (resultCode !== undefined) {
    this.lastResultCode = String(resultCode);
  }
};

paymentSchema.methods.markFailed = function ({ resultCode } = {}) {
  this.status = 'failed';
  this.failedAt = new Date();

  if (resultCode !== undefined) {
    this.lastResultCode = String(resultCode);
  }
};

const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);

module.exports = Payment;
