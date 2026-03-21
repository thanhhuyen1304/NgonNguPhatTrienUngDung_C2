import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl, getAlternativeApiUrls } from '../config/api';

let API_URL = getApiUrl();

// Function to test and find working API URL
const findWorkingApiUrl = async () => {
  const urlsToTest = [API_URL, ...getAlternativeApiUrls()];
  
  console.log('🔍 Testing API URLs:', urlsToTest);
  
  for (const testUrl of urlsToTest) {
    try {
      console.log(`🌐 Testing: ${testUrl}`);
      const response = await axios.get(`${testUrl.replace('/api', '')}/api/health`, { 
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.status === 200) {
        console.log(`✅ Working API URL found: ${testUrl}`);
        console.log(`📊 Server response:`, response.data);
        API_URL = testUrl; // Update the working URL
        return testUrl;
      }
    } catch (error) {
      console.log(`❌ URL ${testUrl} failed:`, error.code || error.message);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
      }
    }
  }
  
  console.error('❌ No working API URL found from:', urlsToTest);
  console.error('💡 Troubleshooting tips:');
  console.error('   1. Make sure backend server is running (npm run dev in backend folder)');
  console.error('   2. Check Windows Firewall - run add-firewall-rule.bat as Administrator');
  console.error('   3. Ensure both devices are on the same WiFi network');
  console.error('   4. Current WiFi IP should be 172.20.10.2 (check ipconfig)');
  
  // Don't throw error, just return null and let the caller handle it
  return null;
};

// Simple auth failure handler
const handleAuthFailure = async (error) => {
  try {
    console.log('Handling auth failure, clearing tokens');
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
    
    // Emit auth failure event
    if (global.authEventEmitter) {
      global.authEventEmitter.emit('FORCE_LOGOUT', { 
        message: 'Phiên đăng nhập đã hết hạn' 
      });
    }
  } catch (clearError) {
    console.error('Error clearing auth data:', clearError);
  }
};

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Create axios instance with dynamic baseURL
const api = axios.create({
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and handle dynamic baseURL
api.interceptors.request.use(
  async (config) => {
    try {
      // Set the current API URL
      config.baseURL = API_URL;
      
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh and URL fallback
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If it's a network error, try to find a working URL
    if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
      console.log('🌐 Network error detected, trying to find working URL...');
      const workingUrl = await findWorkingApiUrl();
      if (workingUrl && workingUrl !== originalRequest.baseURL) {
        console.log(`🔄 Retrying request with new URL: ${workingUrl}`);
        originalRequest.baseURL = workingUrl;
        return api(originalRequest);
      }
    }

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Check if the error is specifically about token expiration
      const errorMessage = error.response?.data?.message || '';
      const isTokenError = errorMessage.includes('Token expired') || 
                          errorMessage.includes('Not authorized') || 
                          errorMessage.includes('Invalid token');

      if (!isTokenError) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        console.log('Attempting token refresh due to:', errorMessage);
        const response = await axios.post(`${API_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        
        // Save new tokens
        await AsyncStorage.setItem('accessToken', accessToken);
        await AsyncStorage.setItem('refreshToken', newRefreshToken);

        // Update original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        
        // Process queued requests
        processQueue(null, accessToken);
        
        console.log('Token refresh successful, retrying original request');
        return api(originalRequest);
        
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError.response?.data || refreshError.message);
        
        // Process queued requests with error
        processQueue(refreshError, null);
        
        // Handle auth failure (clear tokens and emit logout event)
        await handleAuthFailure(refreshError);
        
        // Create a more user-friendly error for expired tokens
        const userFriendlyError = new Error('Token expired');
        userFriendlyError.isTokenExpired = true;
        userFriendlyError.isAutoCheck = originalRequest.url?.includes('/auth/me'); // Flag for automatic token checks
        return Promise.reject(userFriendlyError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
export { findWorkingApiUrl };

// Export a simple health check function for testing
export const testConnection = async () => {
  try {
    const workingUrl = await findWorkingApiUrl();
    if (workingUrl) {
      return {
        success: true,
        url: workingUrl,
        message: 'Connection successful'
      };
    } else {
      return {
        success: false,
        url: null,
        message: 'No working API URL found'
      };
    }
  } catch (error) {
    return {
      success: false,
      url: null,
      message: error.message
    };
  }
};
