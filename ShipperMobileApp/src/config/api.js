// API Configuration
export const API_CONFIG = {
  // Dynamic IP selection based on environment
  BASE_URL: (() => {
    if (!__DEV__) {
      return 'http://localhost:5000/api'; // Production
    }
    
    // Development - prioritize the current working IP
    const possibleIPs = [
      'http://10.15.3.62:5000/api',     // Current WiFi IP (Updated)
      'http://10.0.2.2:5000/api',        // Android Emulator
      'http://localhost:5000/api',       // iOS Simulator / Web
      'http://127.0.0.1:5000/api',       // Alternative localhost
      'http://192.168.1.100:5000/api',   // Common router IP range
      'http://192.168.0.100:5000/api',   // Alternative router IP
    ];
    
    // Use the current working IP as default
    return possibleIPs[0];
  })(),
  
  // Alternative URLs for different environments:
  EMULATOR_IP: 'http://10.0.2.2:5000/api',        // For Android Emulator
  LOCALHOST: 'http://localhost:5000/api',          // For iOS Simulator
  LOCALHOST_ALT: 'http://127.0.0.1:5000/api',     // Alternative localhost
  WIFI_IP: 'http://10.15.3.62:5000/api',         // For physical device (WiFi) - CURRENT
  
  TIMEOUT: 10000, // 10 seconds timeout
};

// Helper function to get the correct API URL
export const getApiUrl = () => {
  const url = API_CONFIG.BASE_URL;
  console.log('🔗 Using API URL:', url);
  return url;
};

// Helper function to test different API URLs
export const getAlternativeApiUrls = () => {
  return [
    'http://10.15.3.62:5000/api',     // Current WiFi IP (Updated)
    'http://10.0.2.2:5000/api',        // Android Emulator
    'http://localhost:5000/api',       // iOS Simulator / Web
    'http://127.0.0.1:5000/api',       // Alternative localhost
    'http://192.168.1.100:5000/api',   // Common router IP range
    'http://192.168.0.100:5000/api',   // Alternative router IP
    'http://192.168.1.1:5000/api',     // Router gateway
  ];
};