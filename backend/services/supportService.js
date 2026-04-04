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
} = require('./supportHelpers');

const getConversationOrThrow = async (conversationId) => {
  const conversation = await SupportConversation.findById(conversationId);

  if (!conversation) {
    throw new AppError('Support conversation not found', 404);
  }

  return conversation;
};

const getMyConversation = async (userId) => {
  let conversation = await populateConversation(
    SupportConversation.findOne({ user: userId })
  );

  if (!conversation) {
    conversation = await SupportConversation.create({ user: userId, status: 'open' });
    conversation = await populateConversation(
      SupportConversation.findById(conversation._id)
    );
  }

  return { conversation };
};

const getConversationMessages = async ({ conversationId, user }) => {
  const conversation = await getConversationOrThrow(conversationId);
  ensureConversationAccess(conversation, user);

  const messages = await populateMessage(
    SupportMessage.find({ conversation: conversation._id }).sort({ createdAt: 1 })
  );

  return { messages };
};

const sendUserMessage = async ({ conversationId, user, text, files }) => {
  const conversation = await getConversationOrThrow(conversationId);
  ensureConversationAccess(conversation, user);

  const data = await createSupportMessage({
    conversation,
    sender: user,
    senderRole: 'user',
    text,
    files,
  });

  await sendNotification({
    recipient: 'admin',
    title: 'Tin nhắn hỗ trợ mới',
    message: `Khách hàng ${user.name} đã gửi một tin nhắn mới.`,
    type: 'support',
    link: `/admin/support/${conversation._id}`,
    sender: user._id,
  });

  return data;
};

const markUserConversationRead = async ({ conversationId, user }) => {
  const conversation = await getConversationOrThrow(conversationId);
  ensureConversationAccess(conversation, user);
  await markConversationRead(conversation, 'user');

  const populatedConversation = await populateConversation(
    SupportConversation.findById(conversation._id)
  );

  return { conversation: populatedConversation };
};

const getAdminConversations = async ({ search = '', status = '' }) => {
  let conversations = await populateConversation(
    SupportConversation.find({ ...(status && { status }) }).sort({
      lastMessageAt: -1,
      updatedAt: -1,
    })
  );

  const normalizedSearch = search.trim().toLowerCase();
  if (normalizedSearch) {
    conversations = conversations.filter((conversation) => {
      const name = conversation.user?.name?.toLowerCase() || '';
      const email = conversation.user?.email?.toLowerCase() || '';
      return name.includes(normalizedSearch) || email.includes(normalizedSearch);
    });
  }

  return { conversations };
};

const getAdminConversationMessages = async (conversationId) => {
  const conversation = await getConversationOrThrow(conversationId);
  const messages = await populateMessage(
    SupportMessage.find({ conversation: conversation._id }).sort({ createdAt: 1 })
  );

  return { messages };
};

const sendAdminMessage = async ({ conversationId, user, text, files }) => {
  const conversation = await getConversationOrThrow(conversationId);
  const data = await createSupportMessage({
    conversation,
    sender: user,
    senderRole: 'admin',
    text,
    files,
  });

  await sendNotification({
    recipient: conversation.user.toString(),
    title: 'Phản hồi từ hỗ trợ',
    message: 'Quản trị viên đã phản hồi yêu cầu hỗ trợ của bạn.',
    type: 'support',
    link: '/support',
    sender: user._id,
  });

  return data;
};

const markAdminConversationRead = async (conversationId) => {
  const conversation = await getConversationOrThrow(conversationId);
  await markConversationRead(conversation, 'admin');

  const populatedConversation = await populateConversation(
    SupportConversation.findById(conversation._id)
  );

  return { conversation: populatedConversation };
};

const updateConversationStatus = async ({ conversationId, status, adminId }) => {
  const conversation = await getConversationOrThrow(conversationId);
  conversation.status = status;

  if (!conversation.assignedAdmin) {
    conversation.assignedAdmin = adminId;
  }

  await conversation.save();

  const populatedConversation = await populateConversation(
    SupportConversation.findById(conversation._id)
  );

  return { conversation: populatedConversation };
};

const deleteAdminConversation = async (conversationId) => {
  const conversation = await getConversationOrThrow(conversationId);
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
        console.error(
          `Failed to delete support attachment ${attachment.publicId}:`,
          error
        );
      }
    }
  }

  await SupportMessage.deleteMany({ conversation: conversation._id });
  await SupportConversation.findByIdAndDelete(conversationId);
};

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
