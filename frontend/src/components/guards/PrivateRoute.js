import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Loading from '../common/Loading';
import { isAdminUser } from '../../utils/roleRedirect';

const PrivateRoute = () => {
  const { isAuthenticated, loading, initialized, user } = useSelector((state) => state.auth);
  const location = useLocation();

  if (loading || !initialized) {
    return <Loading fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isAdminUser(user)) {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
