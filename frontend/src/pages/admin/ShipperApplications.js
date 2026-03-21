import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const statusOptions = [
  { value: 'pending', label: 'Chờ duyệt', color: 'amber', icon: '⏳' },
  { value: 'approved', label: 'Đã duyệt', color: 'green', icon: '✅' },
  { value: 'rejected', label: 'Đã từ chối', color: 'red', icon: '❌' },
  { value: 'all', label: 'Tất cả', color: 'gray', icon: '📋' },
];

function formatDate(date) {
  if (!date) return '-';
  try {
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
}

const AdminShipperApplications = () => {
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: 'default',
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'Xác nhận',
    cancelText: 'Hủy'
  });

  const pendingCount = useMemo(
    () => applications.filter((u) => u?.shipperInfo?.status === 'pending').length,
    [applications]
  );

  const approvedCount = useMemo(
    () => applications.filter((u) => u?.shipperInfo?.status === 'approved').length,
    [applications]
  );

  const rejectedCount = useMemo(
    () => applications.filter((u) => u?.shipperInfo?.status === 'rejected').length,
    [applications]
  );

  const filteredApplications = useMemo(() => {
    if (!searchTerm) return applications;
    return applications.filter(app => 
      app.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.shipperInfo?.vehicleType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.shipperInfo?.licensePlate?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [applications, searchTerm]);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/users/shipper-applications?status=${encodeURIComponent(status)}`);
      setApplications(res.data?.data?.applications || []);
    } catch (e) {
      toast.error('Không tải được danh sách đơn đăng ký shipper');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const approve = async (userId, userName) => {
    setConfirmDialog({
      isOpen: true,
      type: 'success',
      title: '🎉 Phê duyệt đơn đăng ký',
      message: `Bạn có chắc chắn muốn phê duyệt đơn đăng ký của "${userName}" trở thành đối tác giao hàng không?\n\n✅ Sau khi phê duyệt, họ sẽ có thể:\n• Nhận và giao các đơn hàng\n• Truy cập ứng dụng shipper\n• Bắt đầu kiếm thu nhập\n\n⚠️ Hành động này không thể hoàn tác.`,
      confirmText: 'Phê duyệt',
      cancelText: 'Hủy',
      onConfirm: async () => {
        try {
          const response = await api.put(`/users/shipper-applications/${userId}/approve`);
          console.log('Approve response:', response.data);
          
          toast.success(`🎉 Đã phê duyệt thành công! "${userName}" hiện đã trở thành đối tác giao hàng.`);
          
          // Refresh applications list
          await fetchApplications();
          
          // Also refresh the main users list if needed
          window.dispatchEvent(new CustomEvent('userDataChanged'));
          
        } catch (e) {
          console.error('Approve error:', e);
          toast.error(e?.response?.data?.message || 'Phê duyệt đơn thất bại. Vui lòng thử lại.');
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      }
    });
  };

  const reject = async (userId, userName) => {
    setConfirmDialog({
      isOpen: true,
      type: 'danger',
      title: '❌ Từ chối đơn đăng ký',
      message: `Bạn có chắc chắn muốn từ chối đơn đăng ký của "${userName}" không?\n\n⚠️ Sau khi từ chối:\n• Họ sẽ không thể trở thành đối tác giao hàng\n• Đơn đăng ký sẽ được đánh dấu là "Đã từ chối"\n• Họ có thể nộp đơn mới trong tương lai\n\nVui lòng cân nhắc kỹ trước khi quyết định.`,
      confirmText: 'Từ chối',
      cancelText: 'Hủy',
      onConfirm: async () => {
        try {
          const response = await api.put(`/users/shipper-applications/${userId}/reject`);
          console.log('Reject response:', response.data);
          
          toast.success(`✅ Đã từ chối đơn đăng ký của "${userName}".`);
          
          // Refresh applications list
          await fetchApplications();
          
          // Also refresh the main users list if needed
          window.dispatchEvent(new CustomEvent('userDataChanged'));
          
        } catch (e) {
          console.error('Reject error:', e);
          toast.error(e?.response?.data?.message || 'Từ chối đơn thất bại. Vui lòng thử lại.');
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      }
    });
  };

  const getStatusConfig = (statusValue) => {
    return statusOptions.find(opt => opt.value === statusValue) || statusOptions[3];
  };

  const StatCard = ({ title, count, color, icon }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{count}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg bg-${color}-100 flex items-center justify-center text-2xl`}>
          {icon}
        </div>
      </div>
    </div>
  );

  const ApplicationCard = ({ application }) => {
    const info = application.shipperInfo || {};
    const statusValue = info.status || 'pending';
    const statusConfig = getStatusConfig(statusValue);
    const isPending = statusValue === 'pending';

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                {application.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{application.name}</h3>
                <p className="text-sm text-gray-600">{application.email}</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                  {application.role}
                </span>
              </div>
            </div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              statusValue === 'approved' 
                ? 'bg-green-100 text-green-800'
                : statusValue === 'rejected'
                ? 'bg-red-100 text-red-800'
                : 'bg-amber-100 text-amber-800'
            }`}>
              <span className="mr-1">{statusConfig.icon}</span>
              {statusConfig.label}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Info */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Thông tin liên hệ
              </h4>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <span className="text-gray-500 w-20">Điện thoại:</span>
                  <span className="text-gray-900 font-medium">{info.phone || application.phone || 'Chưa có'}</span>
                </div>
              </div>
            </div>

            {/* Shipper Info */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Thông tin shipper
              </h4>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <span className="text-gray-500 w-24">Phương tiện:</span>
                  <span className="text-gray-900 font-medium">{info.vehicleType || '-'}</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-gray-500 w-24">Biển số:</span>
                  <span className="text-gray-900 font-medium">{info.licensePlate || '-'}</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-gray-500 w-24">Kinh nghiệm:</span>
                  <span className="text-gray-900 font-medium">{info.experience ?? 0} năm</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-gray-500 w-24">Giờ làm:</span>
                  <span className="text-gray-900 font-medium">{info.workingHours || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Application Date */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Đăng ký lúc: <span className="font-medium ml-1">{formatDate(info.applicationDate)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        {isPending && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <div className="flex space-x-3">
              <button
                onClick={() => approve(application._id, application.name)}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Duyệt đơn
              </button>
              <button
                onClick={() => reject(application._id, application.name)}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Từ chối
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <svg className="w-8 h-8 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                Duyệt đăng ký Shipper
              </h1>
              <p className="text-gray-600 mt-2">
                Quản lý và duyệt các đơn đăng ký trở thành đối tác giao hàng
              </p>
            </div>
            <button
              onClick={fetchApplications}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {loading ? 'Đang tải...' : 'Làm mới'}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Tổng đơn" count={applications.length} color="blue" icon="📋" />
          <StatCard title="Chờ duyệt" count={pendingCount} color="amber" icon="⏳" />
          <StatCard title="Đã duyệt" count={approvedCount} color="green" icon="✅" />
          <StatCard title="Đã từ chối" count={rejectedCount} color="red" icon="❌" />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Tìm theo tên, email, phương tiện, biển số..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="lg:w-64">
              <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.icon} {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Applications Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-600">Đang tải danh sách đơn đăng ký...</p>
            </div>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không có đơn đăng ký</h3>
            <p className="text-gray-600">
              {searchTerm 
                ? 'Không tìm thấy đơn đăng ký nào phù hợp với từ khóa tìm kiếm.'
                : status === 'pending' 
                ? 'Chưa có đơn đăng ký nào đang chờ duyệt.'
                : 'Không có đơn đăng ký nào với trạng thái này.'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredApplications.map((application) => (
              <ApplicationCard key={application._id} application={application} />
            ))}
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        type={confirmDialog.type}
      />
    </div>
  );
};

export default AdminShipperApplications;