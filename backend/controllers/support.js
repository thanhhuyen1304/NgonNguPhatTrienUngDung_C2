const asyncHandler = require('express-async-handler');
const SupportConversation = require('../schemas/SupportConversation');
const SupportMessage = require('../schemas/SupportMessage');
const { AppError } = require('../middleware/error');
const { sendNotification } = require('../socket/socketServer');
const { deleteImage } = require('../config/cloudinary');
const {
  ensureConversationAccess,
  populateConversation,
  populateMessage,
  markConversationRead,
  createSupportMessage,
} = require('../utils/supportHelpers');

const getConversationOrThrow = async (conversationId) => {
  const conversation = await SupportConversation.findById(conversationId);
  if (!conversation) {
    throw new AppError('Support conversation not found', 404);
  }
  return conversation;
};

const getMyConversation = asyncHandler(async (req, res) => {
  let conversation = await populateConversation(
    SupportConversation.findOne({ user: req.user._id })
  );

  if (!conversation) {
    conversation = await SupportConversation.create({ user: req.user._id, status: 'open' });
    conversation = await populateConversation(
      SupportConversation.findById(conversation._id)
    );
  }

  res.json({ success: true, data: { conversation } });
});

const getConversationMessages = asyncHandler(async (req, res) => {
  const conversation = await getConversationOrThrow(req.params.id);
  ensureConversationAccess(conversation, req.user);

  const messages = await populateMessage(
    SupportMessage.find({ conversation: conversation._id }).sort({ createdAt: 1 })
  );

  res.json({ success: true, data: { messages } });
});

const sendUserMessage = asyncHandler(async (req, res) => {
  const conversation = await getConversationOrThrow(req.params.id);
  ensureConversationAccess(conversation, req.user);

  const data = await createSupportMessage({
    conversation,
    sender: req.user,
    senderRole: 'user',
    text: req.body.text,
    files: req.files || [],
  });

  await sendNotification({
    recipient: 'admin',
    title: 'Tin nhắn hỗ trợ mới',
    message: `Khách hàng ${req.user.name} đã gửi một tin nhắn mới.`,
    type: 'support',
    link: `/admin/support/${conversation._id}`,
    sender: req.user._id,
  });

  res.status(201).json({ success: true, data });
});

const markUserConversationRead = asyncHandler(async (req, res) => {
  const conversation = await getConversationOrThrow(req.params.id);
  ensureConversationAccess(conversation, req.user);
  await markConversationRead(conversation, 'user');

  const populatedConversation = await populateConversation(
    SupportConversation.findById(conversation._id)
  );

  res.json({ success: true, data: { conversation: populatedConversation } });
});

const getAdminConversations = asyncHandler(async (req, res) => {
  let conversations = await populateConversation(
    SupportConversation.find({ ...(req.query.status && { status: req.query.status }) }).sort({
      lastMessageAt: -1,
      updatedAt: -1,
    })
  );

  const normalizedSearch = (req.query.search || '').trim().toLowerCase();
  if (normalizedSearch) {
    conversations = conversations.filter((conversation) => {
      const name = conversation.user?.name?.toLowerCase() || '';
      const email = conversation.user?.email?.toLowerCase() || '';
      return name.includes(normalizedSearch) || email.includes(normalizedSearch);
    });
  }

  res.json({ success: true, data: { conversations } });
});

const getAdminConversationMessages = asyncHandler(async (req, res) => {
  const conversation = await getConversationOrThrow(req.params.id);
  const messages = await populateMessage(
    SupportMessage.find({ conversation: conversation._id }).sort({ createdAt: 1 })
  );

  res.json({ success: true, data: { messages } });
});

const sendAdminMessage = asyncHandler(async (req, res) => {
  const conversation = await getConversationOrThrow(req.params.id);
  const data = await createSupportMessage({
    conversation,
    sender: req.user,
    senderRole: 'admin',
    text: req.body.text,
    files: req.files || [],
  });

  await sendNotification({
    recipient: conversation.user.toString(),
    title: 'Phản hồi từ hỗ trợ',
    message: 'Quản trị viên đã phản hồi yêu cầu hỗ trợ của bạn.',
    type: 'support',
    link: '/support',
    sender: req.user._id,
  });

  res.status(201).json({ success: true, data });
});

const markAdminConversationRead = asyncHandler(async (req, res) => {
  const conversation = await getConversationOrThrow(req.params.id);
  await markConversationRead(conversation, 'admin');

  const populatedConversation = await populateConversation(
    SupportConversation.findById(conversation._id)
  );

  res.json({ success: true, data: { conversation: populatedConversation } });
});

const updateConversationStatus = asyncHandler(async (req, res) => {
  const conversation = await getConversationOrThrow(req.params.id);
  conversation.status = req.body.status;

  if (!conversation.assignedAdmin) {
    conversation.assignedAdmin = req.user._id;
  }

  await conversation.save();

  const populatedConversation = await populateConversation(
    SupportConversation.findById(conversation._id)
  );

  res.json({ success: true, data: { conversation: populatedConversation } });
});

const deleteAdminConversation = asyncHandler(async (req, res) => {
  const conversation = await getConversationOrThrow(req.params.id);
  const messages = await SupportMessage.find({ conversation: conversation._id });

  for (const message of messages) {
    if (!message.attachments || message.attachments.length === 0) {
      continue;
    }

    for (const attachment of message.attachments) {
      if (!attachment.publicId) {
        continue;
      }

      try {
        await deleteImage(attachment.publicId);
      } catch (error) {
        console.error(`Failed to delete support attachment ${attachment.publicId}:`, error);
      }
    }
  }

  await SupportMessage.deleteMany({ conversation: conversation._id });
  await SupportConversation.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Support conversation deleted successfully' });
});

module.exports = {
  getMyConversation,
  getConversationMessages,
  sendUserMessage,
  markUserConversationRead,
  getAdminConversations,
  getAdminConversationMessages,
  sendAdminMessage,
  markAdminConversationRead,
  updateConversationStatus,
  deleteAdminConversation,
};
