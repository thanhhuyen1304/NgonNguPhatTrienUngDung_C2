import api from './api';
import {
  extractConversation,
  extractConversations,
  extractMessages,
  getResponsePayload,
  normalizeConversation,
  normalizeMessage,
  sortMessagesByTime,
} from '../components/support/supportUtils';

const buildMultipartConfig = () => ({
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

const buildSupportFormData = ({ text, attachments = [] }) => {
  const formData = new FormData();

  if (text) {
    formData.append('text', text);
  }

  attachments.forEach((attachment) => {
    formData.append('attachments', attachment.file || attachment);
  });

  return formData;
};

export const getMySupportConversation = async () => {
  const response = await api.get('/support/me');
  const payload = getResponsePayload(response);
  return normalizeConversation(extractConversation(payload));
};

export const getSupportConversationMessages = async (conversationId) => {
  const response = await api.get(`/support/conversations/${conversationId}/messages`);
  const payload = getResponsePayload(response);

  return sortMessagesByTime(
    extractMessages(payload).map(normalizeMessage).filter(Boolean)
  );
};

export const markSupportConversationRead = async (conversationId) => {
  await api.patch(`/support/conversations/${conversationId}/read`);
};

export const sendSupportMessage = async ({ conversationId, text, attachments = [] }) => {
  const response = await api.post(
    `/support/conversations/${conversationId}/messages`,
    buildSupportFormData({ text, attachments }),
    buildMultipartConfig()
  );
  const payload = getResponsePayload(response);
  return normalizeMessage(payload?.message || payload?.data?.message || null);
};

export const getAdminSupportConversations = async () => {
  const response = await api.get('/support/admin/conversations');
  const payload = getResponsePayload(response);

  return extractConversations(payload)
    .map(normalizeConversation)
    .filter(Boolean)
    .sort(
      (left, right) =>
        new Date(right.lastMessageAt || 0).getTime() - new Date(left.lastMessageAt || 0).getTime()
    );
};

export const getAdminSupportMessages = async (conversationId) => {
  const response = await api.get(`/support/admin/conversations/${conversationId}/messages`);
  const payload = getResponsePayload(response);

  return sortMessagesByTime(
    extractMessages(payload).map(normalizeMessage).filter(Boolean)
  );
};

export const markAdminSupportConversationRead = async (conversationId) => {
  await api.patch(`/support/admin/conversations/${conversationId}/read`);
};

export const sendAdminSupportMessage = async ({ conversationId, text, attachments = [] }) => {
  const response = await api.post(
    `/support/admin/conversations/${conversationId}/messages`,
    buildSupportFormData({ text, attachments }),
    buildMultipartConfig()
  );
  const payload = getResponsePayload(response);
  return normalizeMessage(payload?.message || payload?.data?.message || null);
};

export const updateAdminSupportConversationStatus = async ({ conversationId, status }) => {
  await api.patch(`/support/admin/conversations/${conversationId}/status`, { status });
};

export const deleteAdminSupportConversation = async (conversationId) => {
  await api.delete(`/support/admin/conversations/${conversationId}`);
};
