const asyncHandler = require('express-async-handler');
const supportService = require('../services/supportService');

const getMyConversation = asyncHandler(async (req, res) => {
  const data = await supportService.getMyConversation(req.user._id);
  res.json({ success: true, data });
});

const getConversationMessages = asyncHandler(async (req, res) => {
  const data = await supportService.getConversationMessages({
    conversationId: req.params.id,
    user: req.user,
  });
  res.json({ success: true, data });
});

const sendUserMessage = asyncHandler(async (req, res) => {
  const data = await supportService.sendUserMessage({
    conversationId: req.params.id,
    user: req.user,
    text: req.body.text,
    files: req.files || [],
  });

  res.status(201).json({ success: true, data });
});

const markUserConversationRead = asyncHandler(async (req, res) => {
  const data = await supportService.markUserConversationRead({
    conversationId: req.params.id,
    user: req.user,
  });
  res.json({ success: true, data });
});

const getAdminConversations = asyncHandler(async (req, res) => {
  const data = await supportService.getAdminConversations(req.query);
  res.json({ success: true, data });
});

const getAdminConversationMessages = asyncHandler(async (req, res) => {
  const data = await supportService.getAdminConversationMessages(req.params.id);
  res.json({ success: true, data });
});

const sendAdminMessage = asyncHandler(async (req, res) => {
  const data = await supportService.sendAdminMessage({
    conversationId: req.params.id,
    user: req.user,
    text: req.body.text,
    files: req.files || [],
  });

  res.status(201).json({ success: true, data });
});

const markAdminConversationRead = asyncHandler(async (req, res) => {
  const data = await supportService.markAdminConversationRead(req.params.id);
  res.json({ success: true, data });
});

const updateConversationStatus = asyncHandler(async (req, res) => {
  const data = await supportService.updateConversationStatus({
    conversationId: req.params.id,
    status: req.body.status,
    adminId: req.user._id,
  });
  res.json({ success: true, data });
});

const deleteAdminConversation = asyncHandler(async (req, res) => {
  await supportService.deleteAdminConversation(req.params.id);
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
