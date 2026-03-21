import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getOrderById } from '../store/slices/orderSlice';
import Loading from '../components/common/Loading';
import toast from 'react-hot-toast';
import socketService from '../services/socketService';
import { formatVND } from '../utils/currency';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { order, loading, error } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(getOrderById(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Setup real-time updates for this specific order
  useEffect(() => {
    if (id) {
      // Join order room for real-time updates
      socketService.joinOrderRoom(id);

      const handleOrderStatusUpdate = (data) => {
        if (data.orderId === id) {
          console.log('📦 Order detail updated:', data);
          // Refresh order details
          dispatch(getOrderById(id));
        }
      };

      // Register socket listener
      socketService.on('order_status_updated', handleOrderStatusUpdate);

      // Cleanup on unmount
      return () => {
        socketService.leaveOrderRoom(id);
        socketService.off('order_status_updated', handleOrderStatusUpdate);
      };
    }
  }, [dispatch, id]);

  if (loading) {
    return <Loading />;
  }

  if (!order) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <p className="text-gray-600">Order not found</p>
      </div>
    );
  }

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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate('/orders')}
          className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Quay lại danh sách đơn hàng
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Header */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-gray-600 text-sm">Mã đơn hàng</p>
                <p className="text-2xl font-bold text-gray-900">{order.orderNumber}</p>
              </div>
              <span className={`px-4 py-2 rounded-full font-semibold text-sm ${getStatusColor(order.status)}`}>
                {statusTranslations[order.status]}
              </span>
            </div>
            <p className="text-gray-600 text-sm">
              Ngày đặt hàng: {new Date(order.createdAt).toLocaleDateString('vi-VN')}
            </p>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h3 className="font-semibold text-gray-900">Các sản phẩm</h3>
            </div>
            <div className="divide-y">
              {order.items.map((item, index) => (
                <div key={index} className="px-6 py-4 flex gap-4">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    <p className="text-gray-600 text-sm mt-1">
                      Số lượng: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {(item.price * item.quantity).toLocaleString('vi-VN')} ₫
                    </p>
                    <p className="text-gray-600 text-sm">
                      {item.price.toLocaleString('vi-VN')} ₫/cái
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Địa chỉ giao hàng</h3>
            <div className="text-gray-700 space-y-1">
              <p className="font-semibold">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.phone}</p>
              <p>
                {order.shippingAddress.street}, {order.shippingAddress.city}
              </p>
              <p>
                {order.shippingAddress.state} {order.shippingAddress.zipCode}
              </p>
              <p>{order.shippingAddress.country}</p>
            </div>
          </div>

          {/* Payment & Shipping Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Thanh toán</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Phương thức:</span>
                  <span className="font-semibold capitalize">
                    {order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng' : order.paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Trạng thái:</span>
                  <span className="font-semibold capitalize">{order.paymentStatus}</span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Vận chuyển</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Phí vận chuyển:</span>
                  <span className="font-semibold">
                    {order.shippingPrice?.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6 sticky top-20">
            <h3 className="font-semibold text-gray-900 mb-4">Tóm tắt đơn hàng</h3>
            <div className="space-y-3 border-b pb-4 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tổng sản phẩm:</span>
                <span className="font-semibold">
                  {order.itemsPrice?.toLocaleString('vi-VN')} ₫
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Thuế:</span>
                <span className="font-semibold">
                  {order.taxPrice?.toLocaleString('vi-VN')} ₫
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Vận chuyển:</span>
                <span className="font-semibold">
                  {order.shippingPrice?.toLocaleString('vi-VN')} ₫
                </span>
              </div>
            </div>
            <div className="flex justify-between mb-4">
              <span className="font-semibold text-gray-900">Tổng tiền:</span>
              <span className="text-2xl font-bold text-blue-600">
                {formatVND(order.totalPrice)}
              </span>
            </div>
            {['pending', 'confirmed'].includes(order.status) && (
              <button
                className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors font-semibold"
              >
                Hủy đơn hàng
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
