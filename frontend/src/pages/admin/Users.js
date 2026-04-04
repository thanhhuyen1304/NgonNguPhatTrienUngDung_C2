import React, { useEffect, useState, useCallback } from 'react';
import { useI18n } from '../../i18n';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  EyeIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UserCircleIcon,
  ArchiveBoxIcon,
  TrophyIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  SignalIcon,
  TruckIcon,
  TrashIcon,
  LockClosedIcon,
  LockOpenIcon
} from '@heroicons/react/24/outline';
import UserDetailModal from '../../components/admin/UserDetailModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const { t } = useI18n();

  // Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit: 15,
        ...(search && { search }),
        ...(role && { role }),
      });

      const response = await api.get(`/users?${params}`);
      setUsers(response.data.data.users);
      setTotalPages(response.data.data.pagination.pages);
    } catch (error) {
      toast.error(`${t('common.error')}: Không thể tải danh sách người dùng`);
    } finally {
      setLoading(false);
    }
  }, [page, search, role, t]);

  useEffect(() => {
    fetchUsers();

    const handleUserDataChanged = () => {
      fetchUsers();
    };

    window.addEventListener('userDataChanged', handleUserDataChanged);
    return () => {
      window.removeEventListener('userDataChanged', handleUserDataChanged);
    };
  }, [fetchUsers]);

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await api.put(`/users/${userId}`, { isActive: !currentStatus });
      toast.success(!currentStatus ? 'User activated successfully' : 'User locked successfully');
      fetchUsers();
    } catch (error) {
      toast.error(`${t('common.error')}: Không thể cập nhật trạng thái`);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await api.delete(`/users/${userToDelete._id}`);
      toast.success('User deleted successfully');
      setIsDeleteOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center">
            <UsersIcon className="w-8 h-8 mr-3 text-blue-600" />
            User Management
          </h1>
          <p className="text-gray-500 mt-1 text-sm font-medium flex items-center">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mr-2 animate-pulse" />
            Active Directory • {users.length * totalPages || 0} Registered Entities
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8 relative group">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder={t('adminUsers.searchPlaceholder')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-sm font-bold text-gray-900"
            />
          </div>
          <div className="md:col-span-4">
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setPage(1);
              }}
              className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-sm font-bold text-gray-900 appearance-none bg-white"
            >
              <option value="">{t('adminUsers.allRoles')}</option>
              <option value="user">{t('adminUsers.customer')}</option>
              <option value="admin">{t('adminUsers.admin')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
        {loading && users.length === 0 ? (
          <div className="p-32 flex flex-col items-center justify-center text-gray-400">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4 opacity-50"></div>
            <p className="font-bold tracking-widest text-xs uppercase italic">Syncing user data...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-32 text-center text-gray-400">
            <ArchiveBoxIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="font-bold tracking-widest text-xs uppercase italic">No users in query</p>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 border-b border-gray-50 font-black text-[10px] text-gray-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-5">Profile Entity</th>
                    <th className="px-6 py-5">Contact Details</th>
                    <th className="px-6 py-5">Role</th>
                    <th className="px-6 py-5">Status</th>
                    <th className="px-6 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((user) => {
                    const isAd = user.role === 'admin';
                    const isShipper = user.role === 'shipper';

                    return (
                      <tr key={user._id} className="group hover:bg-blue-50/30 transition-all duration-200">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className={`w-1.5 h-12 rounded-full ${isAd ? 'bg-purple-500' : isShipper ? 'bg-blue-500' : 'bg-gray-200'}`} />
                            <div className="flex items-center gap-3">
                              {user.avatar ? (
                                <img
                                  src={user.avatar}
                                  alt={user.name}
                                  className="w-10 h-10 rounded-2xl object-cover ring-2 ring-gray-100 group-hover:ring-blue-100 transition-all shadow-sm"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-all">
                                  <UserCircleIcon className="w-6 h-6" />
                                </div>
                              )}
                              <div>
                                <p className="font-black text-gray-900 group-hover:text-blue-600 transition-colors tracking-tight text-base">{user.name}</p>
                                <div className="flex items-center mt-0.5 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                  <CalendarDaysIcon className="w-3 h-3 mr-1" />
                                  Tham gia {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <EnvelopeIcon className="w-3 h-3 text-gray-400" />
                              <span className="text-sm font-bold text-gray-700">{user.email}</span>
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg w-fit italic border ${user.isEmailVerified ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                              }`}>
                              {user.isEmailVerified ? 'Đã xác minh' : 'Chưa xác minh'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex items-center px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${isAd ? 'bg-purple-50 text-purple-700 border-purple-100' : isShipper ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-gray-50 text-gray-600 border-gray-100'
                            }`}>
                            {isAd ? <ShieldCheckIcon className="w-3 h-3 mr-1.5" /> : isShipper ? <TruckIcon className="w-3 h-3 mr-1.5" /> : <ShieldExclamationIcon className="w-3 h-3 mr-1.5" />}
                            {isAd ? 'Quản trị viên' : isShipper ? 'Shipper' : 'Khách hàng'}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl w-fit italic flex items-center gap-2 border ${user.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'
                            }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                            {user.isActive ? 'Hoạt động' : 'Đã khóa'}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleViewDetails(user)}
                              className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
                              title={t('common.view')}
                            >
                              <EyeIcon className="w-5 h-5 stroke-[2.5]" />
                            </button>
                            <button
                              onClick={() => toggleUserStatus(user._id, user.isActive)}
                              className={`p-2.5 rounded-2xl border transition-all ${user.isActive
                                  ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50 border-gray-100'
                                  : 'text-amber-600 bg-amber-50 border-amber-100 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100'
                                }`}
                              title={user.isActive ? "Lock Account" : "Unlock Account"}
                            >
                              {user.isActive ? <LockOpenIcon className="w-5 h-5 stroke-[2.5]" /> : <LockClosedIcon className="w-5 h-5 stroke-[2.5]" />}
                            </button>
                            <button
                              onClick={() => { setUserToDelete(user); setIsDeleteOpen(true); }}
                              className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-2xl border border-gray-100 hover:border-red-100 transition-all"
                              title="Delete User"
                            >
                              <TrashIcon className="w-5 h-5 stroke-[2.5]" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Grid */}
            {totalPages > 1 && (
              <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Identity Index <span className="text-gray-900">{page}</span> OF {totalPages}
                </p>
                <div className="flex gap-2">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setPage(i + 1)}
                      className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${page === i + 1
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 scale-110'
                          : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-100'
                        }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>


      <UserDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={selectedUser}
      />

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteUser}
        title="Delete Identity Access"
        message={`Are you absolutely sure you want to permanently delete ${userToDelete?.name}'s account and all associated data from the central directory?`}
        confirmText="Confirm Deletion"
        cancelText="Cancel Action"
        type="danger"
      />
    </div>
  );
};

export default AdminUsers;
