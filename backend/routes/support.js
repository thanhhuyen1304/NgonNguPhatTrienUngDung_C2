const express = require('express');
const router = express.Router();

const { protect, admin } = require('../middleware/auth');
const {
  mongoIdValidation,
  supportMessageValidation,
  supportConversationStatusValidation,
} = require('../middleware/validate');
const { upload } = require('../config/cloudinary');
const {
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
} = require('../controllers/support');

const customerOnly = (req, res, next) => {
  if (req.user && req.user.role === 'user') {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Only customers can access this support channel',
  });
};

router.use(protect);

router.get('/me', customerOnly, getMyConversation);
router.get('/conversations/:id/messages', customerOnly, mongoIdValidation('id'), getConversationMessages);
router.post(
  '/conversations/:id/messages',
  customerOnly,
  mongoIdValidation('id'),
  upload.array('attachments', 3),
  supportMessageValidation,
  sendUserMessage
);
router.patch('/conversations/:id/read', customerOnly, mongoIdValidation('id'), markUserConversationRead);

router.get('/admin/conversations', admin, getAdminConversations);
router.get('/admin/conversations/:id/messages', admin, mongoIdValidation('id'), getAdminConversationMessages);
router.post(
  '/admin/conversations/:id/messages',
  admin,
  mongoIdValidation('id'),
  upload.array('attachments', 3),
  supportMessageValidation,
  sendAdminMessage
);
router.patch('/admin/conversations/:id/read', admin, mongoIdValidation('id'), markAdminConversationRead);
router.patch(
  '/admin/conversations/:id/status',
  admin,
  mongoIdValidation('id'),
  supportConversationStatusValidation,
  updateConversationStatus
);
router.delete('/admin/conversations/:id', admin, mongoIdValidation('id'), deleteAdminConversation);

module.exports = router;
