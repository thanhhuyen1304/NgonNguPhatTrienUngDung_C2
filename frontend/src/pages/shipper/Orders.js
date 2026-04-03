import React, { useState, useEffect } from 'react';
import { MapPinIcon, TruckIcon, UserIcon, PhoneIcon } from '@heroicons/react/24/outline';
import shipperService from '../../services/shipperService';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount || 0);
};

const mapStatusLabel = (status) => {
  const labels = {
    confirmed: 'Confirmed',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };

  return labels[status] || status;
};

const ShipperOrders = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await shipperService.getShipperOrders('active');
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
          order._id === orderId ? { ...order, status: 'processing', shipper: { _id: 'me' } } : order
        ));
      }
    } catch (error) {
      console.error('Error accepting order:', error);
      alert('Failed to accept order');
    }
  };

  const handleStartDelivery = async (orderId) => {
    try {
      const response = await shipperService.updateDeliveryStatus(orderId, 'shipped');
      if (response.success) {
        setOrders(orders.map((order) =>
          order._id === orderId ? { ...order, status: 'shipped' } : order
        ));
      }
    } catch (error) {
      console.error('Error starting delivery:', error);
      alert('Failed to start delivery');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
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
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="grid grid-cols-1 gap-4">
        {orders.map((order) => (
          <div key={order._id} className="bg-white shadow rounded-lg p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {order.orderNumber}
                  </h3>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                    {mapStatusLabel(order.status)}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 mr-2" />
                    {order.user?.name || order.shippingAddress?.fullName || 'N/A'}
                  </div>
                  <div className="flex items-center">
                    <PhoneIcon className="h-4 w-4 mr-2" />
                    {order.user?.phone || order.shippingAddress?.phone || 'N/A'}
                  </div>
                  <div className="flex items-center">
                    <MapPinIcon className="h-4 w-4 mr-2" />
                    {[order.shippingAddress?.street, order.shippingAddress?.city, order.shippingAddress?.country].filter(Boolean).join(', ')}
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:items-end gap-3">
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(order.totalPrice)}
                </div>
                <div className="flex gap-2">
                  <button className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded text-sm font-medium transition">
                    View Details
                  </button>
                  {order.status === 'confirmed' && !order.shipper && (
                    <button 
                      onClick={() => handleAcceptOrder(order._id)}
                      className="bg-green-50 hover:bg-green-100 text-green-600 px-4 py-2 rounded text-sm font-medium transition"
                    >
                      Accept
                    </button>
                  )}
                  {order.status === 'processing' && (
                    <button
                      onClick={() => handleStartDelivery(order._id)}
                      className="bg-purple-50 hover:bg-purple-100 text-purple-600 px-4 py-2 rounded text-sm font-medium transition"
                    >
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
