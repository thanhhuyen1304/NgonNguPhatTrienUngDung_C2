import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Loading from '../common/Loading';

const ShipperRoute = () => {
  const { user, isAuthenticated, loading, initialized } = useSelector((state) => state.auth);
  const location = useLocation();

  if (loading || !initialized) {
    return <Loading fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.role !== 'shipper') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ShipperRoute;
