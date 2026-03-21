import React, { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useI18n } from '../../i18n';
import socketService from '../../services/socketService';
import { formatVND } from '../../utils/currency';
import { 
  EyeIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronDownIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  UserIcon,
  TruckIcon,
  ClockIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const AdminOrders = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState('');
  const [orderStats, setOrderStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [paymentStatus, setPaymentStatus] = useState('');

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      
      // Convert "active" status to multiple statuses
      let statusParam = status;
      if (status === 'active') {
        statusParam = 'shipped';
      }
      
      const params = new URLSearchParams({
        page,
        limit: 20,
        ...(statusParam && { status: statusParam }),
        ...(searchTerm && { search: searchTerm }),
        ...(paymentStatus && { paymentStatus }),
        ...(dateRange.start && { startDate: dateRange.start }),
        ...(dateRange.end && { endDate: dateRange.end }),
      });

      const [ordersResponse, statsResponse] = await Promise.all([
        api.get(`/orders/admin/all?${params}`),
        api.get('/orders/admin/stats').catch(err => {
          console.error('Stats error:', err);
          return { data: { data: { statusCounts: [] } } };
        })
      ]);

      setOrders(ordersResponse.data.data.orders);
      setTotalPages(ordersResponse.data.data.pagination.pages);
      setOrderStats(statsResponse.data.data);
    } catch (error) {
      toast.error(t('common.error') + ': ' + (error.response?.data?.message || t('common.loading')));
    } finally {
      setLoading(false);
    }
  }, [page, status, searchTerm, paymentStatus, dateRange, t]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Setup real-time updates
  useEffect(() => {
    const handleOrderStatusUpdate = (data) => {
      console.log('📦 Real-time order update received:', data);
      
      // Update the orders list
      setOrders(prevOrders => {
        return prevOrders.map(order => {
          if (order._id === data.orderId) {
            return {
              ...order,
              status: data.newStatus,
              shipper: data.order.shipper || order.shipper
            };
          }
          return order;
        });
      });
      
      // Refresh stats to get updated counts
      fetchOrderStats();
    };

    const handleNewOrder = (data) => {
      console.log('🆕 New order received:', data);
      // Refresh orders list to include new order
      fetchOrders();
    };

    // Register socket listeners
    socketService.on('order_status_updated', handleOrderStatusUpdate);
    socketService.on('new_order', handleNewOrder);

    // Cleanup listeners on unmount
    return () => {
      socketService.off('order_status_updated', handleOrderStatusUpdate);
      socketService.off('new_order', handleNewOrder);
    };
  }, []);

  const fetchOrderStats = useCallback(async () => {
    try {
      const statsResponse = await api.get('/orders/admin/stats');
      setOrderStats(statsResponse.data.data);
    } catch (error) {
      console.error('Stats error:', error);
    }
  }, []);

  const getStatusConfig = (status) => {
    const configs = {
      pending: { 
        color: 'bg-amber-50 text-amber-700 border-amber-200', 
        icon: ClockIcon,
        label: 'Chờ xác nhận',
        bgGradient: 'from-amber-400 to-orange-500'
      },
      confirmed: { 
        color: 'bg-blue-50 text-blue-700 border-blue-200', 
        icon: CheckIcon,
        label: 'Đã xác nhận',
        bgGradient: 'from-blue-400 to-blue-600'
      },
      shipped: { 
        color: 'bg-indigo-50 text-indigo-700 border-indigo-200', 
        icon: TruckIcon,
        label: 'Đang giao',
        bgGradient: 'from-indigo-400 to-indigo-600'
      },
      delivered: { 
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200', 
        icon: CheckCircleIcon,
        label: 'Đã giao',
        bgGradient: 'from-emerald-400 to-emerald-600'
      },
      cancelled: { 
        color: 'bg-red-50 text-red-700 border-red-200', 
        icon: XMarkIcon,
        label: 'Đã hủy',
        bgGradient: 'from-red-400 to-red-600'
      },
    };
    return configs[status] || configs.pending;
  };

  const getPaymentStatusConfig = (paymentStatus) => {
    const configs = {
      pending: { color: 'text-amber-600', icon: ClockIcon, label: 'Chờ thanh toán' },
      paid: { color: 'text-emerald-600', icon: CheckCircleIcon, label: 'Đã thanh toán' },
      failed: { color: 'text-red-600', icon: XCircleIcon, label: 'Thất bại' },
      refunded: { color: 'text-gray-600', icon: ArrowPathIcon, label: 'Đã hoàn tiền' },
    };
    return configs[paymentStatus] || configs.pending;
  };

  const clearFilters = () => {
    setStatus('');
    setSearchTerm('');
    setPaymentStatus('');
    setDateRange({ start: '', end: '' });
    setPage(1);
  };

  const statusTranslations = {
    pending: t('orders.pending'),
    confirmed: t('orders.confirmed'),
    processing: t('orders.processing'),
    shipped: t('orders.shipped'),
    delivered: t('orders.delivered'),
    cancelled: t('orders.cancelled'),
  };

  const paymentStatusTranslations = {
    pending: t('orders.pending'),
    paid: t('common.success'),
    failed: t('common.error'),
    refunded: t('common.refunded'),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Quản lý đơn hàng</h1>
                <p className="mt-2 text-sm text-gray-600">
                  Theo dõi và quản lý tất cả đơn hàng trong hệ thống
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FunnelIcon className="w-4 h-4 mr-2" />
                  Bộ lọc
                </button>
                <button
                  onClick={fetchOrders}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <ArrowPathIcon className="w-4 h-4 mr-2" />
                  Làm mới
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {orderStats?.statusCounts && (
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {[
                { status: 'pending', label: 'Chờ xác nhận', icon: '⏳' },
                { status: 'confirmed', label: 'Đã xác nhận', icon: '✅' },
                { 
                  status: 'active', 
                  label: 'Đang giao', 
                  icon: '🚚',
                  customCount: () => {
                    const shippedCount = orderStats.statusCounts.find((s) => s._id === 'shipped')?.count || 0;
                    return shippedCount;
                  }
                },
                { status: 'delivered', label: 'Đã giao', icon: '📦' },
                { status: 'cancelled', label: 'Đã hủy', icon: '❌' },
              ].map((item) => {
                const count = item.customCount ? item.customCount() : (orderStats.statusCounts.find((s) => s._id === item.status)?.count || 0);
                const config = getStatusConfig(item.status === 'active' ? 'processing' : item.status);
                return (
                  <div
                    key={item.status}
                    onClick={() => { setStatus(status === item.status ? '' : item.status); setPage(1); }}
                    className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${config.bgGradient} p-6 text-white cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-lg ${
                      status === item.status ? 'ring-4 ring-white ring-opacity-50 scale-105' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white/80">{item.label}</p>
                        <p className="text-3xl font-bold">{count}</p>
                      </div>
                      <div className="text-3xl opacity-80">{item.icon}</div>
                    </div>
                    <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity duration-200"></div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex-1 max-w-lg">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo mã đơn hàng, tên khách hàng..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <select
                  value={status}
                  onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="pending">Chờ xác nhận</option>
                  <option value="confirmed">Đã xác nhận</option>
                  <option value="active">Đang giao</option>
                  <option value="delivered">Đã giao</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
                
                <select
                  value={paymentStatus}
                  onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Tất cả thanh toán</option>
                  <option value="pending">Chờ thanh toán</option>
                  <option value="paid">Đã thanh toán</option>
                  <option value="failed">Thất bại</option>
                  <option value="refunded">Đã hoàn tiền</option>
                </select>

                {(status || searchTerm || paymentStatus || dateRange.start || dateRange.end) && (
                  <button
                    onClick={clearFilters}
                    className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Xóa bộ lọc
                  </button>
                )}
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Từ ngày</label>
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Đến ngày</label>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-24 h-24 mx-auto mb-4 text-gray-300">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Không có đơn hàng</h3>
              <p className="text-gray-600">Không tìm thấy đơn hàng nào phù hợp với bộ lọc hiện tại.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Đơn hàng
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Khách hàng
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tổng tiền
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Shipper
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thanh toán
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngày tạo
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => {
                      const statusConfig = getStatusConfig(order.status);
                      const paymentConfig = getPaymentStatusConfig(order.paymentStatus);
                      const StatusIcon = statusConfig.icon;
                      const PaymentIcon = paymentConfig.icon;
                      
                      return (
                        <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-3 whitespace-nowrap">
                            <div>
                              <div className="text-xs font-medium text-gray-900">{order.orderNumber}</div>
                              <div className="text-xs text-gray-500">
                                {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8">
                                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                  <UserIcon className="h-4 w-4 text-gray-500" />
                                </div>
                              </div>
                              <div className="ml-3">
                                <div className="text-xs font-medium text-gray-900">
                                  {order.shippingAddress?.fullName || order.user?.name || 'N/A'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {order.shippingAddress?.phone || order.user?.email || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <CurrencyDollarIcon className="h-3 w-3 text-green-500 mr-1" />
                              <span className="text-xs font-semibold text-gray-900">
                                {formatVND(order.totalPrice)}
                              </span>
                            </div>
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig.label}
                            </span>
                            {['shipped', 'delivered'].includes(order.status) && (
                              <div className="mt-1">
                                <span className="text-xs text-gray-500">👤 Shipper</span>
                              </div>
                            )}
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap">
                            {(['shipped', 'delivered'].includes(order.status)) ? (
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-6 w-6">
                                  <div className="h-6 w-6 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center">
                                    <TruckIcon className="h-3 w-3 text-white" />
                                  </div>
                                </div>
                                <div className="ml-2">
                                  <div className="text-xs font-medium text-gray-900">
                                    {order.shipper?.name || 'Nguyễn Văn Shipper'}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {order.shipper?.phone || '0123456789'}
                                  </div>
                                </div>
                              </div>
                            ) : order.shipper && order.status !== 'pending' && order.status !== 'processing' ? (
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-6 w-6">
                                  <div className="h-6 w-6 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center">
                                    <TruckIcon className="h-3 w-3 text-white" />
                                  </div>
                                </div>
                                <div className="ml-2">
                                  <div className="text-xs font-medium text-gray-900">{order.shipper?.name || 'N/A'}</div>
                                  <div className="text-xs text-gray-500">{order.shipper?.phone || 'N/A'}</div>
                                </div>
                              </div>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                <ClockIcon className="w-3 h-3 mr-1" />
                                {order.status === 'confirmed' ? 'Chờ lấy' : 'Chưa có'}
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap">
                            <div className="flex items-center">
                              <PaymentIcon className={`w-3 h-3 mr-1 ${paymentConfig.color}`} />
                              <span className={`text-xs font-medium ${paymentConfig.color}`}>
                                {paymentConfig.label}
                              </span>
                            </div>
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-500">
                            <div className="flex items-center">
                              <CalendarDaysIcon className="w-3 h-3 mr-1" />
                              {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                            </div>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <div className="flex flex-col space-y-2">
                              {/* View Details Button */}
                              <button
                                onClick={() => navigate(`/orders/${order._id}`)}
                                className="inline-flex items-center justify-center px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-xs font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
                                title="Xem chi tiết đơn hàng"
                              >
                                <EyeIcon className="w-3.5 h-3.5 mr-1.5" />
                                Chi tiết
                              </button>
                              
                              {/* Status Update Dropdown */}
                              {!['delivered', 'cancelled'].includes(order.status) && !['shipped', 'delivered'].includes(order.status) && (
                                <div className="relative">
                                  <select
                                    value={order.status}
                                    onChange={(e) => {
                                      const newStatus = e.target.value;
                                      if (newStatus !== order.status) {
                                        // Check if admin can update this status
                                        const adminCannotUpdate = ['shipped', 'delivered'];
                                        if (adminCannotUpdate.includes(newStatus)) {
                                          toast.error(`Admin không thể cập nhật trạng thái "${getStatusConfig(newStatus).label}". Chỉ shipper mới có thể cập nhật trạng thái giao hàng.`);
                                          return;
                                        }

                                        // Prevent backward transitions
                                        const statusOrder = {
                                          'pending': 0,
                                          'confirmed': 1,
                                          'shipped': 2,
                                          'delivered': 3,
                                          'cancelled': 4
                                        };

                                        const currentOrder = statusOrder[order.status] || 0;
                                        const newOrder = statusOrder[newStatus] || 0;

                                        if (newOrder < currentOrder && newStatus !== 'cancelled') {
                                          toast.error(`Không thể cập nhật trạng thái lui về từ "${getStatusConfig(order.status).label}" sang "${getStatusConfig(newStatus).label}"`);
                                          return;
                                        }

                                        if (window.confirm(`Cập nhật trạng thái đơn hàng thành "${getStatusConfig(newStatus).label}"?`)) {
                                          api.put(`/orders/${order._id}/status`, { 
                                            status: newStatus,
                                            note: `Updated by admin to ${getStatusConfig(newStatus).label}`
                                          }).then(() => {
                                            toast.success('Cập nhật thành công!');
                                            fetchOrders();
                                          }).catch(err => {
                                            toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
                                          });
                                        }
                                      }
                                    }}
                                    className={`w-full text-xs rounded-full font-medium py-1.5 px-3 border cursor-pointer transition-all duration-200 appearance-none ${getStatusConfig(order.status).color}`}
                                    style={{
                                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                                      backgroundPosition: 'right 0.5rem center',
                                      backgroundRepeat: 'no-repeat',
                                      backgroundSize: '1.2em 1.2em',
                                      paddingRight: '2.2rem'
                                    }}
                                  >
                                    {(() => {
                                      const adminAllowedStatuses = ['pending', 'confirmed', 'cancelled'];
                                      const validTransitions = {
                                        'pending': [
                                          { value: 'pending', label: 'Chờ xác nhận' },
                                          { value: 'confirmed', label: 'Đã xác nhận' },
                                          { value: 'cancelled', label: 'Đã hủy' }
                                        ],
                                        'confirmed': [
                                          { value: 'confirmed', label: 'Đã xác nhận' },
                                          { value: 'cancelled', label: 'Đã hủy' }
                                        ]
                                      };

                                      const options = validTransitions[order.status] || [
                                        { value: order.status, label: getStatusConfig(order.status).label }
                                      ];

                                      const filteredOptions = options.filter(option => 
                                        adminAllowedStatuses.includes(option.value) || option.value === order.status
                                      );

                                      return filteredOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                          {option.label}
                                        </option>
                                      ));
                                    })()}
                                  </select>
                                </div>
                              )}
                              
                              {/* Completed Status Badge */}
                              {['delivered', 'cancelled'].includes(order.status) && (
                                <div className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200">
                                  <CheckCircleIcon className="w-3.5 h-3.5 mr-1.5" />
                                  {order.status === 'delivered' ? 'Hoàn thành' : 'Đã hủy'}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Trước
                      </button>
                      <button
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Sau
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Hiển thị trang <span className="font-medium">{page}</span> / <span className="font-medium">{totalPages}</span>
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                          {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                            const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setPage(pageNum)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  page === pageNum
                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                } ${i === 0 ? 'rounded-l-md' : ''} ${i === Math.min(5, totalPages) - 1 ? 'rounded-r-md' : ''}`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </nav>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;
