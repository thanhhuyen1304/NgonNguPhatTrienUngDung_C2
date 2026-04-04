import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Loading from '../common/Loading';

/**
 * Chặn admin truy cập các trang dành cho người dùng.
 * Nếu là admin → redirect thẳng về /admin dashboard.
 */
const NonAdminRoute = () => {
  const { user, loading, initialized } = useSelector((state) => state.auth);

  if (loading || !initialized) {
    return <Loading fullScreen />;
  }

  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
};

export default NonAdminRoute;
