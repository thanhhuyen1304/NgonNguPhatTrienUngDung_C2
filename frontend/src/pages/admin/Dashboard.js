import React, { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, productsRes] = await Promise.all([
        api.get('/orders/admin/stats').catch(err => {
          console.error('Orders stats error:', err);
          return { data: { data: { summary: { totalOrders: 0, totalRevenue: 0 }, statusCounts: [] } } };
        }),
        api.get('/products/admin/stats').catch(err => {
          console.error('Products stats error:', err);
          return { data: { data: { totalProducts: 0, activeProducts: 0, featuredProducts: 0, outOfStock: 0, lowStock: 0, topSelling: [], productsByCategory: [] } } };
        }),
      ]);

      setStats({
        orders: statsRes.data.data,
        products: productsRes.data.data,
      });
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      toast.error('Không thể tải dữ liệu dashboard');
      // Set default stats to prevent crashes
      setStats({
        orders: { summary: { totalOrders: 0, totalRevenue: 0 }, statusCounts: [] },
        products: { totalProducts: 0, activeProducts: 0, featuredProducts: 0, outOfStock: 0, lowStock: 0, topSelling: [], productsByCategory: [] }
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600 text-lg">Đang tải dữ liệu dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const StatCard = ({ icon, label, value, color, bgColor, trend, trendValue }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${bgColor}`}>
          <div className="text-2xl">{icon}</div>
        </div>
        {trend && (
          <div className={`flex items-center text-sm font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            <svg className={`w-4 h-4 mr-1 ${trend === 'up' ? 'rotate-0' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l5-5 5 5M7 7l5 5 5-5" />
            </svg>
            {trendValue}%
          </div>
        )}
      </div>
      <div>
        <p className="text-gray-600 text-sm font-medium mb-1">{label}</p>
        <p className={`text-3xl font-bold ${color}`}>{value}</p>
      </div>
    </div>
  );

  const QuickActionCard = ({ icon, title, description, color, onClick }) => (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 cursor-pointer group"
    >
      <div className="flex items-center space-x-4">
        <div className={`p-3 rounded-lg ${color} group-hover:scale-110 transition-transform`}>
          <div className="text-xl">{icon}</div>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  );

  const ProgressBar = ({ percentage, color = 'blue' }) => (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div 
        className={`bg-${color}-600 h-2 rounded-full transition-all duration-500 ease-out`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-4xl font-bold text-gray-900 flex items-center">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  📊 Dashboard
                </span>
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Tổng quan hoạt động cửa hàng và phân tích dữ liệu
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchDashboardData}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Làm mới
              </button>
            </div>
          </div>
        </div>

        {/* Key Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon="🛒"
            label="Tổng đơn hàng"
            value={stats?.orders?.summary?.totalOrders || 0}
            color="text-blue-600"
            bgColor="bg-blue-100"
            trend="up"
            trendValue="12"
          />
          <StatCard
            icon="💰"
            label="Doanh thu"
            value={`$${(stats?.orders?.summary?.totalRevenue || 0).toLocaleString('en-US')}`}
            color="text-green-600"
            bgColor="bg-green-100"
            trend="up"
            trendValue="8"
          />
          <StatCard
            icon="📦"
            label="Tổng sản phẩm"
            value={stats?.products?.totalProducts || 0}
            color="text-purple-600"
            bgColor="bg-purple-100"
            trend="up"
            trendValue="5"
          />
          <StatCard
            icon="⚠️"
            label="Hết hàng"
            value={stats?.products?.outOfStock || 0}
            color="text-red-600"
            bgColor="bg-red-100"
            trend="down"
            trendValue="3"
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Thao tác nhanh</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickActionCard
              icon="➕"
              title="Thêm sản phẩm"
              description="Tạo sản phẩm mới"
              color="bg-blue-100 text-blue-600"
              onClick={() => window.location.href = '/admin/products/new'}
            />
            <QuickActionCard
              icon="📋"
              title="Quản lý đơn hàng"
              description="Xem và xử lý đơn hàng"
              color="bg-green-100 text-green-600"
              onClick={() => window.location.href = '/admin/orders'}
            />
            <QuickActionCard
              icon="👥"
              title="Quản lý người dùng"
              description="Xem danh sách người dùng"
              color="bg-purple-100 text-purple-600"
              onClick={() => window.location.href = '/admin/users'}
            />
            <QuickActionCard
              icon="🚚"
              title="Duyệt Shipper"
              description="Phê duyệt đăng ký shipper"
              color="bg-orange-100 text-orange-600"
              onClick={() => window.location.href = '/admin/shipper-applications'}
            />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Products Overview */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">📦 Sản phẩm</h3>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {stats?.products?.totalProducts || 0} tổng
                </span>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700 font-medium">Đang hoạt động</span>
                    <span className="font-bold text-blue-600">{stats?.products?.activeProducts || 0}</span>
                  </div>
                  <ProgressBar 
                    percentage={stats?.products?.totalProducts ? (stats.products.activeProducts / stats.products.totalProducts) * 100 : 0} 
                    color="blue" 
                  />
                </div>
                <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700 font-medium">Nổi bật</span>
                    <span className="font-bold text-purple-600">{stats?.products?.featuredProducts || 0}</span>
                  </div>
                  <ProgressBar 
                    percentage={stats?.products?.totalProducts ? (stats.products.featuredProducts / stats.products.totalProducts) * 100 : 0} 
                    color="purple" 
                  />
                </div>
                <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700 font-medium">Sắp hết hàng</span>
                    <span className="font-bold text-orange-600">{stats?.products?.lowStock || 0}</span>
                  </div>
                  <ProgressBar 
                    percentage={stats?.products?.totalProducts ? (stats.products.lowStock / stats.products.totalProducts) * 100 : 0} 
                    color="orange" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Top Selling Products */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">🏆 Sản phẩm bán chạy</h3>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Xem tất cả →
                </button>
              </div>
              <div className="space-y-4">
                {stats?.products?.topSelling?.slice(0, 5).map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-gray-400' : 
                        index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-600">{product.price?.toLocaleString('vi-VN')} VNĐ</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">
                        {product.sold} đã bán
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Products by Category */}
        {stats?.products?.productsByCategory && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">🏷️ Sản phẩm theo danh mục</h3>
            <div className="space-y-4">
              {stats.products.productsByCategory.map((cat, index) => {
                const maxCount = Math.max(...stats.products.productsByCategory.map((c) => c.count));
                const percentage = (cat.count / maxCount) * 100;
                const colors = ['blue', 'purple', 'green', 'orange', 'red', 'indigo'];
                const color = colors[index % colors.length];
                
                return (
                  <div key={index} className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-gray-900">{cat.category}</span>
                      <span className={`bg-${color}-100 text-${color}-800 px-3 py-1 rounded-full text-sm font-bold`}>
                        {cat.count} sản phẩm
                      </span>
                    </div>
                    <ProgressBar percentage={percentage} color={color} />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;