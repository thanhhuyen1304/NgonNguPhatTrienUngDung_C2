import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getMyOrders } from '../store/slices/orderSlice';
import { useNavigate } from 'react-router-dom';
import Loading from '../components/common/Loading';
import toast from 'react-hot-toast';
import socketService from '../services/socketService';
import { formatVND } from '../utils/currency';
import { EyeIcon } from '@heroicons/react/24/outline';

const OrdersPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const { orders, pagination, loading, error } = useSelector((state) => state.orders);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    const params = { page, limit: 10 };
    if (statusFilter) {
      params.status = statusFilter;
    }
    dispatch(getMyOrders(params));
  }, [dispatch, page, statusFilter]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Setup real-time updates for user's orders
  useEffect(() => {
    const handleOrderStatusUpdate = (data) => {
      // Only update if this is the user's order
      if (user && data.order.user === user._id) {
        console.log('📦 My order status updated:', data);
        
        // Refresh orders to get updated data
        const params = { page, limit: 10 };
        if (statusFilter) {
          params.status = statusFilter;
        }
        dispatch(getMyOrders(params));
      }
    };

    // Register socket listener
    socketService.on('order_status_updated', handleOrderStatusUpdate);

    // Cleanup listener on unmount
    return () => {
      socketService.off('order_status_updated', handleOrderStatusUpdate);
    };
  }, [dispatch, page, statusFilter, user]);

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const statusTranslations = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    shipped: 'Đang giao',
    delivered: 'Đã giao',
    cancelled: 'Đã hủy',
  };

  if (loading && orders.length === 0) {
    return <Loading />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Đơn hàng của tôi</h1>
        <p className="text-gray-600">Quản lý và theo dõi tất cả đơn hàng của bạn</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={() => { setStatusFilter(''); setPage(1); }}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            statusFilter === ''
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Tất cả
        </button>
        {['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => { setStatusFilter(status); setPage(1); }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {statusTranslations[status]}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600 text-lg mb-4">Bạn chưa có đơn hàng nào</p>
          <button
            onClick={() => navigate('/shop')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tiếp tục mua sắm
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4 mb-2">
                      <div>
                        <p className="text-gray-600 text-sm">Mã đơn</p>
                        <p className="font-semibold text-lg text-gray-900">{order.orderNumber}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full font-semibold text-sm whitespace-nowrap ${getStatusColor(order.status)}`}>
                        {statusTranslations[order.status]}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                      <div>
                        <p className="text-gray-600">Ngày đặt</p>
                        <p className="font-medium text-gray-900">
                          {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Số sản phẩm</p>
                        <p className="font-medium text-gray-900">{order.items.length} sản phẩm</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Tổng tiền</p>
                        <p className="font-medium text-gray-900">
                          {formatVND(order.totalPrice)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Thanh toán</p>
                        <p className="font-medium text-gray-900 capitalize">
                          {order.paymentStatus}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/orders/${order._id}`)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <EyeIcon className="w-4 h-4" />
                    Chi tiết
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              {Array.from({ length: pagination.pages }).map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    page === i + 1
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OrdersPage;
