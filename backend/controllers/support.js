const asyncHandler = require('express-async-handler');
const SupportConversation = require('../schemas/SupportConversation');
const SupportMessage = require('../schemas/SupportMessage');
const { AppError } = require('../middleware/error');
const {
  ensureConversationAccess,
  populateConversation,
  populateMessage,
  markConversationRead,
  createSupportMessage,
} = require('./support.helpers');

const getMyConversation = asyncHandler(async (req, res) => {
  let conversation = await populateConversation(SupportConversation.findOne({ user: req.user._id }));

  if (!conversation) {
    conversation = await SupportConversation.create({ user: req.user._id, status: 'open' });
    conversation = await populateConversation(SupportConversation.findById(conversation._id));
  }

  res.json({ success: true, data: { conversation } });
});

const getConversationMessages = asyncHandler(async (req, res) => {
  const conversation = await SupportConversation.findById(req.params.id);

  if (!conversation) {
    throw new AppError('Support conversation not found', 404);
  }

  ensureConversationAccess(conversation, req.user);
  const messages = await populateMessage(SupportMessage.find({ conversation: conversation._id }).sort({ createdAt: 1 }));

  res.json({ success: true, data: { messages } });
});

const sendUserMessage = asyncHandler(async (req, res) => {
  const conversation = await SupportConversation.findById(req.params.id);

  if (!conversation) {
    throw new AppError('Support conversation not found', 404);
  }

  ensureConversationAccess(conversation, req.user);
  const result = await createSupportMessage({
    conversation,
    sender: req.user,
    senderRole: 'user',
    text: req.body.text,
    files: req.files,
  });

  res.status(201).json({ success: true, data: result });
});

const markUserConversationRead = asyncHandler(async (req, res) => {
  const conversation = await SupportConversation.findById(req.params.id);

  if (!conversation) {
    throw new AppError('Support conversation not found', 404);
  }

  ensureConversationAccess(conversation, req.user);
  await markConversationRead(conversation, 'user');
  const populatedConversation = await populateConversation(SupportConversation.findById(conversation._id));

  res.json({ success: true, data: { conversation: populatedConversation } });
});

const getAdminConversations = asyncHandler(async (req, res) => {
  const search = (req.query.search || '').trim();
  const status = (req.query.status || '').trim();

  let conversations = await populateConversation(
    SupportConversation.find({ ...(status && { status }) }).sort({ lastMessageAt: -1, updatedAt: -1 })
  );

  if (search) {
    const lowerSearch = search.toLowerCase();
    conversations = conversations.filter((conversation) => {
      const name = conversation.user?.name?.toLowerCase() || '';
      const email = conversation.user?.email?.toLowerCase() || '';
      return name.includes(lowerSearch) || email.includes(lowerSearch);
    });
  }

  res.json({ success: true, data: { conversations } });
});

const getAdminConversationMessages = asyncHandler(async (req, res) => {
  const conversation = await SupportConversation.findById(req.params.id);

  if (!conversation) {
    throw new AppError('Support conversation not found', 404);
  }

  const messages = await populateMessage(SupportMessage.find({ conversation: conversation._id }).sort({ createdAt: 1 }));
  res.json({ success: true, data: { messages } });
});

const sendAdminMessage = asyncHandler(async (req, res) => {
  const conversation = await SupportConversation.findById(req.params.id);

  if (!conversation) {
    throw new AppError('Support conversation not found', 404);
  }

  const result = await createSupportMessage({
    conversation,
    sender: req.user,
    senderRole: 'admin',
    text: req.body.text,
    files: req.files,
  });

  res.status(201).json({ success: true, data: result });
});

const markAdminConversationRead = asyncHandler(async (req, res) => {
  const conversation = await SupportConversation.findById(req.params.id);

  if (!conversation) {
    throw new AppError('Support conversation not found', 404);
  }

  await markConversationRead(conversation, 'admin');
  const populatedConversation = await populateConversation(SupportConversation.findById(conversation._id));

  res.json({ success: true, data: { conversation: populatedConversation } });
});

const updateConversationStatus = asyncHandler(async (req, res) => {
  const conversation = await SupportConversation.findById(req.params.id);

  if (!conversation) {
    throw new AppError('Support conversation not found', 404);
  }

  conversation.status = req.body.status;
  if (!conversation.assignedAdmin) {
    conversation.assignedAdmin = req.user._id;
  }

  await conversation.save();
  const populatedConversation = await populateConversation(SupportConversation.findById(conversation._id));

  res.json({ success: true, data: { conversation: populatedConversation } });
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
};
