import React, { useState, useEffect } from 'react';
import { MapPinIcon, TruckIcon, UserIcon, PhoneIcon } from '@heroicons/react/24/outline';
import shipperService from '../../services/shipperService';

const ShipperOrders = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await shipperService.getShipperOrders();
      if (response.success) {
        setOrders(response.data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      const response = await shipperService.acceptDeliveryOrder(orderId);
      if (response.success) {
        setOrders(orders.map(order => 
          order.id === orderId ? { ...order, status: 'accepted' } : order
        ));
      }
    } catch (error) {
      console.error('Error accepting order:', error);
      alert('Failed to accept order');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      inTransit: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || colors.pending;
  };

  return (
    <div className="space-y-6">
      {/* Filter/Search Bar */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search order..."
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
          />
          <select className="border border-gray-300 rounded px-3 py-2 text-sm">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="inTransit">In Transit</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="grid grid-cols-1 gap-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-white shadow rounded-lg p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {order.orderNo}
                  </h3>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 mr-2" />
                    {order.customerName || 'N/A'}
                  </div>
                  <div className="flex items-center">
                    <PhoneIcon className="h-4 w-4 mr-2" />
                    {order.phone}
                  </div>
                  <div className="flex items-center">
                    <MapPinIcon className="h-4 w-4 mr-2" />
                    {order.address}
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:items-end gap-3">
                <div className="text-2xl font-bold text-gray-900">
                  {order.amount}
                </div>
                <div className="flex gap-2">
                  <button className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded text-sm font-medium transition">
                    View Details
                  </button>
                  {order.status === 'pending' && (
                    <button 
                      onClick={() => handleAcceptOrder(order.id)}
                      className="bg-green-50 hover:bg-green-100 text-green-600 px-4 py-2 rounded text-sm font-medium transition"
                    >
                      Accept
                    </button>
                  )}
                  {order.status === 'accepted' && (
                    <button className="bg-purple-50 hover:bg-purple-100 text-purple-600 px-4 py-2 rounded text-sm font-medium transition">
                      Start Delivery
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {orders.length === 0 && (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <TruckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No orders available at the moment.</p>
        </div>
      )}
    </div>
  );
};

export default ShipperOrders;
