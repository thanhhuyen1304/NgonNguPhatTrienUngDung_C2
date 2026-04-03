const mongoose = require('mongoose');

const supportAttachmentSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      default: null,
    },
    mimeType: {
      type: String,
      default: null,
    },
    originalName: {
      type: String,
      default: null,
    },
    size: {
      type: Number,
      default: null,
    },
  },
  { _id: true }
);

const supportMessageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SupportConversation',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderRole: {
      type: String,
      enum: ['user', 'admin'],
      required: true,
    },
    text: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    attachments: [supportAttachmentSchema],
    readByAdminAt: {
      type: Date,
      default: null,
    },
    readByUserAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

supportMessageSchema.index({ conversation: 1, createdAt: 1 });

const SupportMessage = mongoose.models.SupportMessage || mongoose.model('SupportMessage', supportMessageSchema);

module.exports = SupportMessage;
