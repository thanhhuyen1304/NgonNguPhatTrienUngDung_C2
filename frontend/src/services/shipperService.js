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
export const getShipperOrders = async () => {
  try {
    const response = await api.get('/shipper/orders');
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
  try {
    const response = await api.put('/shipper/location', { latitude, longitude });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get shipper stats
export const getShipperStats = async () => {
  try {
    const response = await api.get('/shipper/stats');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
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
