import React from 'react';
import { 
  XMarkIcon, 
  UserCircleIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  ShieldCheckIcon, 
  ShieldExclamationIcon,
  CalendarDaysIcon,
  TagIcon,
  SignalIcon
} from '@heroicons/react/24/outline';
import { useI18n } from '../../i18n';

const UserDetailModal = ({ isOpen, onClose, user }) => {
  const { t } = useI18n();
  if (!isOpen || !user) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isAd = user.role === 'admin';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-gray-900/60 backdrop-blur-sm transition-opacity duration-300">
      <div 
        className="fixed inset-0" 
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl">
              <UserCircleIcon className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 leading-tight">
              User Intelligence Profile
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
          >
            <XMarkIcon className="w-6 h-6 text-gray-400 group-hover:text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
          <div className="flex flex-col items-center mb-8">
            <div className="relative p-1 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-[32px] mb-4">
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.name}
                  className="w-32 h-32 rounded-[28px] object-cover border-4 border-white shadow-xl"
                />
              ) : (
                <div className="w-32 h-32 rounded-[28px] bg-gray-100 flex items-center justify-center text-gray-300 border-4 border-white shadow-xl">
                  <UserCircleIcon className="w-20 h-20" />
                </div>
              )}
              <div className={`absolute -bottom-2 -right-2 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 border-white shadow-lg ${
                user.isActive ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
              }`}>
                {user.isActive ? 'Active' : 'Locked'}
              </div>
            </div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight italic">{user.name}</h3>
            <span className={`mt-2 px-4 py-1 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${
              isAd ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-gray-50 text-gray-600 border-gray-100'
            }`}>
              {isAd ? 'System Administrator' : 'Standard Customer'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 group">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                   <EnvelopeIcon className="w-3 h-3" /> Email Address
                </p>
                <p className="text-gray-900 font-bold truncate">{user.email}</p>
                <span className={`mt-2 inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest italic border ${
                  user.isEmailVerified ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                }`}>
                  {user.isEmailVerified ? 'Verified Account' : 'Verification Pending'}
                </span>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                   <PhoneIcon className="w-3 h-3" /> Phone Network
                </p>
                <p className="text-gray-900 font-bold">{user.phone || 'N/A'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                   <CalendarDaysIcon className="w-3 h-3" /> Data Retention
                </p>
                <div className="space-y-2 mt-2">
                   <div className="flex items-center justify-between">
                     <span className="text-[10px] font-bold text-gray-400">Created:</span>
                     <span className="text-[10px] font-bold text-gray-700">{formatDate(user.createdAt)}</span>
                   </div>
                   <div className="flex items-center justify-between border-t border-gray-100 pt-2">
                     <span className="text-[10px] font-bold text-gray-400">Updated:</span>
                     <span className="text-[10px] font-bold text-gray-700">{formatDate(user.updatedAt)}</span>
                   </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                   <TagIcon className="w-3 h-3" /> System Identity
                </p>
                <code className="text-[9px] font-mono bg-white px-2 py-1 rounded-lg border border-gray-100 block mt-2 text-gray-500 truncate">
                  {user._id}
                </code>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-white text-gray-900 font-bold rounded-2xl border border-gray-200 hover:bg-gray-100 transition-all shadow-sm active:scale-95 uppercase text-xs tracking-widest"
          >
            Terminate View
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;
