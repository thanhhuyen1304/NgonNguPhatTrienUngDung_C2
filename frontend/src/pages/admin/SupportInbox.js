import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ChatBubbleLeftRightIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArchiveBoxIcon,
  ClockIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  UserCircleIcon,
  SignalIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import SupportConversationList from '../../components/support/SupportConversationList';
import SupportMessageList from '../../components/support/SupportMessageList';
import SupportChatComposer from '../../components/support/SupportChatComposer';
import {
  createAttachmentPreview,
  mergeMessages,
  revokeAttachmentPreview,
} from '../../components/support/supportUtils';
import {
  deleteAdminSupportConversation,
  getAdminSupportConversations,
  getAdminSupportMessages,
  markAdminSupportConversationRead,
  sendAdminSupportMessage,
  updateAdminSupportConversationStatus,
} from '../../services/supportService';
import socketService from '../../services/socketService';

const AdminSupportInbox = () => {
  const { id: urlId } = useParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(urlId || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [draft, setDraft] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const attachmentsRef = useRef([]);
  const messageRequestRef = useRef(0);

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

  const extractConversationIdFromLink = useCallback((link = '') => {
    const match = link.match(/\/admin\/support\/([^/?#]+)/);
    return match?.[1] || '';
  }, []);

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
      await markAdminSupportConversationRead(conversationId);
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

    const requestId = ++messageRequestRef.current;

    if (!options.silent) {
      setLoadingMessages(true);
    }

    try {
      const nextMessages = await getAdminSupportMessages(conversationId);

      if (requestId !== messageRequestRef.current) {
        return nextMessages;
      }

      setMessages(nextMessages);

      if (options.markAsRead) {
        await markConversationAsRead(conversationId);
      }

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
      const nextConversations = await getAdminSupportConversations();
      const hasSelectedConversation = nextConversations.some(
        (conversation) => conversation._id === (urlId || selectedConversationId)
      );

      setConversations(nextConversations);

      if (nextConversations.length > 0 && !urlId && !selectedConversationId) {
        setSelectedConversationId(nextConversations[0]._id);
      } else if (nextConversations.length > 0 && !hasSelectedConversation && !options.silent) {
        setSelectedConversationId(nextConversations[0]._id);
        navigate(`/admin/support/${nextConversations[0]._id}`, { replace: true });
      }

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
  }, [navigate, selectedConversationId, urlId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (urlId) {
      setSelectedConversationId(urlId);
    }
  }, [urlId]);

  const handleSelectConversation = (id) => {
    setSelectedConversationId(id);
    navigate(`/admin/support/${id}`);
  };

  useEffect(() => {
    if (selectedConversationId) {
      fetchMessages(selectedConversationId, { markAsRead: true });
      return;
    }

    setMessages([]);
  }, [selectedConversationId, fetchMessages]);

  useEffect(() => {
    const handleSupportNotification = async (notification) => {
      if (notification?.type !== 'support') {
        return;
      }

      const notifiedConversationId = extractConversationIdFromLink(notification.link || '');
      const nextConversations = await fetchConversations({ silent: true });

      if (!selectedConversationId && notifiedConversationId) {
        setSelectedConversationId(notifiedConversationId);
        navigate(`/admin/support/${notifiedConversationId}`, { replace: true });
        return;
      }

      if (notifiedConversationId && notifiedConversationId === selectedConversationId) {
        await fetchMessages(notifiedConversationId, { silent: true, markAsRead: false });
        return;
      }

      if (!selectedConversationId && nextConversations[0]?._id) {
        setSelectedConversationId(nextConversations[0]._id);
      }
    };

    socketService.on('new_notification', handleSupportNotification);

    return () => {
      socketService.off('new_notification', handleSupportNotification);
    };
  }, [extractConversationIdFromLink, fetchConversations, fetchMessages, navigate, selectedConversationId]);

  const handleAttachmentChange = (event) => {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) {
      return;
    }

    const remainingSlots = Math.max(0, 3 - attachments.length);

    if (remainingSlots === 0) {
      toast.error('Mỗi tin nhắn chỉ đính kèm tối đa 3 tệp');
      event.target.value = '';
      return;
    }

    if (files.length > remainingSlots) {
      toast.error('Mỗi tin nhắn chỉ đính kèm tối đa 3 tệp');
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
      const returnedMessage = await sendAdminSupportMessage({
        conversationId: selectedConversationId,
        text: trimmedDraft,
        attachments,
      });

      if (returnedMessage) {
        setMessages((previousMessages) => mergeMessages(previousMessages, [returnedMessage]));
      } else {
        await fetchMessages(selectedConversationId, { silent: true, markAsRead: false });
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
      await updateAdminSupportConversationStatus({ conversationId: selectedConversationId, status: nextStatus });

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

  const handleDeleteConversation = async () => {
    if (!selectedConversationId || deleting) {
      return;
    }

    const confirmMessage = `⚠️ Xóa vĩnh viễn đoạn chat?\n\nBạn có chắc muốn xóa cuộc trò chuyện với ${selectedConversation?.user?.name || 'khách hàng này'} không?\n\n• Tất cả tin nhắn và hình ảnh sẽ bị xóa vĩnh viễn\n• Không thể khôi phục dữ liệu sau khi xóa`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setDeleting(true);
      await deleteAdminSupportConversation(selectedConversationId);
      
      const deletedId = selectedConversationId;
      setConversations((prev) => prev.filter((c) => c._id !== deletedId));
      
      // Auto-select next or empty
      const remaining = conversations.filter((c) => c._id !== deletedId);
      if (remaining.length > 0) {
        handleSelectConversation(remaining[0]._id);
      } else {
        setSelectedConversationId('');
        navigate('/admin/support');
      }

      toast.success('Đã xóa cuộc trò chuyện');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xóa cuộc trò chuyện');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-6 animate-in fade-in duration-500">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center">
            <ChatBubbleLeftRightIcon className="w-8 h-8 mr-3 text-red-500" />
            Resolution Center
          </h1>
          <p className="text-gray-500 mt-1 text-sm font-medium flex items-center">
             <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mr-2 animate-pulse" />
             Live Support • {stats.unread} Unresolved Requests
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Inflow', value: stats.total, tone: 'from-blue-500 to-indigo-600', icon: <ArchiveBoxIcon className="w-5 h-5" /> },
          { label: 'Active Tickets', value: stats.open, tone: 'from-emerald-500 to-teal-600', icon: <SignalIcon className="w-5 h-5" /> },
          { label: 'Resolved', value: stats.closed, tone: 'from-gray-600 to-gray-800', icon: <CheckCircleIcon className="w-5 h-5" /> },
          { label: 'Attention Req.', value: stats.unread, tone: 'from-red-500 to-rose-600', icon: <ClockIcon className="w-5 h-5" /> },
        ].map((card) => (
          <div key={card.label} className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${card.tone} p-6 text-white shadow-lg`}>
            <div className="relative z-10">
               <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                    {card.icon}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-70 italic">Stats</span>
               </div>
               <p className="text-3xl font-black italic">{card.value}</p>
               <p className="text-xs font-bold opacity-80 mt-1 uppercase tracking-widest">{card.label}</p>
            </div>
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px,minmax(0,1fr)] lg:h-[calc(100vh-260px)] min-h-[600px]">
        {/* Sidebar: Conversation List */}
        <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
          <div className="p-6 border-b border-gray-50 space-y-4">
            <div className="relative group">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search clients or context..."
                className="w-full rounded-2xl border border-gray-100 bg-gray-50 py-3.5 pl-12 pr-4 text-xs font-bold outline-none transition focus:ring-4 focus:ring-red-500/10 focus:border-red-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="flex-1 rounded-2xl border border-gray-100 bg-white px-4 py-3 text-xs font-black uppercase tracking-widest outline-none transition focus:ring-4 focus:ring-red-500/10 focus:border-red-500 appearance-none italic"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.75rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1em'
                }}
              >
                <option value="all">All States</option>
                <option value="open">Active Only</option>
                <option value="closed">Resolved Only</option>
              </select>
              <div className="p-3 bg-gray-50 rounded-2xl text-gray-400 border border-gray-100">
                <FunnelIcon className="w-5 h-5 stroke-[2.5]" />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            <SupportConversationList
              conversations={filteredConversations}
              selectedConversationId={selectedConversationId}
              onSelect={handleSelectConversation}
              loading={loadingConversations}
            />
          </div>
        </div>

        {/* Main: Message View */}
        <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full min-h-0 relative">
          {/* Chat Header */}
          <div className="p-6 border-b border-gray-50 bg-gray-50/30">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner">
                   <UserCircleIcon className="w-8 h-8 stroke-[1.5]" />
                </div>
                <div>
                   <h2 className="text-xl font-black text-gray-900 tracking-tight italic">
                    {selectedConversation?.user?.name || 'Awaiting Selection'}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                     <EnvelopeIcon className="w-3 h-3 text-gray-400" />
                     <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate max-w-[200px]">
                      {selectedConversation?.user?.email || 'Select a channel to begin broadcast'}
                    </p>
                  </div>
                </div>
              </div>

              {selectedConversation && (
                <div className="flex items-center gap-3">
                  <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest italic border ${
                    selectedConversation.status === 'closed'
                      ? 'bg-gray-100 text-gray-500 border-gray-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  }`}>
                    {selectedConversation.status === 'closed' ? 'Archived' : 'Live Channel'}
                  </span>

                  <select
                    value={selectedConversation.status}
                    disabled={updatingStatus}
                    onChange={(event) => handleStatusChange(event.target.value)}
                    className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none transition focus:ring-4 focus:ring-red-500/10 focus:border-red-500 disabled:opacity-50 appearance-none pr-8 cursor-pointer shadow-sm italic"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1em'
                    }}
                  >
                    <option value="open">Keep Active</option>
                    <option value="closed">Resolve Issue</option>
                  </select>

                  <button
                    onClick={handleDeleteConversation}
                    disabled={deleting}
                    className="p-2.5 rounded-xl bg-red-50 text-red-500 border border-red-100 hover:bg-red-100 transition-colors disabled:opacity-50 shadow-sm"
                    title="Delete Conversation"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex flex-1 min-h-0 overflow-hidden bg-white relative">
             <SupportMessageList
              messages={messages}
              viewerRole="admin"
              loading={loadingMessages}
              emptyTitle="Transmission Area Empty"
              emptyDescription="Awaiting incoming broadcast from client. All interactions will be logged and archived for quality assurance."
            />
          </div>

          <SupportChatComposer
            value={draft}
            onChange={setDraft}
            onSubmit={handleSendMessage}
            attachments={attachments}
            onFileChange={handleAttachmentChange}
            onRemoveAttachment={handleRemoveAttachment}
            disabled={!selectedConversationId || selectedConversation?.status === 'closed'}
            disabledMessage={!selectedConversationId
              ? 'System locked. Establish channel connection first.'
              : selectedConversation?.status === 'closed'
                ? 'Channel archived. Reactive ticket to resume broadcast.'
                : ''}
            sending={sending}
            placeholder="Type professional response..."
          />
        </div>
      </div>

    </div>
  );
};

export default AdminSupportInbox;
