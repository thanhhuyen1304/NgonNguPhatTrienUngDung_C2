import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Loading from '../common/Loading';

const GuestRoute = () => {
  const { isAuthenticated, loading, initialized } = useSelector((state) => state.auth);
  const location = useLocation();

  if (loading || !initialized) {
    return <Loading fullScreen />;
  }

  if (isAuthenticated) {
    // Redirect to the page they came from, or home
    const from = location.state?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  return <Outlet />;
};

export default GuestRoute;
