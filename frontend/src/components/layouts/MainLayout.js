import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Header from '../common/Header';
import Footer from '../common/Footer';
import SupportWidget from '../support/SupportWidget';
import { isAdminUser } from '../../utils/roleRedirect';

const MainLayout = () => {
  const { isAuthenticated, initialized, user } = useSelector((state) => state.auth);

  if (initialized && isAuthenticated && isAdminUser(user)) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <SupportWidget />
    </div>
  );
};

export default MainLayout;
