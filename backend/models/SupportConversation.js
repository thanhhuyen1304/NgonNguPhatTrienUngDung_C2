const mongoose = require('mongoose');

const supportConversationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    assignedAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },
    lastMessagePreview: {
      type: String,
      default: '',
      trim: true,
      maxlength: 200,
    },
    lastSender: {
      type: String,
      enum: ['user', 'admin', null],
      default: null,
    },
    adminUnreadCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    userUnreadCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

supportConversationSchema.index({ lastMessageAt: -1 });

module.exports = mongoose.model('SupportConversation', supportConversationSchema);
