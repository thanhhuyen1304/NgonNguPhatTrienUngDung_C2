import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// Check if error is related to authentication/token issues
export const isTokenError = (error) => {
  const errorMessage = error.response?.data?.message || error.message || '';
  return errorMessage.includes('Token expired') || 
         errorMessage.includes('Not authorized') || 
         errorMessage.includes('Invalid token') ||
         errorMessage.includes('jwt expired') ||
         error.response?.status === 401;
};

// Handle token expiration - clear tokens and redirect to login
export const handleTokenExpired = async (navigation = null) => {
  try {
    console.log('Handling token expiration - clearing auth data');
    
    // Clear all auth-related data
    await AsyncStorage.multiRemove([
      'accessToken', 
      'refreshToken', 
      'user',
      'authState'
    ]);
    
    console.log('Auth data cleared successfully');
    
    // Show user-friendly message
    Alert.alert(
      'Phiên đăng nhập hết hạn',
      'Vui lòng đăng nhập lại để tiếp tục sử dụng ứng dụng.',
      [
        {
          text: 'Đăng nhập lại',
          onPress: () => {
            // If navigation is available, use it
            if (navigation && navigation.reset) {
              try {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              } catch (navError) {
                console.error('Navigation error:', navError);
                // Fallback: emit auth failure event
                if (global.authEventEmitter) {
                  global.authEventEmitter.emit('FORCE_LOGOUT', { 
                    message: 'Phiên đăng nhập đã hết hạn' 
                  });
                }
              }
            } else {
              // Fallback: emit auth failure event
              if (global.authEventEmitter) {
                global.authEventEmitter.emit('FORCE_LOGOUT', { 
                  message: 'Phiên đăng nhập đã hết hạn' 
                });
              }
            }
          }
        }
      ],
      { cancelable: false }
    );
    
  } catch (error) {
    console.error('Error handling token expiration:', error);
    
    // Fallback - just emit logout event
    if (global.authEventEmitter) {
      global.authEventEmitter.emit('FORCE_LOGOUT', { 
        message: 'Phiên đăng nhập đã hết hạn' 
      });
    }
  }
};

// Clear all authentication data
export const clearAuthData = async () => {
  try {
    await AsyncStorage.multiRemove([
      'accessToken', 
      'refreshToken', 
      'user',
      'authState'
    ]);
    console.log('All auth data cleared');
    return true;
  } catch (error) {
    console.error('Error clearing auth data:', error);
    return false;
  }
};

// Check if user has valid tokens
export const hasValidTokens = async () => {
  try {
    const accessToken = await AsyncStorage.getItem('accessToken');
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    
    if (!accessToken || !refreshToken) {
      return false;
    }
    
    // Try to decode the JWT to check expiration (basic check)
    try {
      const tokenParts = accessToken.split('.');
      if (tokenParts.length !== 3) {
        return false;
      }
      
      const payload = JSON.parse(atob(tokenParts[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Check if token is expired (with 5 minute buffer)
      if (payload.exp && payload.exp < (currentTime + 300)) {
        console.log('Token is expired or will expire soon');
        return false;
      }
      
      return true;
    } catch (decodeError) {
      console.error('Error decoding token:', decodeError);
      return false;
    }
  } catch (error) {
    console.error('Error checking tokens:', error);
    return false;
  }
};

// Get current user from storage
export const getCurrentUser = async () => {
  try {
    const userString = await AsyncStorage.getItem('user');
    return userString ? JSON.parse(userString) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Force logout and clear all data
export const forceLogout = async (navigation) => {
  try {
    await clearAuthData();
    
    Alert.alert(
      'Đã đăng xuất',
      'Bạn đã được đăng xuất khỏi ứng dụng.',
      [
        {
          text: 'OK',
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }
        }
      ]
    );
  } catch (error) {
    console.error('Error during force logout:', error);
  }
};