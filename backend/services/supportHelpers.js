const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const SupportConversation = require('../schemas/SupportConversation');
const SupportMessage = require('../schemas/SupportMessage');
const { AppError } = require('../middleware/error');
const { uploadBuffer } = require('../config/cloudinary');

const SUPPORT_FOLDER = 'ecommerce/support';
const LOCAL_SUPPORT_UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'support');

const buildMessagePreview = (text, attachmentsCount) => {
  const trimmed = (text || '').trim();

  if (trimmed) {
    return trimmed.slice(0, 200);
  }

  if (attachmentsCount > 0) {
    return attachmentsCount === 1 ? '[Image]' : `[${attachmentsCount} images]`;
  }

  return '';
};

const ensureConversationAccess = (conversation, user) => {
  if (user.role === 'admin') {
    return true;
  }

  if (conversation.user.toString() !== user._id.toString()) {
    throw new AppError('Not authorized to access this conversation', 403);
  }

  return true;
};

const populateConversation = (query) =>
  query.populate('user', 'name email avatar role').populate('assignedAdmin', 'name email avatar role');

const populateMessage = (query) => query.populate('sender', 'name email avatar role');

const normalizeAttachments = async (files = []) => {
  const attachments = [];

  await fs.mkdir(LOCAL_SUPPORT_UPLOAD_DIR, { recursive: true });

  for (const file of files) {
    if (file.path) {
      attachments.push({
        url: file.path,
        publicId: file.filename || null,
        mimeType: file.mimetype || null,
        originalName: file.originalname || null,
        size: file.size || null,
      });
      continue;
    }

    if (file.buffer) {
      if (!process.env.CLOUDINARY_CLOUD_NAME) {
        const extension = path.extname(file.originalname || '') || '.png';
        const fileName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${extension}`;
        const filePath = path.join(LOCAL_SUPPORT_UPLOAD_DIR, fileName);

        await fs.writeFile(filePath, file.buffer);

        attachments.push({
          url: `/uploads/support/${fileName}`,
          publicId: fileName,
          mimeType: file.mimetype || null,
          originalName: file.originalname || null,
          size: file.size || null,
        });
        continue;
      }

      const uploaded = await uploadBuffer(file.buffer, SUPPORT_FOLDER);
      attachments.push({
        url: uploaded.secure_url || uploaded.url,
        publicId: uploaded.public_id || null,
        mimeType: file.mimetype || null,
        originalName: file.originalname || null,
        size: file.size || null,
      });
    }
  }

  return attachments;
};

const markConversationRead = async (conversation, role) => {
  const now = new Date();
  const messageQuery = { conversation: conversation._id };

  if (role === 'admin') {
    conversation.adminUnreadCount = 0;
    await SupportMessage.updateMany(
      { ...messageQuery, senderRole: 'user', readByAdminAt: null },
      { $set: { readByAdminAt: now } }
    );
  } else {
    conversation.userUnreadCount = 0;
    await SupportMessage.updateMany(
      { ...messageQuery, senderRole: 'admin', readByUserAt: null },
      { $set: { readByUserAt: now } }
    );
  }

  await conversation.save();
  return conversation;
};

const createSupportMessage = async ({ conversation, sender, senderRole, text, files }) => {
  const normalizedText = (text || '').trim();
  const attachments = await normalizeAttachments(files);

  if (!normalizedText && attachments.length === 0) {
    throw new AppError('Message text or at least one image is required', 400);
  }

  const message = await SupportMessage.create({
    conversation: conversation._id,
    sender: sender._id,
    senderRole,
    text: normalizedText,
    attachments,
    readByAdminAt: senderRole === 'admin' ? new Date() : null,
    readByUserAt: senderRole === 'user' ? new Date() : null,
  });

  conversation.lastMessageAt = message.createdAt;
  conversation.lastMessagePreview = buildMessagePreview(normalizedText, attachments.length);
  conversation.lastSender = senderRole;

  if (senderRole === 'user') {
    conversation.status = 'open';
    conversation.adminUnreadCount += 1;
    conversation.userUnreadCount = 0;
  } else {
    conversation.status = 'open';
    conversation.userUnreadCount += 1;
    conversation.adminUnreadCount = 0;
    conversation.assignedAdmin = sender._id;
  }

  await conversation.save();

  const populatedMessage = await populateMessage(SupportMessage.findById(message._id));
  const populatedConversation = await populateConversation(SupportConversation.findById(conversation._id));

  return {
    message: populatedMessage,
    conversation: populatedConversation,
  };
};

module.exports = {
  ensureConversationAccess,
  populateConversation,
  populateMessage,
  markConversationRead,
  createSupportMessage,
};
