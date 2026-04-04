import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { resetCart } from '../store/slices/cartSlice';
import api from '../services/api';

const PaymentResultPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'failed' | 'pending'
  const [order, setOrder] = useState(null);
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(5);
  const hasCalled = useRef(false);

  useEffect(() => {
    // Đề phòng React Strict Mode gọi 2 lần
    if (hasCalled.current) return;
    hasCalled.current = true;

    const resultCode   = searchParams.get('resultCode');
    const momoOrderId  = searchParams.get('orderId');   // MoMo orderId (không phải MongoDB _id)
    const momoMessage  = searchParams.get('message');

    if (!momoOrderId) {
      setStatus('failed');
      setMessage('Không tìm thấy thông tin đơn hàng.');
      return;
    }

    // Nếu MoMo báo thất bại ngay từ query params
    if (resultCode && resultCode !== '0') {
      // Vẫn gọi verify để backend đánh dấu failed
      verifyPayment(momoOrderId, momoMessage || 'Thanh toán không thành công');
      return;
    }

    verifyPayment(momoOrderId, momoMessage);
  }, []); // eslint-disable-line

  const verifyPayment = async (momoOrderId, momoMsg) => {
    try {
      const response = await api.get(
        `/payment/momo/verify?momoOrderId=${encodeURIComponent(momoOrderId)}`
      );
      const data = response.data;

      const payStatus = data.data?.paymentStatus;
      setOrder(data.data?.order);

      if (payStatus === 'paid') {
        // Xóa giỏ hàng Redux (DB đã được xóa bởi backend)
        dispatch(resetCart());
        setStatus('success');
        setMessage('Thanh toán thành công! Cảm ơn bạn đã đặt hàng.');
      } else {
        setStatus('failed');
        setMessage(momoMsg || data.data?.momoMessage || 'Thanh toán thất bại hoặc bị hủy.');
      }
    } catch (err) {
      console.error('Verify error:', err);
      setStatus('failed');
      setMessage(err.message || 'Có lỗi xảy ra khi xác nhận thanh toán.');
    }
  };

  // Đếm ngược redirect khi thành công
  useEffect(() => {
    if (status !== 'success') return;
    if (countdown <= 0) {
      navigate(order ? `/orders/${order._id}` : '/orders');
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [status, countdown, navigate, order]);

  /* ── Render ── */

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mb-4" />
        <p className="text-gray-600 text-lg">Đang xác nhận thanh toán MoMo...</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          {/* Icon thành công */}
          <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* MoMo logo text */}
          <div className="inline-flex items-center gap-2 bg-pink-50 text-pink-600 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            <span>💜</span> MoMo
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán thành công!</h1>
          <p className="text-gray-500 mb-6">{message}</p>

          {order && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Mã đơn hàng</span>
                <span className="font-semibold text-gray-800">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tổng tiền</span>
                <span className="font-semibold text-blue-600">
                  {order.totalPrice?.toLocaleString('vi-VN')}₫
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Trạng thái thanh toán</span>
                <span className="font-semibold text-green-600">Đã thanh toán ✓</span>
              </div>
            </div>
          )}

          <p className="text-sm text-gray-400 mb-5">
             Tự động chuyển sang chi tiết đơn hàng sau <span className="font-bold text-gray-600">{countdown} giây</span>
          </p>

          <div className="flex gap-3">
            <Link
              to={order ? `/orders/${order._id}` : '/orders'}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              Xem đơn hàng
            </Link>
            <Link
              to="/"
              className="flex-1 border border-gray-200 hover:border-gray-300 text-gray-700 py-3 rounded-lg font-semibold transition-colors"
            >
              Trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // status === 'failed'
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        {/* Icon thất bại */}
        <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <div className="inline-flex items-center gap-2 bg-pink-50 text-pink-600 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
          <span>💜</span> MoMo
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Thanh toán thất bại</h1>
        <p className="text-gray-500 mb-6">{message}</p>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-sm text-yellow-700 text-left">
          <p className="font-semibold mb-1">⚠️ Lưu ý:</p>
          <p>Đơn hàng của bạn đã được tạo nhưng <strong>chưa được thanh toán</strong>. Bạn có thể liên hệ admin để xử lý hoặc hủy đơn hàng.</p>
        </div>

        <div className="flex gap-3">
          <Link
            to="/orders"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors"
          >
            Xem đơn hàng
          </Link>
          <Link
            to="/"
            className="flex-1 border border-gray-200 hover:border-gray-300 text-gray-700 py-3 rounded-lg font-semibold transition-colors"
          >
            Trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentResultPage;
