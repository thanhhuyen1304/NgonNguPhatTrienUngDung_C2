import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Geolocation from '@react-native-community/geolocation';
import { 
  geocodeAddress, 
  openGoogleMaps, 
  openAppleMaps, 
  makePhoneCall,
  smartNavigate
} from '../services/mapService';
import { formatVND } from '../utils/currency';

const { width, height } = Dimensions.get('window');

const MapScreen = ({ navigation, route }) => {
  const { order } = route.params;
  
  // Debug logging to check order data
  console.log('🗺️ MapScreen - Order data:', JSON.stringify(order, null, 2));
  
  // Ensure order data has fallback values and proper VND conversion
  const orderData = {
    ...order,
    distance: order.distance || '2.5 km',
    estimatedTime: order.estimatedTime || '15 phút',
    deliveryLocation: order.deliveryLocation || order.address || 
      (order.shippingAddress?.street && order.shippingAddress?.city ? 
        order.shippingAddress.street + ', ' + order.shippingAddress.city : 
        'Địa chỉ giao hàng'),
    pickupLocation: order.pickupLocation || order.pickupAddress || 'Store ABC, 456 Nguyen Hue St',
  };
  
  // Handle delivery fee with VND conversion - improved detection
  let deliveryFee = order.deliveryFee || order.shippingFee || 15.00;
  if (deliveryFee > 0 && deliveryFee < 1000) {
    console.log('💰 MapScreen - Converting delivery fee from USD to VND:', deliveryFee, '→', deliveryFee * 24500);
    deliveryFee = deliveryFee * 24500; // Convert USD to VND
  }
  orderData.deliveryFee = deliveryFee;
  
  // Handle customer phone from multiple sources
  const customerPhone = order.user?.phone || 
                       order.customer?.phone || 
                       order.shippingAddress?.phone || 
                       order.customerPhone ||
                       order.phone ||
                       '0123456789';
  orderData.customerPhone = customerPhone;
  
  console.log('🗺️ MapScreen - Processed order data:', {
    deliveryFee: orderData.deliveryFee,
    customerPhone: orderData.customerPhone,
    deliveryLocation: orderData.deliveryLocation
  });
  
  // Calculate distance between two coordinates
  const calculateDistance = (coord1, coord2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
    const dLon = (coord2.longitude - coord1.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(coord1.latitude * Math.PI / 180) * Math.cos(coord2.latitude * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  };

  // Calculate total route distance and estimated time
  const calculateRouteInfo = (coordinates) => {
    if (coordinates.length < 2) return { distance: 0, duration: 0 };
    
    let totalDistance = 0;
    for (let i = 0; i < coordinates.length - 1; i++) {
      totalDistance += calculateDistance(coordinates[i], coordinates[i + 1]);
    }
    
    // Estimate duration (assuming average speed of 30 km/h in city)
    const estimatedDuration = (totalDistance / 30) * 60; // in minutes
    
    return {
      distance: totalDistance.toFixed(1),
      duration: Math.round(estimatedDuration)
    };
  };
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapRegion, setMapRegion] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [pickupCoords, setPickupCoords] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [routeInfo, setRouteInfo] = useState({ distance: null, duration: null });
  const [watchId, setWatchId] = useState(null);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    initializeMap();
    
    // Start real-time tracking for orders in delivery status
    const deliveryStatuses = ['shipped', 'in_progress', 'in_transit'];
    if (deliveryStatuses.includes(orderData.status)) {
      startLocationTracking();
    }
    
    // Cleanup on unmount
    return () => {
      stopLocationTracking();
    };
  }, []);

  // Start real-time location tracking
  const startLocationTracking = () => {
    console.log('🎯 Starting real-time location tracking...');
    setIsTracking(true);
    
    const watchId = Geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newLocation = { latitude, longitude };
        
        console.log('📍 Location updated:', newLocation);
        setCurrentLocation(newLocation);
        
        // Update route with new location
        updateRouteWithNewLocation(newLocation);
      },
      (error) => {
        console.error('Location tracking error:', error);
        // Continue with last known location
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000, // Accept location up to 5 seconds old
        distanceFilter: 10, // Update only when moved 10 meters
      }
    );
    
    setWatchId(watchId);
  };

  // Stop location tracking
  const stopLocationTracking = () => {
    if (watchId !== null) {
      console.log('🛑 Stopping location tracking...');
      Geolocation.clearWatch(watchId);
      setWatchId(null);
      setIsTracking(false);
    }
  };

  // Update route when location changes
  const updateRouteWithNewLocation = (newLocation) => {
    if (pickupCoords || destinationCoords) {
      const route = [];
      route.push(newLocation);
      if (pickupCoords) route.push(pickupCoords);
      if (destinationCoords) route.push(destinationCoords);
      setRouteCoordinates(route);
      
      // Calculate route info
      const info = calculateRouteInfo(route);
      setRouteInfo(info);
      console.log('🗺️ Route updated with new location:', info);
      
      // Send location update to server (for admin tracking)
      sendLocationUpdate(newLocation);
    }
  };

  // Send location update to server
  const sendLocationUpdate = async (location) => {
    try {
      // Only send updates for orders in delivery status
      const deliveryStatuses = ['shipped', 'in_progress', 'in_transit'];
      if (!deliveryStatuses.includes(orderData.status)) {
        return;
      }

      console.log('📡 Sending location update to server:', location);
      
      // TODO: Implement API call to update shipper location
      // await shipperService.updateLocation(orderData._id, location);
      
    } catch (error) {
      console.error('Failed to send location update:', error);
      // Don't show error to user - this is background operation
    }
  };



  const initializeMap = async () => {
    try {
      // Get coordinates for addresses - support both formats
      const deliveryAddress = orderData.deliveryLocation;
      const pickupAddress = orderData.pickupLocation;
      
      console.log('🗺️ MapScreen - Initializing map with addresses:');
      console.log('📍 Delivery address:', deliveryAddress);
      console.log('📍 Pickup address:', pickupAddress);
      console.log('🔍 Order data for debugging:', {
        orderNumber: order.orderNumber,
        status: order.status,
        shippingAddress: order.shippingAddress,
        address: order.address,
        deliveryLocation: order.deliveryLocation
      });
      
      let destCoords;
      if (order.shippingAddress?.latitude && order.shippingAddress?.longitude) {
        destCoords = {
          latitude: Number(order.shippingAddress.latitude),
          longitude: Number(order.shippingAddress.longitude)
        };
        console.log('📍 Using exact coordinates from order shippingAddress:', destCoords);
      } else {
        destCoords = await geocodeAddress(deliveryAddress);
        console.log('📍 Geocoded destination coordinates:', destCoords);
      }
      
      const pickupCoords = await geocodeAddress(pickupAddress);
      
      console.log('📍 Final destination coordinates:', destCoords);
      console.log('📍 Final pickup coordinates:', pickupCoords);
      
      // Validate coordinates are reasonable for Ho Chi Minh City area
      if (destCoords.latitude < 10.5 || destCoords.latitude > 11.0 || 
          destCoords.longitude < 106.0 || destCoords.longitude > 107.0) {
        console.warn('⚠️ Destination coordinates seem outside HCM area:', destCoords);
      }
      
      setDestinationCoords(destCoords);
      setPickupCoords(pickupCoords);
      
      // Get current location and create route
      getCurrentLocation(destCoords, pickupCoords);
    } catch (error) {
      console.error('Error initializing map:', error);
      setLoading(false);
    }
  };

  const getCurrentLocation = (destCoords, pickupCoords) => {
    // Get initial location
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const location = { latitude, longitude };
        setCurrentLocation(location);
        
        // Create initial route coordinates
        const route = [];
        route.push(location); // Current location
        if (pickupCoords) {
          route.push(pickupCoords); // Pickup location
        }
        if (destCoords) {
          route.push(destCoords); // Destination
        }
        setRouteCoordinates(route);
        
        // Calculate initial route info
        const info = calculateRouteInfo(route);
        setRouteInfo(info);
        
        // Set map region to show all points
        if (destCoords) {
          const allCoords = [location, destCoords];
          if (pickupCoords) allCoords.push(pickupCoords);
          
          const minLat = Math.min(...allCoords.map(c => c.latitude));
          const maxLat = Math.max(...allCoords.map(c => c.latitude));
          const minLng = Math.min(...allCoords.map(c => c.longitude));
          const maxLng = Math.max(...allCoords.map(c => c.longitude));
          
          setMapRegion({
            latitude: (minLat + maxLat) / 2,
            longitude: (minLng + maxLng) / 2,
            latitudeDelta: (maxLat - minLat) * 1.5 + 0.01,
            longitudeDelta: (maxLng - minLng) * 1.5 + 0.01,
          });
        }
        
        setLoading(false);
      },
      (error) => {
        console.log('Initial location error:', error);
        // Use pickup location if GPS fails, or default to District 1
        const defaultLocation = pickupCoords || { latitude: 10.7769, longitude: 106.7009 };
        setCurrentLocation(defaultLocation);
        
        // Create route with default location
        const route = [defaultLocation];
        if (pickupCoords) route.push(pickupCoords);
        if (destCoords) route.push(destCoords);
        setRouteCoordinates(route);
        
        const info = calculateRouteInfo(route);
        setRouteInfo(info);
        
        setMapRegion({
          ...defaultLocation,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        });
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const handleCallCustomer = () => {
    const customerName = orderData.user?.name || 
                        orderData.customer?.name || 
                        orderData.shippingAddress?.name || 
                        orderData.shippingAddress?.fullName ||
                        orderData.customerName ||
                        'Khách hàng';
    const customerPhone = orderData.customerPhone;
    
    console.log('📞 Calling customer:', { customerName, customerPhone });
    
    if (!customerPhone || customerPhone === '0123456789') {
      Alert.alert('Lỗi', 'Không có số điện thoại khách hàng');
      return;
    }
    
    Alert.alert(
      'Gọi khách hàng',
      `Gọi cho ${customerName}?\n${customerPhone}`,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Gọi', 
          onPress: () => makePhoneCall(customerPhone, customerName)
        }
      ]
    );
  };

  const handleNavigate = async () => {
    if (!destinationCoords) {
      Alert.alert('Lỗi', 'Không thể xác định địa chỉ giao hàng');
      return;
    }

    const destination = {
      latitude: destinationCoords.latitude,
      longitude: destinationCoords.longitude,
      address: orderData.deliveryLocation
    };

    await smartNavigate(destination);
  };

  const handleUpdateStatus = () => {
    const statusOptions = [
      { text: 'Hủy', style: 'cancel' },
    ];

    if (order.status === 'pending') {
      statusOptions.push(
        { text: 'Nhận đơn', onPress: () => updateOrderStatus('accepted') },
        { text: 'Từ chối', onPress: () => updateOrderStatus('rejected') }
      );
    } else if (order.status === 'accepted' || order.status === 'in_progress') {
      statusOptions.push(
        { text: 'Đã lấy hàng', onPress: () => updateOrderStatus('picked_up') },
        { text: 'Đang giao hàng', onPress: () => updateOrderStatus('in_transit') },
        { text: 'Đã giao thành công', onPress: () => updateOrderStatus('delivered') }
      );
    }

    Alert.alert(
      'Cập nhật trạng thái',
      `Đơn hàng: ${order.orderNumber}\nTrạng thái hiện tại: ${getStatusText(order.status)}`,
      statusOptions
    );
  };

  const updateOrderStatus = (newStatus) => {
    Alert.alert(
      'Xác nhận',
      `Cập nhật trạng thái đơn hàng thành "${getStatusText(newStatus)}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xác nhận', 
          onPress: () => {
            // TODO: Call API to update order status
            console.log('Updating order status to:', newStatus);
            Alert.alert('Thành công', 'Đã cập nhật trạng thái đơn hàng!');
          }
        }
      ]
    );
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'Chờ xử lý',
      'accepted': 'Đã nhận',
      'in_progress': 'Đang giao',
      'picked_up': 'Đã lấy hàng',
      'in_transit': 'Đang vận chuyển',
      'delivered': 'Đã giao',
      'rejected': 'Đã từ chối'
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Đang tải bản đồ...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{order.orderNumber}</Text>
          <Text style={styles.headerSubtitle}>
            {isTracking ? '📍 Đang theo dõi vị trí' : (
              order.user?.name || 
              order.customer?.name || 
              order.shippingAddress?.name || 
              order.shippingAddress?.fullName ||
              order.customerName ||
              'Khách hàng'
            )}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={() => {
            if (destinationCoords) {
              setMapRegion({
                ...destinationCoords,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              });
            }
          }}
        >
          <Icon name="crosshairs-gps" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Map */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={mapRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsTraffic={true}
      >
        {/* Current Location Marker */}
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            title="Vị trí của bạn"
            description={isTracking ? "Đang theo dõi real-time" : "Shipper"}
          >
            <View style={[
              styles.currentLocationMarker,
              isTracking && styles.trackingMarker
            ]}>
              <Icon name="account" size={20} color="#ffffff" />
              {isTracking && (
                <View style={styles.trackingIndicator}>
                  <View style={styles.trackingPulse} />
                </View>
              )}
            </View>
          </Marker>
        )}

        {/* Pickup Location Marker */}
        {pickupCoords && (
          <Marker
            coordinate={pickupCoords}
            title="Điểm lấy hàng"
            description={order.pickupLocation || order.pickupAddress}
          >
            <View style={styles.pickupMarker}>
              <Icon name="store" size={20} color="#ffffff" />
            </View>
          </Marker>
        )}

        {/* Destination Marker - Make it more prominent with debugging info */}
        {destinationCoords && (
          <Marker
            coordinate={destinationCoords}
            title="🎯 Điểm giao hàng"
            description={`${order.deliveryLocation || order.address}\nTọa độ: ${destinationCoords.latitude.toFixed(6)}, ${destinationCoords.longitude.toFixed(6)}`}
          >
            <View style={styles.destinationMarker}>
              <View style={styles.destinationMarkerInner}>
                <Icon name="map-marker" size={24} color="#ffffff" />
              </View>
              <View style={styles.destinationMarkerPulse} />
            </View>
          </Marker>
        )}

        {/* Route Polyline */}
        {routeCoordinates.length >= 2 && (
          <>
            <Polyline
              coordinates={routeCoordinates}
              strokeColor="#3b82f6"
              strokeWidth={4}
              lineDashPattern={[10, 5]}
              lineJoin="round"
              lineCap="round"
            />
            {console.log('🗺️ Rendering route polyline with', routeCoordinates.length, 'coordinates')}
          </>
        )}
        
        {/* Alternative route with different style for pickup to destination */}
        {pickupCoords && destinationCoords && (
          <Polyline
            coordinates={[pickupCoords, destinationCoords]}
            strokeColor="#10b981"
            strokeWidth={3}
            lineDashPattern={[15, 10]}
            lineJoin="round"
            lineCap="round"
          />
        )}
      </MapView>

      {/* Floating Action Button - Center on Destination */}
      {destinationCoords && (
        <TouchableOpacity 
          style={styles.centerDestinationButton}
          onPress={() => {
            setMapRegion({
              ...destinationCoords,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            });
          }}
        >
          <Icon name="target" size={24} color="#ffffff" />
        </TouchableOpacity>
      )}

      {/* Order Info Card */}
      <View style={styles.orderInfoCard}>
        <View style={styles.orderInfoHeader}>
          <Text style={styles.orderInfoTitle}>Thông tin đơn hàng</Text>
          <View style={styles.statusBadge}>
            <Icon name="truck-delivery" size={14} color="#8b5cf6" />
            <Text style={styles.statusText}>Đang giao</Text>
          </View>
        </View>
        
        <View style={styles.orderInfoContent}>
          <View style={styles.infoRow}>
            <Icon name="map-marker" size={16} color="#ef4444" />
            <Text style={styles.infoText} numberOfLines={2}>
              {orderData.deliveryLocation}
            </Text>
          </View>
          
          {/* Debug info for coordinates */}
          {destinationCoords && __DEV__ && (
            <View style={styles.infoRow}>
              <Icon name="crosshairs-gps" size={16} color="#6b7280" />
              <Text style={[styles.infoText, { fontSize: 12, color: '#9ca3af' }]}>
                Tọa độ: {destinationCoords.latitude.toFixed(6)}, {destinationCoords.longitude.toFixed(6)}
              </Text>
            </View>
          )}
          
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Icon name="road-variant" size={14} color="#6b7280" />
              <Text style={styles.metricText}>
                {routeInfo.distance ? `${routeInfo.distance} km` : orderData.distance}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Icon name="clock-outline" size={14} color="#6b7280" />
              <Text style={styles.metricText}>
                {routeInfo.duration ? `${routeInfo.duration} phút` : orderData.estimatedTime}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Icon name="currency-usd" size={14} color="#10b981" />
              <Text style={[styles.metricText, { color: '#10b981', fontWeight: '600' }]}>
                {formatVND(orderData.deliveryFee || 0)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.callButton}
          onPress={handleCallCustomer}
        >
          <Icon name="phone" size={20} color="#ffffff" />
          <Text style={styles.buttonText}>Gọi</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navigateButton}
          onPress={handleNavigate}
        >
          <Icon name="navigation" size={20} color="#ffffff" />
          <Text style={styles.buttonText}>Điều hướng</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.trackingButton, isTracking && styles.trackingButtonActive]}
          onPress={() => {
            if (isTracking) {
              stopLocationTracking();
            } else {
              startLocationTracking();
            }
          }}
        >
          <Icon name={isTracking ? "crosshairs-gps" : "crosshairs"} size={20} color="#ffffff" />
          <Text style={styles.buttonText}>
            {isTracking ? "Đang theo dõi" : "Theo dõi"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    flex: 1,
  },
  currentLocationMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  pickupMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  destinationMarker: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#ffffff',
    elevation: 8,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  destinationMarkerInner: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  destinationMarkerPulse: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#ef4444',
    opacity: 0.2,
    top: -10,
    left: -10,
  },
  orderInfoCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  orderInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e9d5ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  orderInfoContent: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },
  callButton: {
    flex: 1,
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  navigateButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  trackingButton: {
    flex: 1,
    backgroundColor: '#6b7280',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  trackingButtonActive: {
    backgroundColor: '#10b981',
  },
  trackingMarker: {
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  trackingIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  trackingPulse: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10b981',
    opacity: 0.3,
  },
  centerDestinationButton: {
    position: 'absolute',
    top: 120,
    right: 16,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default MapScreen;