import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useI18n } from '../../i18n';
import { logout } from '../../store/slices/authSlice';
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  TruckIcon,
  ClipboardDocumentListIcon,
  ArrowLeftOnRectangleIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

const ShipperLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { t } = useI18n();

  const navigation = [
    { name: 'Dashboard', href: '/shipper', icon: TruckIcon },
    { name: 'Delivery Orders', href: '/shipper/orders', icon: ClipboardDocumentListIcon },
    { name: 'My Route', href: '/shipper/route', icon: MapPinIcon },
  ];

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/shipper') {
      return location.pathname === '/shipper';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-40 lg:hidden ${
          sidebarOpen ? 'block' : 'hidden'
        }`}
      >
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4 border-b">
            <span className="text-xl font-bold text-blue-600">Shipper</span>
            <button onClick={() => setSidebarOpen(false)}>
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  isActive(item.href)
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-white border-r">
          <div className="flex h-16 items-center px-4 border-b">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold text-blue-600">Shipper</span>
            </Link>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  isActive(item.href)
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="border-t p-4">
            <Link
              to="/"
              className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-3"
            >
              <HomeIcon className="mr-3 h-5 w-5" />
              {t('common.back')}
            </Link>
            <button
              onClick={handleLogout}
              className="flex w-full items-center text-sm text-red-600 hover:text-red-700"
            >
              <ArrowLeftOnRectangleIcon className="mr-3 h-5 w-5" />
              {t('nav.logout')}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-white shadow">
          <button
            type="button"
            className="px-4 text-gray-500 focus:outline-none lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="flex flex-1 justify-between px-4">
            <div className="flex items-center">
              <h1 className="text-lg font-semibold text-gray-900">
                Shipper Dashboard
              </h1>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-500 mr-2">Rating:</span>
              <span className="text-sm font-medium text-gray-900">
                {user?.shipperInfo?.rating}⭐
              </span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ShipperLayout;
