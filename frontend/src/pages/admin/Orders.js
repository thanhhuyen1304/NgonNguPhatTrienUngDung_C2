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
  CalendarDaysIcon,
  CurrencyDollarIcon,
  UserIcon,
  TruckIcon,
  ClockIcon,
  CheckIcon,
  XMarkIcon,
  ShoppingBagIcon,
  TrophyIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from '../../components/common/ConfirmDialog';

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
  const [confirmDialog, setConfirmDialog] = useState({ 
    open: false, 
    orderId: null, 
    newStatus: null, 
    statusLabel: '' 
  });

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      
      let statusParam = status;
      if (status === 'active') {
        statusParam = 'shipped';
      }
      
      const params = new URLSearchParams({
        page,
        limit: 15,
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

  const fetchOrderStats = useCallback(async () => {
    try {
      const statsResponse = await api.get('/orders/admin/stats');
      setOrderStats(statsResponse.data.data);
    } catch (error) {
      console.error('Stats error:', error);
    }
  }, []);
  useEffect(() => {
    const handleOrderStatusUpdate = (data) => {
      setOrders(prevOrders => prevOrders.map(order => 
        order._id === data.orderId 
          ? { ...order, status: data.newStatus, shipper: data.order.shipper || order.shipper } 
          : order
      ));
      fetchOrderStats();
    };

    const handleNewOrder = (data) => {
      fetchOrders();
    };

    socketService.on('order_status_updated', handleOrderStatusUpdate);
    socketService.on('new_order', handleNewOrder);

    return () => {
      socketService.off('order_status_updated', handleOrderStatusUpdate);
      socketService.off('new_order', handleNewOrder);
    };
  }, [fetchOrderStats, fetchOrders]);

  const getStatusConfig = (status) => {
    const configs = {
      pending: { 
        color: 'bg-amber-50 text-amber-700 border-amber-200', 
        indicator: 'bg-amber-500',
        icon: ClockIcon,
        label: 'Chờ xác nhận',
        bgGradient: 'from-amber-400 to-orange-500'
      },
      confirmed: { 
        color: 'bg-blue-50 text-blue-700 border-blue-200', 
        indicator: 'bg-blue-500',
        icon: CheckIcon,
        label: 'Đã xác nhận',
        bgGradient: 'from-blue-400 to-blue-600'
      },
      shipped: { 
        color: 'bg-indigo-50 text-indigo-700 border-indigo-200', 
        indicator: 'bg-indigo-500',
        icon: TruckIcon,
        label: 'Đang giao',
        bgGradient: 'from-indigo-400 to-indigo-600'
      },
      delivered: { 
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200', 
        indicator: 'bg-emerald-500',
        icon: CheckCircleIcon,
        label: 'Đã giao',
        bgGradient: 'from-emerald-400 to-emerald-600'
      },
      cancelled: { 
        color: 'bg-red-50 text-red-700 border-red-200', 
        indicator: 'bg-red-500',
        icon: XMarkIcon,
        label: 'Đã hủy',
        bgGradient: 'from-red-400 to-red-600'
      },
    };
    return configs[status] || configs.pending;
  };

  const getPaymentStatusConfig = (paymentStatus) => {
    const configs = {
      pending: { color: 'bg-amber-100 text-amber-700', label: 'Chờ' },
      paid: { color: 'bg-emerald-100 text-emerald-700', label: 'Xong' },
      failed: { color: 'bg-red-100 text-red-700', label: 'Lỗi' },
      refunded: { color: 'bg-gray-100 text-gray-700', label: 'Hoàn' },
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center">
            <ShoppingBagIcon className="w-8 h-8 mr-3 text-indigo-600" />
            Order Management
          </h1>
          <p className="text-gray-500 mt-1 text-sm font-medium flex items-center">
             <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse" />
             Live Monitoring • {orderStats?.statusCounts?.reduce((acc, curr) => acc + curr.count, 0) || 0} Total Orders
          </p>
        </div>
        <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-3.5 rounded-2xl transition-all active:scale-95 border ${showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-gray-100 text-gray-400 hover:text-gray-600 shadow-sm'}`}
            >
              <FunnelIcon className="w-6 h-6 stroke-[2.5]" />
            </button>
            <button
              onClick={fetchOrders}
              className="p-3.5 bg-white border border-gray-100 text-gray-400 hover:text-indigo-600 rounded-2xl shadow-sm transition-all active:scale-95"
            >
              <ArrowPathIcon className={`w-6 h-6 stroke-[2.5] ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
        </div>
      </div>

      {/* Stats Cards */}
      {orderStats?.statusCounts && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {[
            { status: 'pending', label: 'Chờ xác nhận', icon: '⏳' },
            { status: 'confirmed', label: 'Đã xác nhận', icon: '✅' },
            { 
              status: 'active', 
              label: 'Đang giao', 
              icon: '🚚',
              customCount: () => orderStats.statusCounts.find((s) => s._id === 'shipped')?.count || 0
            },
            { status: 'delivered', label: 'Đã hoàn thành', icon: '📦' },
            { status: 'cancelled', label: 'Đã hủy', icon: '❌' },
          ].map((item) => {
            const count = item.customCount ? item.customCount() : (orderStats.statusCounts.find((s) => s._id === item.status)?.count || 0);
            const config = getStatusConfig(item.status === 'active' ? 'processing' : item.status);
            const isActive = status === item.status || (item.status === 'active' && status === 'shipped');
            
            return (
              <div
                key={item.status}
                onClick={() => { setStatus(status === item.status ? '' : item.status); setPage(1); }}
                className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${config.bgGradient} p-6 text-white cursor-pointer transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                  isActive ? 'ring-4 ring-white/50 scale-[1.02] shadow-2xl z-10' : 'opacity-90 hover:opacity-100'
                }`}
              >
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Stats</span>
                  </div>
                  <p className="text-3xl font-black">{count}</p>
                  <p className="text-xs font-bold opacity-80 mt-1 uppercase tracking-wider">{item.label}</p>
                </div>
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              </div>
            );
          })}
        </div>
      )}

      {/* Modern Filter Card */}
      {(showFilters || searchTerm) && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 animate-in slide-in-from-top-4 duration-300">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="relative group lg:col-span-2">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Order ID, phone, or name..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-sm font-bold text-gray-900"
                />
              </div>
              <div>
                <select
                  value={paymentStatus}
                  onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }}
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-sm font-bold text-gray-900 appearance-none bg-white"
                >
                  <option value="">Payment Status</option>
                  <option value="pending">Chờ thanh toán</option>
                  <option value="paid">Đã thanh toán</option>
                  <option value="failed">Thất bại</option>
                  <option value="refunded">Đã hoàn tiền</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={clearFilters}
                  className="flex-1 px-5 py-3.5 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                >
                  Clear
                </button>
              </div>
           </div>
           {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-gray-50">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Start Date</label>
                   <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-sm font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">End Date</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-sm font-bold"
                  />
                </div>
              </div>
           )}
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
        {loading && orders.length === 0 ? (
          <div className="p-32 flex flex-col items-center justify-center text-gray-400">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4 opacity-50"></div>
            <p className="font-bold tracking-widest text-xs uppercase italic">Synchronizing orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-32 text-center text-gray-400">
             <ArchiveBoxIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
             <p className="font-bold tracking-widest text-xs uppercase italic">No matching records found</p>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 border-b border-gray-50 font-black text-[10px] text-gray-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-5">Order Info</th>
                    <th className="px-6 py-5">Customer</th>
                    <th className="px-6 py-5">Financials</th>
                    <th className="px-6 py-5">Fulfillment</th>
                    <th className="px-6 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map((order) => {
                    const statusCfg = getStatusConfig(order.status);
                    const payCfg = getPaymentStatusConfig(order.paymentStatus);
                    const StatusIcon = statusCfg.icon;

                    return (
                      <tr key={order._id} className="group hover:bg-gray-50/50 transition-all duration-200">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                             <div className={`w-2 h-14 rounded-full ${statusCfg.indicator}`} />
                             <div>
                                <p className="font-black text-gray-900 tracking-tight text-lg group-hover:text-indigo-600 transition-colors">#{order.orderNumber}</p>
                                <div className="flex items-center mt-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                   <CalendarDaysIcon className="w-3 h-3 mr-1" />
                                   {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                                </div>
                             </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all">
                                <UserIcon className="w-5 h-5 stroke-[2.5]" />
                             </div>
                             <div className="max-w-[150px]">
                                <p className="font-black text-gray-900 truncate tracking-tight">{order.shippingAddress?.fullName || 'Anonymous'}</p>
                                <p className="text-[10px] text-gray-400 font-bold truncate">{order.shippingAddress?.phone || 'No phone'}</p>
                             </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                           <div className="flex flex-col">
                              <span className="text-sm font-black text-gray-900">{formatVND(order.totalPrice)}</span>
                              <div className="flex items-center mt-1">
                                 <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg italic border ${payCfg.color}`}>
                                    {payCfg.label}
                                 </span>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-5">
                           <div className="flex flex-col gap-2">
                              <span className={`inline-flex items-center px-3 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border w-fit ${statusCfg.color}`}>
                                <StatusIcon className="w-3 h-3 mr-1.5" />
                                {statusCfg.label}
                              </span>
                              {order.shipper && (
                                <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-tight pl-1">
                                   <TruckIcon className="w-3 h-3" />
                                   <span className="truncate max-w-[100px]">{order.shipper.name}</span>
                                </div>
                              )}
                           </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                             <button
                               onClick={() => navigate(`/orders/${order._id}`)}
                               className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
                               title="Details"
                             >
                                <EyeIcon className="w-5 h-5 stroke-[2.5]" />
                             </button>
                             {!['delivered', 'cancelled'].includes(order.status) && (
                               <div className="relative group/select">
                                  <select
                                    value={order.status}
                                    onChange={(e) => {
                                      const newS = e.target.value;
                                      if (newS === order.status) return;
                                      
                                      setConfirmDialog({
                                        open: true,
                                        orderId: order._id,
                                        newStatus: newS,
                                        statusLabel: getStatusConfig(newS).label
                                      });
                                    }}
                                    className="p-2.5 bg-white border border-gray-100 text-gray-400 hover:text-amber-600 rounded-2xl cursor-pointer transition-all appearance-none pr-8 italic text-xs font-black"
                                    style={{
                                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                                      backgroundPosition: 'right 0.5rem center',
                                      backgroundRepeat: 'no-repeat',
                                      backgroundSize: '1em'
                                    }}
                                  >
                                    <option value="pending">Chờ xác nhận</option>
                                    <option value="confirmed">Xác nhận</option>
                                    <option value="shipped">Đang giao</option>
                                    <option value="delivered">Đã giao</option>
                                    <option value="cancelled">Hủy</option>
                                  </select>
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

            {/* Pagination Grid */}
            {totalPages > 1 && (
              <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Page <span className="text-gray-900">{page}</span> OF {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(prev => prev - 1)}
                    className="px-4 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 disabled:opacity-50 transition-all font-black text-xs uppercase tracking-wider text-gray-500"
                  >
                    PREV
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(prev => prev + 1)}
                    className="px-4 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 disabled:opacity-50 transition-all font-black text-xs uppercase tracking-wider text-gray-500"
                  >
                    NEXT
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Strategic Footer Card */}
      <div className="bg-gradient-to-br from-indigo-900 to-emerald-900 rounded-[40px] p-12 text-white shadow-2xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-40 -mt-40 blur-3xl group-hover:bg-white/10 transition-all duration-700" />
         <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
            <div className="p-6 bg-white/10 rounded-[32px] backdrop-blur-xl border border-white/10">
               <TrophyIcon className="w-12 h-12 text-emerald-400" />
            </div>
            <div className="text-center md:text-left">
               <h4 className="text-3xl font-black italic tracking-tighter">Logistics Performance</h4>
               <p className="text-emerald-100/70 text-base mt-2 font-medium max-w-2xl leading-relaxed">
                 Efficient fulfillment increases customer loyalty by <span className="text-white font-black underline decoration-emerald-400">over 65%</span>. Monitor delivery times and inventory turnover to optimize your business operations.
               </p>
            </div>
            <div className="md:ml-auto">
               <button 
                onClick={() => navigate('/admin/dashboard')}
                className="px-10 py-4 bg-white text-gray-900 rounded-[22px] font-black text-xs uppercase tracking-widest hover:bg-emerald-50 transition-all active:scale-95 shadow-xl shadow-black/20"
               >
                 Live Analytics
               </button>
            </div>
         </div>
      </div>
      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
        onConfirm={async () => {
          try {
            await api.put(`/orders/${confirmDialog.orderId}/status`, { status: confirmDialog.newStatus });
            toast.success("Success");
            fetchOrders();
          } catch (err) {
            toast.error(err.response?.data?.message || t('common.error'));
          } finally {
            setConfirmDialog({ ...confirmDialog, open: false });
          }
        }}
        title="Xác nhận cập nhật"
        message={`Bạn có chắc chắn muốn cập nhật trạng thái đơn hàng sang: "${confirmDialog.statusLabel}"?`}
        type={confirmDialog.newStatus === 'cancelled' ? 'danger' : 'info'}
      />
    </div>
  );
};

export default AdminOrders;
