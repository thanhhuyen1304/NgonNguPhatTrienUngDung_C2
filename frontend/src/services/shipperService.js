import api from './api';

// Get shipper dashboard data
export const getShipperDashboard = async () => {
  try {
    const response = await api.get('/shipper/dashboard');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get shipper orders
export const getShipperOrders = async (type = '') => {
  try {
    const params = type ? { type } : {};
    const response = await api.get('/shipper/orders', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Accept delivery order
export const acceptDeliveryOrder = async (orderId) => {
  try {
    const response = await api.post(`/shipper/orders/${orderId}/accept`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Update delivery status
export const updateDeliveryStatus = async (orderId, status) => {
  try {
    const response = await api.put(`/shipper/orders/${orderId}/status`, { status });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get shipper route
export const getShipperRoute = async () => {
  try {
    const response = await api.get('/shipper/route');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Update shipper location
export const updateShipperLocation = async (latitude, longitude) => {
  return {
    success: true,
    data: {
      location: { latitude, longitude },
    },
  };
};

// Get shipper stats
export const getShipperStats = async () => {
  const response = await getShipperDashboard();

  if (!response.success) {
    return response;
  }

  return {
    success: true,
    data: {
      totalDeliveries: response.data?.stats?.totalDeliveries || 0,
      rating: response.data?.shipperInfo?.rating || 5,
      activeDeliveries: response.data?.stats?.activeDeliveries || 0,
    },
  };
};

const shipperService = {
  getShipperDashboard,
  getShipperOrders,
  acceptDeliveryOrder,
  updateDeliveryStatus,
  getShipperRoute,
  updateShipperLocation,
  getShipperStats,
};

export default shipperService;
