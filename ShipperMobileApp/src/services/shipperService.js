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

// Get all available orders for shippers (not just assigned ones)
export const getAvailableOrders = async (params = {}) => {
  try {
    console.log('🔄 getAvailableOrders called with params:', params);
    const queryParams = new URLSearchParams(params).toString();
    const url = `/orders/shipper/available?${queryParams}`;
    console.log('📡 Making request to:', url);
    console.log('📡 Full URL will be:', `${api.defaults.baseURL}${url}`);
    
    const response = await api.get(url);
    console.log('✅ getAvailableOrders response status:', response.status);
    console.log('✅ getAvailableOrders response data:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ getAvailableOrders error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
        headers: error.config?.headers
      }
    });
    throw error.response?.data || error;
  }
};

// Get shipper's own orders
export const getShipperOrders = async (params = {}) => {
  try {
    console.log('🔄 getShipperOrders called with params:', params);
    const queryParams = new URLSearchParams(params).toString();
    const url = `/orders/shipper/my-orders?${queryParams}`;
    console.log('📡 Making request to:', url);
    
    const response = await api.get(url);
    console.log('✅ getShipperOrders response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ getShipperOrders error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL
      }
    });
    throw error.response?.data || error;
  }
};

// Accept delivery order
export const acceptDeliveryOrder = async (orderId) => {
  try {
    const response = await api.put(`/orders/${orderId}/accept`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Update order status by shipper (can take over any order)
export const updateOrderByShipper = async (orderId, statusData) => {
  try {
    const response = await api.put(`/orders/${orderId}/shipper-update`, statusData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Update delivery status (legacy - for backward compatibility)
export const updateDeliveryStatus = async (orderId, status) => {
  try {
    const response = await api.put(`/orders/${orderId}/delivery-status`, { status });
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

// Update shipper location (with real coordinates)
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

export default {
  getShipperDashboard,
  getAvailableOrders,
  getShipperOrders,
  acceptDeliveryOrder,
  updateOrderByShipper,
  updateDeliveryStatus,
  getShipperRoute,
  updateShipperLocation,
  getShipperStats,
};
