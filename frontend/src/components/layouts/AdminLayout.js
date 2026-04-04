import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import Header from '../common/Header';
import { 
  ChartBarIcon, 
  ShoppingBagIcon, 
  TagIcon, 
  TicketIcon, 
  ClipboardDocumentListIcon, 
  UsersIcon, 
  ChatBubbleLeftRightIcon,
  ArrowLeftOnRectangleIcon,
  HomeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/admin', 
      icon: <ChartBarIcon className="w-5 h-5" />
    },
    { 
      name: 'Manage Products', 
      href: '/admin/products', 
      icon: <ShoppingBagIcon className="w-5 h-5" />
    },
    { 
      name: 'Manage Categories', 
      href: '/admin/categories', 
      icon: <TagIcon className="w-5 h-5" />
    },
    {
      name: 'Manage Coupons',
      href: '/admin/coupons',
      icon: <TicketIcon className="w-5 h-5" />
    },
    { 
      name: 'Manage Orders', 
      href: '/admin/orders', 
      icon: <ClipboardDocumentListIcon className="w-5 h-5" />
    },
    { 
      name: 'Manage Users', 
      href: '/admin/users', 
      icon: <UsersIcon className="w-5 h-5" />
    },
    {
      name: 'Support Inbox',
      href: '/admin/support',
      icon: <ChatBubbleLeftRightIcon className="w-5 h-5" />
    },
  ];

  const handleLogout = () => {
    const result = window.confirm('🚪 Đăng xuất khỏi hệ thống\n\nBạn có chắc chắn muốn đăng xuất không?\n\n• Phiên làm việc hiện tại sẽ kết thúc\n• Bạn sẽ cần đăng nhập lại để tiếp tục\n• Các thay đổi chưa lưu có thể bị mất');
    
    if (result) {
      dispatch(logout());
      navigate('/login');
    }
  };

  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  const getPageTitle = () => {
    const currentNav = navigation.find(nav => isActive(nav.href));
    return currentNav ? currentNav.name : 'Dashboard';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-lg transition-transform duration-300 ease-in-out lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ top: '64px' }}
      >
        <div className="flex h-full flex-col">
          {/* Mobile Header */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
            <Link to="/" className="text-xl font-bold text-blue-600">
              E-commerce
            </Link>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Mobile Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  isActive(item.href)
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="mr-3 flex-shrink-0">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Mobile Footer */}
          <div className="border-t border-gray-200 p-4 space-y-1">
            <Link
              to="/"
              className="flex items-center px-2 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Back
            </Link>
            <button
              onClick={handleLogout}
              className="flex w-full items-center px-2 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div 
        className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col"
        style={{ top: '64px' }}
      >
        <div className="flex min-h-0 flex-1 flex-col bg-white border-r border-gray-200">
          {/* Desktop Header */}
          {/* Desktop Header area padding */}
          <div className="h-4" />

          {/* Desktop Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  isActive(item.href)
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="mr-3 flex-shrink-0">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Desktop Footer */}
          <div className="border-t border-gray-200 p-4 space-y-1">
            <Link
              to="/"
              className="flex items-center px-2 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Back
            </Link>
            <button
              onClick={handleLogout}
              className="flex w-full items-center px-2 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md"
            >
              <ArrowLeftOnRectangleIcon className="w-5 h-5 mr-3" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Header and Main content area */}
      <div className="flex flex-col min-h-screen">
        <Header onSidebarToggle={() => setSidebarOpen(true)} />
        
        <div className="flex-1 lg:pl-64">
          {/* Page content */}
          <main className="p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
