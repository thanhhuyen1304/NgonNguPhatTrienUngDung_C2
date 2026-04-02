import React from 'react';
import {
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { formatSupportTime } from './supportUtils';

const SupportConversationList = ({
  conversations,
  selectedConversationId,
  onSelect,
  loading,
}) => {
  if (loading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center px-6 py-12 text-sm text-gray-500">
        Đang tải danh sách hội thoại...
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          <ChatBubbleLeftRightIcon className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-gray-900">Chưa có cuộc trò chuyện nào</h3>
        <p className="mt-2 text-sm text-gray-500">
          Danh sách hỗ trợ sẽ xuất hiện tại đây khi người dùng bắt đầu chat.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {conversations.map((conversation) => {
        const isActive = conversation._id === selectedConversationId;

        return (
          <button
            key={conversation._id}
            type="button"
            onClick={() => onSelect(conversation._id)}
            className={`flex w-full items-start gap-3 px-4 py-4 text-left transition ${
              isActive ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'
            }`}
          >
            {conversation.user?.avatar ? (
              <img
                src={conversation.user.avatar}
                alt={conversation.user?.name}
                className="h-11 w-11 rounded-full object-cover"
              />
            ) : (
              <UserCircleIcon className="h-11 w-11 text-gray-300" />
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-gray-900">
                    {conversation.user?.name || 'Khách hàng'}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {conversation.user?.email || 'Không có email'}
                  </p>
                </div>

                <span className="shrink-0 text-xs text-gray-400">
                  {formatSupportTime(conversation.lastMessageAt)}
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="truncate text-sm text-gray-600">
                  {conversation.lastMessagePreview || 'Chưa có tin nhắn nào'}
                </p>

                {conversation.adminUnreadCount > 0 ? (
                  <span className="inline-flex h-6 items-center justify-center rounded-full bg-blue-600 px-2 text-xs font-semibold text-white">
                    {conversation.adminUnreadCount}
                  </span>
                ) : null}
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs">
                <span className={`inline-flex rounded-full px-2.5 py-1 font-medium ${
                  conversation.status === 'closed'
                    ? 'bg-gray-100 text-gray-600'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {conversation.status === 'closed' ? 'Đã đóng' : 'Đang mở'}
                </span>

                {conversation.assignedAdmin?.name ? (
                  <span className="truncate text-gray-500">
                    Phụ trách: {conversation.assignedAdmin.name}
                  </span>
                ) : null}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default SupportConversationList;
