import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Login user
export const login = async (email, password) => {
  try {
    console.log('🔐 Attempting login...');
    console.log('📧 Email:', email);
    console.log('🔗 API URL:', api.defaults.baseURL);
    
    const response = await api.post('/auth/login', { email, password });
    console.log('✅ Login API response received');
    
    const { user, accessToken, refreshToken } = response.data.data;

    // Save to AsyncStorage
    await AsyncStorage.setItem('accessToken', accessToken);
    await AsyncStorage.setItem('refreshToken', refreshToken);
    await AsyncStorage.setItem('user', JSON.stringify(user));

    console.log('✅ Login successful, tokens saved');
    return { user, accessToken, refreshToken };
  } catch (error) {
    console.error('❌ Login error details:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      data: error.response?.data,
    });
    
    // Extract meaningful error message
    let errorMessage = 'Login failed';
    
    if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
      errorMessage = 'Network Error - Cannot connect to server';
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Connection timeout - Server is not responding';
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
};

// Register user
export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    const { user, accessToken, refreshToken } = response.data.data;

    // Save to AsyncStorage
    await AsyncStorage.setItem('accessToken', accessToken);
    await AsyncStorage.setItem('refreshToken', refreshToken);
    await AsyncStorage.setItem('user', JSON.stringify(user));

    return { user, accessToken, refreshToken };
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get current user
export const getMe = async () => {
  try {
    console.log('Calling getMe API...');
    const token = await AsyncStorage.getItem('accessToken');
    console.log('Token from storage:', token ? 'exists' : 'missing');
    
    const response = await api.get('/auth/me');
    console.log('getMe response:', response.data);
    
    const user = response.data.data.user;
    await AsyncStorage.setItem('user', JSON.stringify(user));
    return user;
  } catch (error) {
    // Only log detailed error if it's not a token expiration during auto-check
    if (!error.isTokenExpired || !error.isAutoCheck) {
      console.error('getMe error:', error.response?.data || error.message);
    } else {
      console.log('Token expired during automatic check - this is normal');
    }
    throw error.response?.data || error;
  }
};

// Logout user
export const logout = async () => {
  try {
    console.log('Starting logout process...');
    
    // Try to call logout API with timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      await api.post('/auth/logout', {}, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log('Logout API call successful');
    } catch (apiError) {
      if (apiError.name === 'AbortError') {
        console.warn('Logout API call timed out, continuing with local cleanup');
      } else {
        console.warn('Logout API call failed, but continuing with local cleanup:', apiError.message);
      }
    }
    
    // Clear all stored data
    console.log('Clearing AsyncStorage...');
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
    console.log('AsyncStorage cleared successfully');
    
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    // Even if there's an error, try to clear storage
    try {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
      console.log('AsyncStorage cleared after error');
    } catch (storageError) {
      console.error('Failed to clear AsyncStorage:', storageError);
    }
    throw error;
  }
};

export default {
  login,
  register,
  getMe,
  logout,
};
