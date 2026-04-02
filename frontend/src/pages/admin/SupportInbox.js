import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ChatBubbleLeftRightIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import SupportConversationList from '../../components/support/SupportConversationList';
import SupportMessageList from '../../components/support/SupportMessageList';
import SupportChatComposer from '../../components/support/SupportChatComposer';
import {
  createAttachmentPreview,
  extractConversations,
  extractMessages,
  getResponsePayload,
  mergeMessages,
  normalizeConversation,
  normalizeMessage,
  revokeAttachmentPreview,
  sortMessagesByTime,
} from '../../components/support/supportUtils';

const AdminSupportInbox = () => {
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [draft, setDraft] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const attachmentsRef = useRef([]);

  const cleanupAttachments = useCallback((items) => {
    items.forEach(revokeAttachmentPreview);
  }, []);

  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  useEffect(() => {
    return () => {
      cleanupAttachments(attachmentsRef.current);
    };
  }, [cleanupAttachments]);

  const selectedConversation = useMemo(() => {
    return conversations.find((conversation) => conversation._id === selectedConversationId) || null;
  }, [conversations, selectedConversationId]);

  const filteredConversations = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return conversations.filter((conversation) => {
      const matchesStatus = statusFilter === 'all' || conversation.status === statusFilter;
      const haystack = [
        conversation.user?.name,
        conversation.user?.email,
        conversation.lastMessagePreview,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const matchesSearch = !normalizedSearch || haystack.includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [conversations, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: conversations.length,
      open: conversations.filter((conversation) => conversation.status === 'open').length,
      closed: conversations.filter((conversation) => conversation.status === 'closed').length,
      unread: conversations.reduce((count, conversation) => count + conversation.adminUnreadCount, 0),
    };
  }, [conversations]);

  const markConversationAsRead = useCallback(async (conversationId) => {
    if (!conversationId) {
      return;
    }

    try {
      await api.patch(`/support/admin/conversations/${conversationId}/read`);
      setConversations((previousConversations) => previousConversations.map((conversation) => {
        if (conversation._id !== conversationId) {
          return conversation;
        }

        return {
          ...conversation,
          adminUnreadCount: 0,
        };
      }));
    } catch (error) {
      console.error('Unable to mark admin support conversation as read:', error);
    }
  }, []);

  const fetchMessages = useCallback(async (conversationId, options = {}) => {
    if (!conversationId) {
      setMessages([]);
      return [];
    }

    if (!options.silent) {
      setLoadingMessages(true);
    }

    try {
      const response = await api.get(`/support/admin/conversations/${conversationId}/messages`);
      const payload = getResponsePayload(response);
      const nextMessages = sortMessagesByTime(
        extractMessages(payload).map(normalizeMessage).filter(Boolean)
      );

      setMessages(nextMessages);
      await markConversationAsRead(conversationId);
      return nextMessages;
    } catch (error) {
      if (!options.silent) {
        toast.error(error.response?.data?.message || 'Không thể tải tin nhắn hỗ trợ');
      }
      return [];
    } finally {
      if (!options.silent) {
        setLoadingMessages(false);
      }
    }
  }, [markConversationAsRead]);

  const fetchConversations = useCallback(async (options = {}) => {
    if (!options.silent) {
      setLoadingConversations(true);
    }

    try {
      const response = await api.get('/support/admin/conversations');
      const payload = getResponsePayload(response);
      const nextConversations = extractConversations(payload)
        .map(normalizeConversation)
        .filter(Boolean)
        .sort((left, right) => {
          return new Date(right.lastMessageAt || 0).getTime() - new Date(left.lastMessageAt || 0).getTime();
        });

      setConversations(nextConversations);
      setSelectedConversationId((currentConversationId) => {
        if (currentConversationId && nextConversations.some((conversation) => conversation._id === currentConversationId)) {
          return currentConversationId;
        }

        return nextConversations[0]?._id || '';
      });
      return nextConversations;
    } catch (error) {
      if (!options.silent) {
        toast.error(error.response?.data?.message || 'Không thể tải danh sách hỗ trợ');
      }
      return [];
    } finally {
      if (!options.silent) {
        setLoadingConversations(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (selectedConversationId) {
      fetchMessages(selectedConversationId);
      return;
    }

    setMessages([]);
  }, [selectedConversationId, fetchMessages]);

  useEffect(() => {
    const intervalId = setInterval(async () => {
      const nextConversations = await fetchConversations({ silent: true });
      const activeConversationId = selectedConversationId || nextConversations[0]?._id;

      if (activeConversationId) {
        await fetchMessages(activeConversationId, { silent: true });
      }
    }, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchConversations, fetchMessages, selectedConversationId]);

  const handleAttachmentChange = (event) => {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) {
      return;
    }

    const remainingSlots = Math.max(0, 3 - attachments.length);

    if (remainingSlots === 0) {
      toast.error('Mỗi tin nhắn chỉ đính kèm tối đa 3 ảnh');
      event.target.value = '';
      return;
    }

    if (files.length > remainingSlots) {
      toast.error('Mỗi tin nhắn chỉ đính kèm tối đa 3 ảnh');
    }

    const nextAttachments = files.slice(0, remainingSlots).map(createAttachmentPreview);
    setAttachments((previousAttachments) => [...previousAttachments, ...nextAttachments]);
    event.target.value = '';
  };

  const handleRemoveAttachment = (attachmentId) => {
    setAttachments((previousAttachments) => {
      const targetAttachment = previousAttachments.find((item) => item.id === attachmentId);

      if (targetAttachment) {
        revokeAttachmentPreview(targetAttachment);
      }

      return previousAttachments.filter((item) => item.id !== attachmentId);
    });
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();

    const trimmedDraft = draft.trim();

    if ((!trimmedDraft && attachments.length === 0) || !selectedConversationId || sending) {
      return;
    }

    try {
      setSending(true);
      const formData = new FormData();

      if (trimmedDraft) {
        formData.append('text', trimmedDraft);
      }

      attachments.forEach((attachment) => {
        formData.append('attachments', attachment.file);
      });

      const response = await api.post(
        `/support/admin/conversations/${selectedConversationId}/messages`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const payload = getResponsePayload(response);
      const returnedMessage = normalizeMessage(payload?.message || payload?.data?.message || null);

      if (returnedMessage) {
        setMessages((previousMessages) => mergeMessages(previousMessages, [returnedMessage]));
      } else {
        await fetchMessages(selectedConversationId, { silent: true });
      }

      cleanupAttachments(attachments);
      setAttachments([]);
      setDraft('');
      await fetchConversations({ silent: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể gửi phản hồi hỗ trợ');
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (nextStatus) => {
    if (!selectedConversationId || nextStatus === selectedConversation?.status) {
      return;
    }

    try {
      setUpdatingStatus(true);
      await api.patch(`/support/admin/conversations/${selectedConversationId}/status`, {
        status: nextStatus,
      });

      setConversations((previousConversations) => previousConversations.map((conversation) => {
        if (conversation._id !== selectedConversationId) {
          return conversation;
        }

        return {
          ...conversation,
          status: nextStatus,
        };
      }));

      toast.success(nextStatus === 'closed' ? 'Đã đóng cuộc trò chuyện' : 'Đã mở lại cuộc trò chuyện');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể cập nhật trạng thái hội thoại');
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Hộp thư hỗ trợ</h1>
        <p className="mt-1 text-gray-600">
          Theo dõi các cuộc trò chuyện hỗ trợ, đọc tin nhắn mới và phản hồi khách hàng theo thời gian thực.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Tổng hội thoại', value: stats.total, tone: 'bg-blue-50 text-blue-700' },
          { label: 'Đang mở', value: stats.open, tone: 'bg-green-50 text-green-700' },
          { label: 'Đã đóng', value: stats.closed, tone: 'bg-gray-100 text-gray-700' },
          { label: 'Chưa đọc', value: stats.unread, tone: 'bg-amber-50 text-amber-700' },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${card.tone}`}>
              {card.label}
            </div>
            <p className="mt-4 text-3xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:h-[calc(100vh-14rem)] xl:max-h-[720px] xl:grid-cols-[360px,minmax(0,1fr)]">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm xl:flex xl:min-h-0 xl:flex-col">
          <div className="border-b border-gray-200 p-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Tìm theo tên khách hàng hoặc nội dung..."
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-transparent focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mt-3 flex items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-600">
                <FunnelIcon className="h-4 w-4" />
                Lọc trạng thái
              </span>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-transparent focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả</option>
                <option value="open">Đang mở</option>
                <option value="closed">Đã đóng</option>
              </select>
            </div>
          </div>

          <div className="max-h-[420px] overflow-y-auto xl:min-h-0 xl:max-h-none xl:flex-1">
            <SupportConversationList
              conversations={filteredConversations}
              selectedConversationId={selectedConversationId}
              onSelect={setSelectedConversationId}
              loading={loadingConversations}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm xl:flex xl:min-h-0 xl:flex-col">
          <div className="border-b border-gray-200 px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-gray-900">
                  <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-semibold">
                    {selectedConversation?.user?.name || 'Chọn một hội thoại'}
                  </h2>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {selectedConversation?.user?.email || 'Mở một hội thoại ở cột bên trái để xem chi tiết.'}
                </p>
                {selectedConversation?.lastMessageAt ? (
                  <p className="mt-1 text-xs text-gray-400">
                    Hoạt động gần nhất: {new Date(selectedConversation.lastMessageAt).toLocaleString('vi-VN')}
                  </p>
                ) : null}
              </div>

              {selectedConversation ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                    selectedConversation.status === 'closed'
                      ? 'bg-gray-100 text-gray-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {selectedConversation.status === 'closed' ? 'Đã đóng' : 'Đang mở'}
                  </span>

                  <select
                    value={selectedConversation.status}
                    disabled={updatingStatus}
                    onChange={(event) => handleStatusChange(event.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-transparent focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    <option value="open">Mở hội thoại</option>
                    <option value="closed">Đóng hội thoại</option>
                  </select>
                </div>
              ) : null}
            </div>
          </div>

          <SupportMessageList
            messages={messages}
            viewerRole="admin"
            loading={loadingMessages}
            emptyTitle="Chưa có tin nhắn để hiển thị"
            emptyDescription="Khi khách hàng bắt đầu chat, toàn bộ cuộc trò chuyện sẽ hiện trong khu vực này để bạn phản hồi ngay."
          />

          <SupportChatComposer
            value={draft}
            onChange={setDraft}
            onSubmit={handleSendMessage}
            attachments={attachments}
            onFileChange={handleAttachmentChange}
            onRemoveAttachment={handleRemoveAttachment}
            disabled={!selectedConversationId || selectedConversation?.status === 'closed'}
            disabledMessage={!selectedConversationId
              ? 'Hãy chọn một hội thoại ở danh sách bên trái trước khi trả lời khách hàng.'
              : selectedConversation?.status === 'closed'
                ? 'Hội thoại đã đóng. Mở lại hội thoại để tiếp tục trả lời.'
                : ''}
            sending={sending}
            placeholder="Nhập phản hồi cho khách hàng..."
          />
        </div>
      </div>
    </div>
  );
};

export default AdminSupportInbox;
