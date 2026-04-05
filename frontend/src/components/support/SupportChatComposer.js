import React from 'react';
import {
  PaperAirplaneIcon,
  PaperClipIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const SupportChatComposer = ({
  value,
  onChange,
  onSubmit,
  attachments,
  onFileChange,
  onRemoveAttachment,
  disabled,
  disabledMessage,
  sending,
  placeholder,
}) => {
  const hasContent = value.trim() || attachments.length > 0;

  return (
    <div className="shrink-0 border-t border-gray-100 bg-white p-4">
      {attachments.length > 0 ? (
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {attachments.map((attachment) => (
            <div key={attachment.id} className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
              {attachment.isImage ? (
                <img
                  src={attachment.previewUrl}
                  alt={attachment.name}
                  className="h-28 w-full object-cover"
                />
              ) : (
                <div className="flex h-28 flex-col items-center justify-center bg-gray-50 px-3 text-center text-xs text-gray-400">
                  <PaperClipIcon className="h-8 w-8 mb-2" />
                  <span className="truncate w-full px-2">{attachment.name}</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => onRemoveAttachment(attachment.id)}
                className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white transition hover:bg-black/75"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {disabled && disabledMessage ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {disabledMessage}
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-4">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={2}
          disabled={disabled || sending}
          placeholder={placeholder}
          className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className={`inline-flex w-fit items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
            disabled || sending
              ? 'cursor-not-allowed bg-gray-100 text-gray-400'
              : 'cursor-pointer bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}>
            <PaperClipIcon className="h-5 w-5" />
            Đính kèm tệp
            <input
              type="file"
              multiple
              disabled={disabled || sending}
              onChange={onFileChange}
              className="hidden"
            />
          </label>

          <button
            type="submit"
            disabled={!hasContent || disabled || sending}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
            {sending ? 'Đang gửi...' : 'Gửi tin nhắn'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SupportChatComposer;
