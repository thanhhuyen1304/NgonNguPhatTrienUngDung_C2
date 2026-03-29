import axios from 'axios';

const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const refreshClient = axios.create({
  baseURL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshRequest = null;

const NON_REFRESHABLE_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/google',
  '/auth/google/callback',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/refresh-token',
];

const clearStoredAuth = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
};

const shouldSkipRefresh = (url = '') => {
  return NON_REFRESHABLE_PATHS.some((path) => url.includes(path));
};

export const refreshAccessToken = async () => {
  if (!refreshRequest) {
    refreshRequest = refreshClient
      .post('/auth/refresh-token')
      .then((response) => {
        const accessToken = response.data?.data?.accessToken;

        if (accessToken) {
          localStorage.setItem('accessToken', accessToken);
        }

        return accessToken;
      })
      .catch((error) => {
        clearStoredAuth();
        throw error;
      })
      .finally(() => {
        refreshRequest = null;
      });
  }

  return refreshRequest;
};

api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isUnauthorized = error.response?.status === 401;
    const requestUrl = originalRequest?.url || '';

    if (
      !isUnauthorized ||
      !originalRequest ||
      originalRequest._retry ||
      shouldSkipRefresh(requestUrl)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const newAccessToken = await refreshAccessToken();

      if (newAccessToken) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      }

      return api(originalRequest);
    } catch (refreshError) {
      clearStoredAuth();

      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }

      return Promise.reject(refreshError);
    }
  }
);

export const getApiOrigin = () => baseURL.replace(/\/api$/, '');

export default api;
