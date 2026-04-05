import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  ChatBubbleLeftRightIcon,
  MinusIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import SupportMessageList from './SupportMessageList';
import {
  createAttachmentPreview,
  mergeMessages,
  revokeAttachmentPreview,
} from './supportUtils';
import {
  getMySupportConversation,
  getSupportConversationMessages,
  markSupportConversationRead,
  sendSupportMessage,
} from '../../services/supportService';

const SupportWidget = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const attachmentsRef = useRef([]);

  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  useEffect(() => {
    return () => {
      attachmentsRef.current.forEach(revokeAttachmentPreview);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'user') {
      setOpen(false);
      setConversation(null);
      setMessages([]);
      setDraft('');
      attachmentsRef.current.forEach(revokeAttachmentPreview);
      setAttachments([]);
    }
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    const openChat = () => setOpen(true);
    window.addEventListener('open-support-chat', openChat);

    return () => {
      window.removeEventListener('open-support-chat', openChat);
    };
  }, []);

  useEffect(() => {
    if (!open || !isAuthenticated || user?.role !== 'user') {
      return undefined;
    }

    let stopped = false;

    const loadData = async () => {
      setLoading(true);

      try {
        const nextConversation = await getMySupportConversation();

        if (stopped) {
          return;
        }

        setConversation(nextConversation);

        if (!nextConversation?._id) {
          setMessages([]);
          return;
        }

        const nextMessages = await getSupportConversationMessages(nextConversation._id);

        if (stopped) {
          return;
        }

        setMessages(nextMessages);
        await markSupportConversationRead(nextConversation._id);
      } catch (error) {
        if (!stopped) {
          toast.error(error.response?.data?.message || 'Không thể tải hỗ trợ');
        }
      } finally {
        if (!stopped) {
          setLoading(false);
        }
      }
    };

    loadData();

    const intervalId = setInterval(loadData, 5000);

    return () => {
      stopped = true;
      clearInterval(intervalId);
    };
  }, [open, isAuthenticated, user?.role]);

  if (!isAuthenticated || user?.role !== 'user') {
    return null;
  }

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
    setAttachments((current) => [...current, ...nextAttachments]);
    event.target.value = '';
  };

  const handleRemoveAttachment = (attachmentId) => {
    setAttachments((current) => {
      const target = current.find((item) => item.id === attachmentId);

      if (target) {
        revokeAttachmentPreview(target);
      }

      return current.filter((item) => item.id !== attachmentId);
    });
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();

    const text = draft.trim();

    if ((!text && attachments.length === 0) || !conversation?._id || sending) {
      return;
    }

    try {
      setSending(true);
      const message = await sendSupportMessage({
        conversationId: conversation._id,
        text,
        attachments,
      });

      if (message) {
        setMessages((current) => mergeMessages(current, [message]));
      }

      attachments.forEach(revokeAttachmentPreview);
      setAttachments([]);
      setDraft('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể gửi tin nhắn hỗ trợ');
    } finally {
      setSending(false);
    }
  };

  const disabled = sending || conversation?.status === 'closed' || !conversation?._id;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex max-h-[calc(100vh-1rem)] flex-col items-end gap-3 sm:bottom-6 sm:right-6 sm:max-h-[calc(100vh-3rem)]">
      {open && (
        <div className="flex w-[calc(100vw-2rem)] max-w-md min-h-0 max-h-[calc(100vh-5rem)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl sm:max-h-[min(42rem,calc(100vh-6.5rem))]">
          <div className="flex items-center justify-between bg-blue-600 px-4 py-3 text-white">
            <div className="min-w-0">
              <h3 className="font-semibold">Hỗ trợ khách hàng</h3>
              <p className="text-xs text-blue-100">Gửi câu hỏi và hình ảnh nếu bạn cần hỗ trợ.</p>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1 hover:bg-white/10"
            >
              <MinusIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <SupportMessageList
              messages={messages}
              viewerRole="user"
              loading={loading}
              emptyTitle="Chưa có tin nhắn nào"
              emptyDescription="Nhập nội dung bên dưới để bắt đầu chat với admin hỗ trợ."
            />

            <div className="border-t border-gray-200 bg-white p-4">
              {attachments.length > 0 && (
                <div className="mb-4 grid grid-cols-3 gap-2">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center h-20">
                      {attachment.isImage ? (
                        <img src={attachment.previewUrl} alt={attachment.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center justify-center p-2 text-gray-400">
                          <PaperClipIcon className="h-6 w-6" />
                          <span className="mt-1 text-[8px] font-medium truncate w-full text-center px-1">
                            {attachment.file.name}
                          </span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(attachment.id)}
                        className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80 transition-colors"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleSendMessage}>
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  rows={2}
                  disabled={disabled}
                  placeholder={conversation?.status === 'closed' ? 'Cuộc trò chuyện đã đóng' : 'Nhập nội dung cần hỗ trợ...'}
                  className="w-full resize-none rounded-xl border border-gray-300 px-3 py-3 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />

                <div className="mt-3 flex items-center justify-between gap-3">
                  <label className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${disabled ? 'bg-gray-100 text-gray-400' : 'cursor-pointer bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                    <PaperClipIcon className="h-5 w-5" />
                    Tệp
                    <input
                      type="file"
                      multiple
                      disabled={disabled}
                      onChange={handleAttachmentChange}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={disabled || (!draft.trim() && attachments.length === 0)}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300"
                  >
                    <PaperAirplaneIcon className="h-4 w-4" />
                    {sending ? 'Đang gửi...' : 'Gửi'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700"
        aria-label="Mở hỗ trợ khách hàng"
      >
        <ChatBubbleLeftRightIcon className="h-7 w-7" />
      </button>
    </div>
  );
};

export default SupportWidget;
