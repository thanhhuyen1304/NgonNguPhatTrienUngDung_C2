import { Linking, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MAP_PREFERENCE_KEY = 'map_app_preference';

// Geocoding service with better Vietnamese address support
export const geocodeAddress = async (address) => {
  console.log('🗺️ Geocoding address:', address);
  console.log('🔍 Address type:', typeof address, 'Length:', address?.length);
  
  if (!address || typeof address !== 'string' || address.trim() === '') {
    console.warn('⚠️ Invalid address provided, using default');
    return { latitude: 10.8435, longitude: 106.7735 }; // Default Thu Duc location
  }
  
  const cleanAddress = address.trim();
  
  // Try to use a real geocoding service first (Google Geocoding API)
  try {
    // For production, you would use a real API key
    // const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=YOUR_API_KEY`);
    // const data = await response.json();
    // if (data.results && data.results.length > 0) {
    //   const location = data.results[0].geometry.location;
    //   return { latitude: location.lat, longitude: location.lng };
    // }
  } catch (error) {
    console.log('Geocoding API error:', error);
  }
  
  // Enhanced mock coordinates with Vietnamese addresses
  const mockCoordinates = {
    // Original mock addresses
    '123 Main St, District 1, Ho Chi Minh City': { latitude: 10.7769, longitude: 106.7009 },
    '456 Oak Ave, District 3, Ho Chi Minh City': { latitude: 10.7829, longitude: 106.6934 },
    '789 Pine St, District 7, Ho Chi Minh City': { latitude: 10.7378, longitude: 106.6621 },
    'Store ABC, 456 Nguyen Hue St': { latitude: 10.7740, longitude: 106.7010 },
    'Store XYZ, 789 Le Loi St': { latitude: 10.7750, longitude: 106.7020 },
    'Tech Store, 321 Dong Khoi St': { latitude: 10.7760, longitude: 106.7030 },
    
    // Vietnamese addresses - Thu Duc area (more specific coordinates based on real data)
    // Exact address with precise coordinates for Đường số 10, Hiệp Bình Phước
    '13/30 Đường số 10, Khu phố 2, Phường Hiệp Bình Phước, Thủ Đức, Hồ Chí Minh': { latitude: 10.8435, longitude: 106.7135 },
    '13/30 Đường số 10, Phường Hiệp Bình Phước, Thủ Đức': { latitude: 10.8435, longitude: 106.7135 },
    '13/30 Đường số 10, Hiệp Bình Phước, Thủ Đức': { latitude: 10.8435, longitude: 106.7135 },
    '13/30 Đường số 10, Khu phố 2, Hiệp Bình Phước': { latitude: 10.8435, longitude: 106.7135 },
    'Đường số 10, Khu phố 2, Hiệp Bình Phước': { latitude: 10.8435, longitude: 106.7135 },
    'Đường số 10, Hiệp Bình Phước, Thủ Đức': { latitude: 10.8435, longitude: 106.7135 },
    'Hiệp Bình Phước, Thủ Đức': { latitude: 10.8486, longitude: 106.7121 }, // Thu Duc center coordinates
    
    // More Thu Duc addresses with precise coordinates
    'Phường Hiệp Bình Phước, Thủ Đức, Hồ Chí Minh': { latitude: 10.8486, longitude: 106.7121 },
    'Hiệp Bình Phước, Thủ Đức, Hồ Chí Minh': { latitude: 10.8486, longitude: 106.7121 },
    'Khu phố 2, Phường Hiệp Bình Phước': { latitude: 10.8435, longitude: 106.7135 },
    'Khu phố 2, Hiệp Bình Phước': { latitude: 10.8435, longitude: 106.7135 },
    
    // Store addresses
    'Store ABC, 456 Nguyen Hue St, District 1, Ho Chi Minh City': { latitude: 10.7740, longitude: 106.7010 },
    'Địa chỉ giao hàng': { latitude: 10.8435, longitude: 106.7135 }, // Default to specific Thu Duc location
  };

  // Check for exact match first
  if (mockCoordinates[cleanAddress]) {
    console.log('✅ Found exact address match:', mockCoordinates[cleanAddress]);
    return mockCoordinates[cleanAddress];
  }
  
  // Try partial matching for Vietnamese addresses with better precision
  const addressLower = cleanAddress.toLowerCase();
  
  // Check for partial matches with Thu Duc addresses - more specific matching
  for (const [key, coords] of Object.entries(mockCoordinates)) {
    const keyLower = key.toLowerCase();
    
    // Exact street number and street name matching
    if (keyLower.includes('13/30') && addressLower.includes('13/30') && 
        keyLower.includes('đường số 10') && addressLower.includes('đường số 10')) {
      console.log('✅ Found exact street address match:', coords);
      return coords;
    }
    
    // Street name and ward matching
    if (keyLower.includes('đường số 10') && addressLower.includes('đường số 10') &&
        keyLower.includes('hiệp bình phước') && addressLower.includes('hiệp bình phước')) {
      console.log('✅ Found street and ward match:', coords);
      return coords;
    }
    
    // Ward and district matching
    if ((keyLower.includes('hiệp bình phước') || keyLower.includes('hiệp bìn phước')) && 
        (addressLower.includes('hiệp bình phước') || addressLower.includes('hiệp bìn phước')) &&
        keyLower.includes('thủ đức') && addressLower.includes('thủ đức')) {
      console.log('✅ Found ward and district match:', coords);
      return coords;
    }
  }
  
  // Fallback to broader area matching
  // Check for specific street names first
  if (addressLower.includes('đường số 10') && (addressLower.includes('hiệp bình phước') || addressLower.includes('hiệp bìn phước'))) {
    console.log('📍 Matched Đường số 10, Hiệp Bình Phước area');
    return { latitude: 10.8435, longitude: 106.7135 };
  }
  
  // Check for specific block/area within ward
  if (addressLower.includes('khu phố 2') && (addressLower.includes('hiệp bình phước') || addressLower.includes('hiệp bìn phước'))) {
    console.log('📍 Matched Khu phố 2, Hiệp Bình Phước');
    return { latitude: 10.8435, longitude: 106.7135 };
  }
  
  // Try to match by district/area for Vietnamese addresses
  // Thu Duc area coordinates
  if (addressLower.includes('thủ đức') || addressLower.includes('thu duc')) {
    console.log('📍 Matched Thu Duc area');
    return { latitude: 10.8486, longitude: 106.7121 }; // Real Thu Duc center coordinates
  }
  
  // Hiep Binh Phuoc ward specifically
  if (addressLower.includes('hiệp bình phước') || addressLower.includes('hiep binh phuoc') || addressLower.includes('hiệp bìn phước')) {
    console.log('📍 Matched Hiệp Bình Phước ward');
    return { latitude: 10.8486, longitude: 106.7121 };
  }
  
  // District 1 - City center
  if (addressLower.includes('quận 1') || addressLower.includes('district 1')) {
    console.log('📍 Matched District 1');
    return { latitude: 10.7769, longitude: 106.7009 };
  }
  
  // District 3
  if (addressLower.includes('quận 3') || addressLower.includes('district 3')) {
    console.log('📍 Matched District 3');
    return { latitude: 10.7829, longitude: 106.6934 };
  }
  
  // District 7
  if (addressLower.includes('quận 7') || addressLower.includes('district 7')) {
    console.log('📍 Matched District 7');
    return { latitude: 10.7378, longitude: 106.6621 };
  }
  
  // Binh Thanh
  if (addressLower.includes('bình thạnh') || addressLower.includes('binh thanh')) {
    console.log('📍 Matched Binh Thanh');
    return { latitude: 10.8014, longitude: 106.7109 };
  }
  
  // Tan Binh
  if (addressLower.includes('tân bình') || addressLower.includes('tan binh')) {
    console.log('📍 Matched Tan Binh');
    return { latitude: 10.8008, longitude: 106.6527 };
  }
  
  // Default to Ho Chi Minh City center if no match
  console.log('⚠️ No address match found, using default HCM center');
  console.log('⚠️ Original address was:', cleanAddress);
  return { latitude: 10.7769, longitude: 106.7009 };
};

// Get user's preferred map app
export const getMapPreference = async () => {
  try {
    const preference = await AsyncStorage.getItem(MAP_PREFERENCE_KEY);
    return preference ? JSON.parse(preference) : null;
  } catch (error) {
    console.error('Error getting map preference:', error);
    return null;
  }
};

// Save user's map app preference
export const saveMapPreference = async (appType, alwaysUse = false) => {
  try {
    const preference = {
      appType, // 'google' or 'apple'
      alwaysUse,
      timestamp: Date.now()
    };
    await AsyncStorage.setItem(MAP_PREFERENCE_KEY, JSON.stringify(preference));
    return true;
  } catch (error) {
    console.error('Error saving map preference:', error);
    return false;
  }
};

// Clear map preference
export const clearMapPreference = async () => {
  try {
    await AsyncStorage.removeItem(MAP_PREFERENCE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing map preference:', error);
    return false;
  }
};

// Smart navigation with preference handling
export const smartNavigate = async (destination, label = '') => {
  try {
    // Check if user has a saved preference
    const preference = await getMapPreference();
    
    if (preference && preference.alwaysUse) {
      // Use saved preference without asking
      if (preference.appType === 'google') {
        return await openGoogleMaps(destination, label);
      } else if (preference.appType === 'apple' && Platform.OS === 'ios') {
        return await openAppleMaps(destination, label);
      }
    }
    
    // Show selection dialog with "Always use" options
    return new Promise((resolve) => {
      const options = [
        { text: 'Hủy', style: 'cancel', onPress: () => resolve(false) }
      ];
      
      // Google Maps option
      options.push({
        text: 'Google Maps',
        onPress: () => {
          showAlwaysUseDialog('google', destination, label, resolve);
        }
      });
      
      // Apple Maps option (iOS only)
      if (Platform.OS === 'ios') {
        options.push({
          text: 'Apple Maps',
          onPress: () => {
            showAlwaysUseDialog('apple', destination, label, resolve);
          }
        });
      }
      
      Alert.alert(
        'Mở ứng dụng bản đồ',
        'Chọn ứng dụng để điều hướng:',
        options
      );
    });
  } catch (error) {
    console.error('Error in smart navigate:', error);
    return false;
  }
};

// Show "Always use" dialog
const showAlwaysUseDialog = (appType, destination, label, resolve) => {
  const appName = appType === 'google' ? 'Google Maps' : 'Apple Maps';
  
  Alert.alert(
    `Mở ${appName}`,
    `Bạn có muốn luôn sử dụng ${appName} cho điều hướng không?`,
    [
      {
        text: 'Chỉ lần này',
        onPress: async () => {
          const success = appType === 'google' 
            ? await openGoogleMaps(destination, label)
            : await openAppleMaps(destination, label);
          resolve(success);
        }
      },
      {
        text: 'Luôn luôn sử dụng',
        onPress: async () => {
          // Save preference
          await saveMapPreference(appType, true);
          
          const success = appType === 'google' 
            ? await openGoogleMaps(destination, label)
            : await openAppleMaps(destination, label);
          resolve(success);
        }
      }
    ]
  );
};
export const openGoogleMaps = async (destination, label = '') => {
  const { latitude, longitude } = destination;
  const encodedLabel = encodeURIComponent(label);
  
  const googleMapsUrl = Platform.OS === 'ios' 
    ? `comgooglemaps://?daddr=${latitude},${longitude}&directionsmode=driving`
    : `google.navigation:q=${latitude},${longitude}&mode=d`;
  
  const webMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
  
  try {
    const canOpen = await Linking.canOpenURL(googleMapsUrl);
    if (canOpen) {
      await Linking.openURL(googleMapsUrl);
      return true;
    } else {
      // Fallback to web version
      await Linking.openURL(webMapsUrl);
      return true;
    }
  } catch (error) {
    console.error('Error opening Google Maps:', error);
    Alert.alert('Lỗi', 'Không thể mở Google Maps');
    return false;
  }
};

// Open Apple Maps (iOS only)
export const openAppleMaps = async (destination, label = '') => {
  if (Platform.OS !== 'ios') {
    Alert.alert('Lỗi', 'Apple Maps chỉ có trên iOS');
    return false;
  }

  const { latitude, longitude } = destination;
  const appleMapsUrl = `http://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`;
  
  try {
    await Linking.openURL(appleMapsUrl);
    return true;
  } catch (error) {
    console.error('Error opening Apple Maps:', error);
    Alert.alert('Lỗi', 'Không thể mở Apple Maps');
    return false;
  }
};

// Make phone call
export const makePhoneCall = async (phoneNumber, customerName = '') => {
  const phoneUrl = Platform.OS === 'ios' ? `tel:${phoneNumber}` : `tel:${phoneNumber}`;
  
  try {
    const canOpen = await Linking.canOpenURL(phoneUrl);
    if (canOpen) {
      await Linking.openURL(phoneUrl);
      return true;
    } else {
      Alert.alert('Lỗi', 'Không thể thực hiện cuộc gọi');
      return false;
    }
  } catch (error) {
    console.error('Error making phone call:', error);
    Alert.alert('Lỗi', 'Không thể thực hiện cuộc gọi');
    return false;
  }
};

// Calculate distance between two coordinates (Haversine formula)
export const calculateDistance = (coord1, coord2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
  const dLon = (coord2.longitude - coord1.longitude) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1.latitude * Math.PI / 180) * Math.cos(coord2.latitude * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
};

// Format distance for display
export const formatDistance = (distanceKm) => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  } else {
    return `${distanceKm.toFixed(1)}km`;
  }
};

// Estimate travel time (rough calculation)
export const estimateTravelTime = (distanceKm, mode = 'driving') => {
  const speeds = {
    driving: 30, // km/h average in city
    walking: 5,  // km/h
    cycling: 15, // km/h
  };
  
  const speed = speeds[mode] || speeds.driving;
  const timeHours = distanceKm / speed;
  const timeMinutes = Math.round(timeHours * 60);
  
  if (timeMinutes < 60) {
    return `${timeMinutes} phút`;
  } else {
    const hours = Math.floor(timeMinutes / 60);
    const minutes = timeMinutes % 60;
    return `${hours}h ${minutes}m`;
  }
};