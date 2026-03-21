import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { TruckIcon, StarIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import shipperService from '../../services/shipperService';

const ShipperDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    rating: 5,
    completedToday: 0,
    pendingOrders: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await shipperService.getShipperStats();
        if (response.success) {
          setStats({
            totalDeliveries: response.data.totalDeliveries || 0,
            rating: response.data.rating || 5,
            completedToday: 0,
            pendingOrders: 0,
          });
        }
      } catch (error) {
        console.error('Error fetching shipper stats:', error);
        // Use user data as fallback
        if (user?.shipperInfo) {
          setStats({
            totalDeliveries: user.shipperInfo.totalDeliveries || 0,
            rating: user.shipperInfo.rating || 5,
            completedToday: 0,
            pendingOrders: 0,
          });
        }
      }
    };
    
    fetchStats();
  }, [user]);

  const statCards = [
    {
      title: 'Total Deliveries',
      value: stats.totalDeliveries,
      icon: TruckIcon,
      color: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Rating',
      value: `${stats.rating}⭐`,
      icon: StarIcon,
      color: 'bg-yellow-50',
      textColor: 'text-yellow-600',
    },
    {
      title: 'Completed Today',
      value: stats.completedToday,
      icon: CheckCircleIcon,
      color: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      icon: TruckIcon,
      color: 'bg-red-50',
      textColor: 'text-red-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome, {user?.name}! 👋
        </h2>
        <p className="text-gray-600">
          Vehicle: {user?.shipperInfo?.vehicleType || 'Not specified'} |{' '}
          License: {user?.shipperInfo?.licensePlate || 'Not specified'}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Status: {user?.shipperInfo?.isVerified ? '✅ Verified' : '⏳ Pending Verification'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.title}
            className={`${card.color} rounded-lg p-6 shadow`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{card.title}</p>
                <p className={`text-3xl font-bold ${card.textColor} mt-2`}>
                  {card.value}
                </p>
              </div>
              <card.icon className={`h-12 w-12 ${card.textColor}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg p-4 text-center text-blue-600 font-medium transition">
            📍 View My Route
          </button>
          <button className="bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg p-4 text-center text-green-600 font-medium transition">
            ✅ Accept New Orders
          </button>
          <button className="bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg p-4 text-center text-purple-600 font-medium transition">
            📊 View Statistics
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Deliveries</h3>
        <div className="text-center text-gray-500 py-8">
          No deliveries yet. Start accepting orders to see them here.
        </div>
      </div>
    </div>
  );
};

export default ShipperDashboard;
