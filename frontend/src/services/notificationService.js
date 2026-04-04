import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const notificationService = {
  getNotifications: async (token) => {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    const response = await axios.get(`${API_URL}/notifications`, config);
    return response.data;
  },

  markAsRead: async (id, token) => {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    const response = await axios.put(`${API_URL}/notifications/${id}/read`, {}, config);
    return response.data;
  },

  markAllRead: async (token) => {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    const response = await axios.put(`${API_URL}/notifications/read-all`, {}, config);
    return response.data;
  },

  deleteNotification: async (id, token) => {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    const response = await axios.delete(`${API_URL}/notifications/${id}`, config);
    return response.data;
  },
};

export default notificationService;
