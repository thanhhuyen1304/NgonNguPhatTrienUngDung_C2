import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

const RoleChangeNotification = () => {
  const [notification, setNotification] = useState(null);
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    const handleRoleChange = () => {
      if (user?.role === 'shipper') {
        setNotification({
          type: 'success',
          title: '🎉 Chúc mừng!',
          message: 'Bạn đã được phê duyệt trở thành đối tác giao hàng. Hãy truy cập trang Shipper để bắt đầu nhận đơn hàng!',
          action: () => navigate('/shipper'),
          actionText: 'Đi đến Shipper Dashboard'
        });
      }
    };

    // Listen for role updates
    window.addEventListener('userDataChanged', handleRoleChange);
    
    return () => {
      window.removeEventListener('userDataChanged', handleRoleChange);
    };
  }, [user, navigate]);

  if (!notification) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <CheckCircleIcon className="h-6 w-6 text-green-500" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-gray-900">
              {notification.title}
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              {notification.message}
            </p>
            {notification.action && (
              <div className="mt-3">
                <button
                  onClick={notification.action}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  {notification.actionText}
                </button>
              </div>
            )}
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={() => setNotification(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleChangeNotification;