import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Loading from '../common/Loading';
import { getPostLoginRoute } from '../../utils/roleRedirect';

const GuestRoute = () => {
  const { isAuthenticated, initialized, user } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!initialized) {
    return <Loading fullScreen />;
  }

  if (isAuthenticated) {
    const from = location.state?.from?.pathname || '/';
    return <Navigate to={getPostLoginRoute(user, from)} replace />;
  }

  return <Outlet />;
};

export default GuestRoute;
