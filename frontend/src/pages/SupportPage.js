import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const SupportPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin/support', { replace: true });
      return;
    }

    window.dispatchEvent(new Event('open-support-chat'));
    navigate('/', { replace: true });
  }, [navigate, user?.role]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Đang mở khung chat hỗ trợ</h1>
        <p className="mt-2 text-sm text-gray-600">
          Hỗ trợ khách hàng giờ nằm ở góc dưới bên phải để bạn có thể chat ngay trong lúc tiếp tục sử dụng website.
        </p>
      </div>
    </div>
  );
};

export default SupportPage;
