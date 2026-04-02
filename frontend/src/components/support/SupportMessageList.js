import React, { useEffect, useRef, useState } from 'react';
import { ChatBubbleLeftRightIcon, PaperClipIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { formatSupportTime } from './supportUtils';

const SupportMessageList = ({
  messages,
  viewerRole,
  loading,
  emptyTitle,
  emptyDescription,
}) => {
  const containerRef = useRef(null);
  const bottomRef = useRef(null);
  const hasAutoScrolledRef = useRef(false);
  const shouldStickToBottomRef = useRef(true);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    if (messages.length === 0) {
      hasAutoScrolledRef.current = false;
      shouldStickToBottomRef.current = true;
    }
  }, [messages.length]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return undefined;
    }

    const updateStickiness = () => {
      const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      shouldStickToBottomRef.current = distanceFromBottom < 96;
    };

    updateStickiness();
    container.addEventListener('scroll', updateStickiness);

    return () => {
      container.removeEventListener('scroll', updateStickiness);
    };
  }, [messages.length]);

  useEffect(() => {
    if (messages.length === 0) {
      return;
    }

    if (!hasAutoScrolledRef.current || shouldStickToBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: hasAutoScrolledRef.current ? 'smooth' : 'auto' });
      hasAutoScrolledRef.current = true;
    }
  }, [messages]);

  if (loading && messages.length === 0) {
    return (
      <div className="flex min-h-[320px] flex-1 items-center justify-center bg-gray-50 sm:min-h-0">
        <div className="text-center text-gray-500">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
          <p>Đang tải cuộc trò chuyện...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex min-h-[320px] flex-1 items-center justify-center bg-gray-50 px-6 sm:min-h-0">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <ChatBubbleLeftRightIcon className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{emptyTitle}</h3>
          <p className="mt-2 text-sm text-gray-500">{emptyDescription}</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-[320px] flex-1 overflow-y-auto bg-gray-50 px-4 py-5 sm:min-h-0 sm:px-6">
      <div className="space-y-4">
        {messages.map((message) => {
          const isOwnMessage = message.senderRole === viewerRole;

          return (
            <div
              key={message._id}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xl ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                <span className="mb-1 text-xs text-gray-500">
                  {message.senderName} • {formatSupportTime(message.createdAt)}
                </span>

                <div
                  className={`rounded-2xl px-4 py-3 shadow-sm ${
                    isOwnMessage
                      ? 'rounded-br-md bg-blue-600 text-white'
                      : 'rounded-bl-md border border-gray-200 bg-white text-gray-900'
                  }`}
                >
                  {message.text ? (
                    <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.text}</p>
                  ) : null}

                  {message.attachments.length > 0 ? (
                    <div className={`${message.text ? 'mt-3' : ''} space-y-3`}>
                      {message.attachments.map((attachment) => (
                        attachment.isImage ? (
                          <button
                            key={attachment.id}
                            type="button"
                            onClick={() => setPreviewImage(attachment)}
                            className="block overflow-hidden rounded-xl"
                          >
                            <img
                              src={attachment.url}
                              alt={attachment.originalName}
                              className="max-h-72 w-full rounded-xl object-cover"
                            />
                          </button>
                        ) : (
                          <a
                            key={attachment.id}
                            href={attachment.url}
                            target="_blank"
                            rel="noreferrer"
                            className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-sm ${
                              isOwnMessage
                                ? 'border-white/30 bg-white/10 text-white'
                                : 'border-gray-200 bg-gray-50 text-gray-700'
                            }`}
                          >
                            <PaperClipIcon className="h-5 w-5 flex-shrink-0" />
                            <span className="truncate">{attachment.originalName}</span>
                          </a>
                        )
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {previewImage && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-h-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
            <img
              src={previewImage.url}
              alt={previewImage.originalName}
              className="max-h-[85vh] max-w-full rounded-xl bg-white object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportMessageList;
