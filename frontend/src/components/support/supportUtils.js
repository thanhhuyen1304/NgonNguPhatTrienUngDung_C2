export const getResponsePayload = (response) => response?.data?.data ?? response?.data ?? null;

export const extractConversation = (payload) => {
  if (!payload) {
    return null;
  }

  if (payload.conversation) {
    return payload.conversation;
  }

  if (payload.data?.conversation) {
    return payload.data.conversation;
  }

  if (payload._id || payload.id) {
    return payload;
  }

  return null;
};

export const extractConversations = (payload) => {
  if (Array.isArray(payload?.conversations)) {
    return payload.conversations;
  }

  if (Array.isArray(payload?.data?.conversations)) {
    return payload.data.conversations;
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  return [];
};

export const extractMessages = (payload) => {
  if (Array.isArray(payload?.messages)) {
    return payload.messages;
  }

  if (Array.isArray(payload?.data?.messages)) {
    return payload.data.messages;
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  return [];
};

export const isImageUrl = (url = '', mimeType = '') => {
  if (mimeType.startsWith('image/')) {
    return true;
  }

  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(url);
};

export const normalizeAttachment = (attachment, index = 0) => {
  if (!attachment) {
    return null;
  }

  if (typeof attachment === 'string') {
      return {
        id: `${attachment}-${index}`,
        url: attachment,
        originalName: 'Tệp đính kèm',
        mimeType: '',
        isImage: isImageUrl(attachment),
      };
  }

  const url = attachment.url || attachment.secure_url || attachment.path || '';
  const mimeType = attachment.mimeType || attachment.type || '';

  return {
    ...attachment,
    id: attachment._id || attachment.id || `${url}-${index}`,
    url,
    originalName: attachment.originalName || attachment.name || 'Tệp đính kèm',
    mimeType,
    isImage: isImageUrl(url, mimeType),
  };
};

export const normalizeConversation = (conversation) => {
  if (!conversation) {
    return null;
  }

  const user = conversation.user && typeof conversation.user === 'object'
    ? conversation.user
    : null;
  const assignedAdmin = conversation.assignedAdmin && typeof conversation.assignedAdmin === 'object'
    ? conversation.assignedAdmin
    : null;

  return {
    ...conversation,
    _id: conversation._id || conversation.id,
    user,
    assignedAdmin,
    status: conversation.status || 'open',
    lastMessageAt: conversation.lastMessageAt || conversation.updatedAt || conversation.createdAt || null,
    lastMessagePreview: conversation.lastMessagePreview || '',
    lastSender: conversation.lastSender || null,
    adminUnreadCount: conversation.adminUnreadCount || 0,
    userUnreadCount: conversation.userUnreadCount || 0,
  };
};

export const normalizeMessage = (message) => {
  if (!message) {
    return null;
  }

  const sender = message.sender && typeof message.sender === 'object'
    ? message.sender
    : null;
  const senderRole = message.senderRole || sender?.role || 'user';
  const attachments = Array.isArray(message.attachments)
    ? message.attachments.map(normalizeAttachment).filter(Boolean)
    : [];
  const createdAt = message.createdAt || message.updatedAt || new Date().toISOString();

  return {
    ...message,
    _id: message._id || message.id || `${senderRole}-${createdAt}`,
    sender,
    senderId: sender?._id || message.senderId || message.sender || null,
    senderRole,
    senderName: sender?.name || message.senderName || (senderRole === 'admin' ? 'Hỗ trợ' : 'Khách hàng'),
    text: message.text || message.message || message.content || '',
    attachments,
    createdAt,
  };
};

export const sortMessagesByTime = (messages) => {
  return [...messages].sort((left, right) => {
    return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
  });
};

export const mergeMessages = (currentMessages, incomingMessages) => {
  const mergedMap = new Map();

  [...currentMessages, ...incomingMessages].forEach((message) => {
    if (!message?._id) {
      return;
    }

    mergedMap.set(message._id, message);
  });

  return sortMessagesByTime(Array.from(mergedMap.values()));
};

export const createAttachmentPreview = (file) => ({
  id: `${file.name}-${file.lastModified}-${file.size}`,
  file,
  name: file.name,
  size: file.size,
  mimeType: file.type,
  previewUrl: URL.createObjectURL(file),
  isImage: file.type.startsWith('image/'),
});

export const revokeAttachmentPreview = (attachment) => {
  if (attachment?.previewUrl?.startsWith('blob:')) {
    URL.revokeObjectURL(attachment.previewUrl);
  }
};

export const formatSupportTime = (value) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  const now = new Date();
  const isSameDay = date.toDateString() === now.toDateString();

  if (isSameDay) {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};
