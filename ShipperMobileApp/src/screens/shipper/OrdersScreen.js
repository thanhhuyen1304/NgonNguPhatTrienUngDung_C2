import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Image,
  RefreshControl,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapPreview from '../../components/MapPreview';
import shipperService from '../../services/shipperService';
import socketService from '../../services/socketService';
import { formatVND } from '../../utils/currency';
import { forceLogout } from '../../store/slices/authSlice';

// Mock orders data for users (their own orders)
const mockUserOrders = [
  {
    _id: '1',
    orderNumber: 'ORD-001',
    status: 'delivered',
    total: 99.99,
    orderDate: '2024-01-15',
    deliveryDate: '2024-01-18',
    items: [
      { 
        _id: '1',
        name: 'Wireless Headphones', 
        quantity: 1, 
        price: 79.99,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop'
      },
      { 
        _id: '2',
        name: 'Phone Case', 
        quantity: 1, 
        price: 19.99,
        image: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=100&h=100&fit=crop'
      }
    ],
    shippingAddress: {
      name: 'John Doe',
      phone: '0123456789',
      address: '123 Main St, District 1, Ho Chi Minh City'
    },
    paymentMethod: 'Credit Card',
    shippingFee: 5.00,
  },
  {
    _id: '2',
    orderNumber: 'ORD-002',
    status: 'in_transit',
    total: 149.99,
    orderDate: '2024-01-20',
    estimatedDelivery: '2024-01-25',
    items: [
      { 
        _id: '3',
        name: 'Bluetooth Speaker', 
        quantity: 1, 
        price: 149.99,
        image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=100&h=100&fit=crop'
      }
    ],
    shippingAddress: {
      name: 'John Doe',
      phone: '0123456789',
      address: '456 Oak Ave, District 3, Ho Chi Minh City'
    },
    paymentMethod: 'Cash on Delivery',
    shippingFee: 3.00,
  },
  {
    _id: '3',
    orderNumber: 'ORD-003',
    status: 'processing',
    total: 299.99,
    orderDate: '2024-01-22',
    estimatedDelivery: '2024-01-27',
    items: [
      { 
        _id: '4',
        name: 'Smart Watch', 
        quantity: 1, 
        price: 299.99,
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&h=100&fit=crop'
      }
    ],
    shippingAddress: {
      name: 'John Doe',
      phone: '0123456789',
      address: '789 Pine St, District 7, Ho Chi Minh City'
    },
    paymentMethod: 'E-Wallet',
    shippingFee: 4.00,
  },
];

// Mock orders data for shippers (orders to deliver)
const mockShipperOrders = [
  {
    _id: '1',
    orderNumber: 'ORD-260315-ABC123',
    user: { 
      _id: 'user1',
      name: 'John Doe', 
      phone: '0123456789',
      email: 'john@example.com',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop'
    },
    shippingAddress: {
      fullName: 'John Doe',
      phone: '0123456789',
      street: '123 Main St',
      city: 'Ho Chi Minh City',
      state: 'District 1',
      zipCode: '70000',
      country: 'Vietnam'
    },
    status: 'confirmed',
    totalPrice: 99.99,
    items: [
      { 
        _id: '1',
        product: 'prod1',
        name: 'Wireless Headphones', 
        quantity: 1, 
        price: 79.99,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop'
      },
      { 
        _id: '2',
        product: 'prod2',
        name: 'Phone Case', 
        quantity: 1, 
        price: 19.99,
        image: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=100&h=100&fit=crop'
      }
    ],
    distance: '2.5 km',
    estimatedTime: '15 phút',
    deliveryFee: 15.00,
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    _id: '2',
    orderNumber: 'ORD-260315-DEF456',
    user: { 
      _id: 'user2',
      name: 'Jane Smith', 
      phone: '0987654321',
      email: 'jane@example.com',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop'
    },
    shippingAddress: {
      fullName: 'Jane Smith',
      phone: '0987654321',
      street: '456 Oak Ave',
      city: 'Ho Chi Minh City',
      state: 'District 3',
      zipCode: '70000',
      country: 'Vietnam'
    },
    status: 'processing',
    totalPrice: 149.99,
    items: [
      { 
        _id: '3',
        product: 'prod3',
        name: 'Bluetooth Speaker', 
        quantity: 1, 
        price: 149.99,
        image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=100&h=100&fit=crop'
      }
    ],
    distance: '1.8 km',
    estimatedTime: '12 phút',
    deliveryFee: 12.00,
    createdAt: '2024-01-16T10:00:00Z',
  },
  {
    _id: '3',
    orderNumber: 'ORD-260315-GHI789',
    user: { 
      _id: 'user3',
      name: 'Mike Johnson', 
      phone: '0912345678',
      email: 'mike@example.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop'
    },
    shippingAddress: {
      fullName: 'Mike Johnson',
      phone: '0912345678',
      street: '789 Pine St',
      city: 'Ho Chi Minh City',
      state: 'District 7',
      zipCode: '70000',
      country: 'Vietnam'
    },
    status: 'shipped',
    totalPrice: 299.99,
    items: [
      { 
        _id: '4',
        product: 'prod4',
        name: 'Smart Watch', 
        quantity: 1, 
        price: 299.99,
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&h=100&fit=crop'
      }
    ],
    distance: '3.2 km',
    estimatedTime: '18 phút',
    deliveryFee: 18.00,
    createdAt: '2024-01-17T10:00:00Z',
  },
];

const OrdersScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const isShipper = user?.role === 'shipper';
  const [selectedTab, setSelectedTab] = useState(isShipper ? 'available' : 'all');
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]); // Store all orders for counting
  const [refreshing, setRefreshing] = useState(false);
  const [deliveryStartedOrders, setDeliveryStartedOrders] = useState(new Set()); // Track which orders have started delivery
  
  // Simple test function to load orders directly
  const testLoadOrders = async () => {
    try {
      console.log('🧪 Testing direct API call...');
      
      const { getApiUrl, getAlternativeApiUrls } = require('../../config/api');
      const primaryUrl = getApiUrl();
      const alternativeUrls = getAlternativeApiUrls();
      
      console.log('📡 Primary API URL:', primaryUrl);
      console.log('📡 Alternative URLs:', alternativeUrls);
      
      const token = await AsyncStorage.getItem('accessToken');
      console.log('🔑 Token exists:', !!token);
      
      if (!token) {
        Alert.alert('Lỗi', 'Không có token. Vui lòng đăng nhập lại.');
        return;
      }
      
      // Test all URLs to find which one works
      const urlsToTest = [primaryUrl, ...alternativeUrls];
      let workingUrl = null;
      
      for (const testUrl of urlsToTest) {
        try {
          console.log(`🔍 Testing URL: ${testUrl}`);
          
          const response = await fetch(`${testUrl}/orders/shipper/available`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            timeout: 5000
          });
          
          console.log(`📡 Response status for ${testUrl}:`, response.status);
          
          if (response.ok) {
            workingUrl = testUrl;
            const data = await response.json();
            console.log('✅ Working URL found:', workingUrl);
            console.log('✅ API Response:', JSON.stringify(data, null, 2));
            
            const orders = data.data?.orders || [];
            setAllOrders(orders);
            
            Alert.alert(
              'Test Thành Công',
              `URL hoạt động: ${workingUrl}\nTìm thấy ${orders.length} đơn hàng`,
              [{ text: 'OK' }]
            );
            return;
          }
        } catch (urlError) {
          console.log(`❌ URL ${testUrl} failed:`, urlError.message);
        }
      }
      
      if (!workingUrl) {
        Alert.alert(
          'Tất cả URL đều thất bại',
          'Không thể kết nối đến server với bất kỳ URL nào. Kiểm tra kết nối mạng.',
          [{ text: 'OK' }]
        );
      }
      
    } catch (error) {
      console.error('❌ Test error:', error);
      Alert.alert('Lỗi', error.message);
    }
  };

  // Load orders with better error handling
  const loadOrdersWithRetry = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      }

      console.log('🔄 Loading orders with retry...');
      
      // Check if user is authenticated
      if (!user || !user._id) {
        console.warn('❌ User not authenticated');
        setAllOrders([]);
        return;
      }

      if (isShipper) {
        const { getApiUrl } = require('../../config/api');
        const apiUrl = getApiUrl();
        const token = await AsyncStorage.getItem('accessToken');
        
        if (!token) {
          console.warn('❌ No access token found');
          Alert.alert(
            'Lỗi xác thực',
            'Không tìm thấy token đăng nhập. Vui lòng đăng nhập lại.',
            [
              {
                text: 'Đăng nhập lại',
                onPress: () => dispatch(forceLogout())
              }
            ]
          );
          return;
        }

        try {
          console.log('📞 Calling available orders API to get ALL orders...');
          // Fetch ALL orders with all statuses to match web admin
          const response = await fetch(`${apiUrl}/orders/shipper/available?status=pending,confirmed,processing,completed,shipped,delivered,cancelled&limit=100`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            timeout: 10000
          });
          
          console.log('📡 Response status:', response.status);
          
          if (response.status === 401 || response.status === 500) {
            // Check if it's a token expiration error
            const errorText = await response.text();
            console.log('🔍 Error response:', errorText);
            
            if (errorText.includes('Token expired') || errorText.includes('Not authorized') || response.status === 401) {
              console.log('🔄 Token expired detected, clearing auth data...');
              await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
              Alert.alert(
                'Phiên đăng nhập hết hạn',
                'Token đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.',
                [
                  {
                    text: 'Đăng nhập lại',
                    onPress: () => dispatch(forceLogout())
                  }
                ]
              );
              return;
            } else {
              // Other 500 error
              throw new Error(`Server Error: ${response.status} - ${errorText}`);
            }
          }
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API failed:', errorText);
            throw new Error(`API Error: ${response.status} - ${errorText}`);
          }
          
          const data = await response.json();
          console.log('✅ Available orders API Response:', JSON.stringify(data, null, 2));
          
          const orders = data.data?.orders || [];
          console.log('📦 Orders found:', orders.length);
          console.log('📦 Orders by status:', orders.reduce((acc, o) => {
            acc[o.status] = (acc[o.status] || 0) + 1;
            return acc;
          }, {}));
          
          setAllOrders(orders);
          
        } catch (fetchError) {
          console.error('❌ Fetch error:', fetchError);
          
          // More specific error messages
          let errorMessage = 'Không thể tải danh sách đơn hàng';
          if (fetchError.message.includes('Network request failed')) {
            errorMessage = `Lỗi kết nối mạng. Kiểm tra:\n• WiFi/4G có hoạt động?\n• Backend có chạy trên ${apiUrl}?\n• IP address có đúng không?`;
          } else if (fetchError.message.includes('timeout')) {
            errorMessage = 'Kết nối quá chậm. Vui lòng thử lại.';
          }
          
          Alert.alert(
            'Lỗi tải dữ liệu',
            errorMessage,
            [
              { text: 'Thử lại', onPress: () => loadOrdersWithRetry(true) },
              { text: 'OK' }
            ]
          );
          setAllOrders([]);
        }
      } else {
        console.log('👤 Regular user - setting empty orders');
        setAllOrders([]);
      }
    } catch (error) {
      console.error('❌ Error in loadOrdersWithRetry:', error);
      Alert.alert(
        'Lỗi',
        `Có lỗi xảy ra: ${error.message}`,
        [{ text: 'OK' }]
      );
      setAllOrders([]);
    } finally {
      setRefreshing(false);
    }
  };

  // Load orders from API
  const loadOrders = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      }

      console.log('Loading orders for tab:', selectedTab, 'isShipper:', isShipper);
      console.log('User:', user);

      // Check if user is authenticated
      if (!user || !user._id) {
        console.warn('User not authenticated');
        setAllOrders([]);
        return;
      }

      if (isShipper) {
        try {
          console.log('🚚 Loading orders for shipper...');
          console.log('📡 API Base URL:', shipperService.getApiUrl ? shipperService.getApiUrl() : 'Unknown');
          
          // Test basic connectivity first
          console.log('🔍 Testing API connectivity...');
          
          // Load all orders for shipper to calculate counts correctly
          const [availableResponse, myOrdersResponse] = await Promise.all([
            shipperService.getAvailableOrders({ 
              status: 'confirmed,processing,shipped,delivered',
              page: 1,
              limit: 100 
            }).catch(err => {
              console.error('❌ Available orders error:', err);
              console.error('❌ Error details:', {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status,
                config: {
                  url: err.config?.url,
                  method: err.config?.method,
                  headers: err.config?.headers
                }
              });
              return { success: false, error: err };
            }),
            shipperService.getShipperOrders({ 
              page: 1,
              limit: 100 
            }).catch(err => {
              console.error('❌ My orders error:', err);
              console.error('❌ Error details:', {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status,
                config: {
                  url: err.config?.url,
                  method: err.config?.method,
                  headers: err.config?.headers
                }
              });
              return { success: false, error: err };
            })
          ]);

          console.log('📊 Available orders response:', JSON.stringify(availableResponse, null, 2));
          console.log('📊 My orders response:', JSON.stringify(myOrdersResponse, null, 2));

          // Check if either response indicates token expiration
          if (availableResponse?.tokenExpired || myOrdersResponse?.tokenExpired) {
            console.log('🔄 Token expired detected, stopping execution');
            return;
          }

          if (availableResponse && availableResponse.success && myOrdersResponse && myOrdersResponse.success) {
            const availableOrders = availableResponse.data?.orders || [];
            const myOrders = myOrdersResponse.data?.orders || [];

            console.log('📦 Available orders count:', availableOrders.length);
            console.log('📦 Available orders details:', availableOrders.map(o => ({ id: o._id, orderNumber: o.orderNumber, status: o.status })));
            console.log('📦 My orders count:', myOrders.length);
            console.log('📦 My orders details:', myOrders.map(o => ({ id: o._id, orderNumber: o.orderNumber, status: o.status })));

            // Combine all orders and remove duplicates
            const allOrdersMap = new Map();
            [...availableOrders, ...myOrders].forEach(order => {
              if (order && order._id) {
                allOrdersMap.set(order._id, order);
                console.log('📝 Adding order to map:', order.orderNumber, 'Status:', order.status);
              }
            });
            const combinedOrders = Array.from(allOrdersMap.values());

            console.log('✅ Successfully loaded', combinedOrders.length, 'total orders from API');
            console.log('✅ Combined orders:', combinedOrders.map(o => ({ orderNumber: o.orderNumber, status: o.status })));
            setAllOrders(combinedOrders);
          } else {
            console.warn('❌ API returned success=false or no data');
            console.log('Available response:', availableResponse);
            console.log('My orders response:', myOrdersResponse);
            
            // Check if it's a network/auth error
            const availableError = availableResponse?.error;
            const myOrdersError = myOrdersResponse?.error;
            
            if (availableError?.message?.includes('Network Error') || myOrdersError?.message?.includes('Network Error')) {
              console.error('🌐 Network connectivity issue detected');
              Alert.alert(
                'Lỗi kết nối',
                'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và thử lại.',
                [{ text: 'OK' }]
              );
            } else if (availableError?.response?.status === 401 || myOrdersError?.response?.status === 401) {
              console.error('🔐 Authentication error detected');
              Alert.alert(
                'Lỗi xác thực',
                'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
                [{ text: 'OK' }]
              );
            }
            
            setAllOrders([]);
          }
        } catch (apiError) {
          console.error('❌ API call failed:', apiError);
          console.error('❌ API Error details:', {
            message: apiError.message,
            stack: apiError.stack,
            response: apiError.response?.data,
            status: apiError.response?.status
          });
          
          Alert.alert(
            'Lỗi tải dữ liệu',
            `Không thể tải danh sách đơn hàng: ${apiError.message}`,
            [{ text: 'OK' }]
          );
          
          setAllOrders([]);
        }
      } else {
        // For regular users, should also use API but for now set empty
        console.log('Regular user - setting empty orders');
        setAllOrders([]);
      }
    } catch (error) {
      console.error('❌ Error in loadOrders:', error);
      Alert.alert(
        'Lỗi',
        `Có lỗi xảy ra: ${error.message}`,
        [{ text: 'OK' }]
      );
      setAllOrders([]);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrdersWithRetry();

    if (isShipper) {
      // Listen for real-time updates via WebSocket
      const handleSocketUpdate = (data) => {
        console.log('🔄 Socket event received, reloading orders...', data);
        loadOrdersWithRetry(false); // Silent reload
      };

      socketService.on('new_order', handleSocketUpdate);
      socketService.on('order_status_updated', handleSocketUpdate);
      socketService.on('order_assigned', handleSocketUpdate);

      return () => {
        socketService.off('new_order', handleSocketUpdate);
        socketService.off('order_status_updated', handleSocketUpdate);
        socketService.off('order_assigned', handleSocketUpdate);
      };
    }
  }, [isShipper]); // Only reload when user role changes

  // Refresh data when screen comes into focus (returning from OrderDetail)
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 Screen focused, refreshing orders...');
      loadOrdersWithRetry();
    }, [])
  );

  useEffect(() => {
    // Filter orders when tab changes
    try {
      if (allOrders && allOrders.length > 0) {
        filterOrdersForTab();
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Error in useEffect:', error);
      setOrders([]);
    }
  }, [selectedTab, allOrders]);

  const filterOrdersForTab = () => {
    try {
      console.log('🔍 Filtering orders for tab:', selectedTab);
      console.log('🔍 All orders count:', allOrders?.length || 0);
      console.log('🔍 All orders:', allOrders?.map(o => ({ orderNumber: o.orderNumber, status: o.status })) || []);
      
      if (!allOrders || allOrders.length === 0) {
        console.log('❌ No orders to filter');
        setOrders([]);
        return;
      }

      if (isShipper) {
        let filteredOrders = [];
        if (selectedTab === 'available') {
          console.log('🔍 Filtering for available orders (status === "confirmed")');
          filteredOrders = allOrders.filter(order => {
            const isConfirmed = order && order.status === 'confirmed';
            console.log('🔍 Order', order?.orderNumber, 'status:', order?.status, 'isConfirmed:', isConfirmed);
            return isConfirmed;
          });
          console.log('✅ Available orders after filter:', filteredOrders.length);
        } else if (selectedTab === 'active') {
          console.log('🔍 Filtering for active orders (status in ["shipped"])');
          filteredOrders = allOrders.filter(order => {
            const isActive = order && ['shipped'].includes(order.status);
            console.log('🔍 Order', order?.orderNumber, 'status:', order?.status, 'isActive:', isActive);
            return isActive;
          });
          console.log('✅ Active orders after filter:', filteredOrders.length);
        } else if (selectedTab === 'completed') {
          console.log('🔍 Filtering for completed orders (status === "delivered")');
          filteredOrders = allOrders.filter(order => {
            const isCompleted = order && order.status === 'delivered';
            console.log('🔍 Order', order?.orderNumber, 'status:', order?.status, 'isCompleted:', isCompleted);
            return isCompleted;
          });
          console.log('✅ Completed orders after filter:', filteredOrders.length);
        } else if (selectedTab === 'my-orders') {
          console.log('🔍 Filtering for my orders (shipper._id === user._id)');
          filteredOrders = allOrders.filter(order => {
            const isMyOrder = order && order.shipper?._id === user?._id;
            console.log('🔍 Order', order?.orderNumber, 'shipper:', order?.shipper?._id, 'user:', user?._id, 'isMyOrder:', isMyOrder);
            return isMyOrder;
          });
          console.log('✅ My orders after filter:', filteredOrders.length);
        } else {
          console.log('🔍 Unknown tab, showing empty orders');
          filteredOrders = [];
        }
        console.log('🎯 Setting filtered orders:', filteredOrders.map(o => ({ orderNumber: o.orderNumber, status: o.status })));
        setOrders(filteredOrders || []);
      } else {
        console.log('👤 Regular user - setting all orders');
        setOrders(allOrders || []);
      }
    } catch (error) {
      console.error('Error filtering orders:', error);
      setOrders([]);
    }
  };

  const onRefresh = () => {
    loadOrdersWithRetry(true);
  };

  // Handle order status update by shipper
  const handleUpdateOrderStatus = async (order, newStatus) => {
    try {
      const statusMessages = {
        'processing': 'Nhận đơn hàng',
        'shipped': 'Bắt đầu giao hàng', 
        'delivered': 'Hoàn thành giao hàng',
        'cancelled': 'Hủy đơn hàng'
      };

      const message = statusMessages[newStatus] || 'Cập nhật trạng thái';
      
      Alert.alert(
        'Xác nhận',
        `${message} ${order.orderNumber}?`,
        [
          { text: 'Hủy', style: 'cancel' },
          { 
            text: 'Xác nhận', 
            onPress: async () => {
              try {
                const response = await shipperService.updateOrderByShipper(order._id, {
                  status: newStatus,
                  note: `${message} bởi ${user.name}`,
                });
                
                if (response.success) {
                  Alert.alert('Thành công', response.message);
                  loadOrders(); // Refresh orders
                } else {
                  Alert.alert('Lỗi', response.message || 'Không thể cập nhật trạng thái');
                }
              } catch (error) {
                console.error('Error updating order status:', error);
                Alert.alert('Lỗi', error.message || 'Không thể cập nhật trạng thái đơn hàng');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error in handleUpdateOrderStatus:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi cập nhật trạng thái');
    }
  };

  // Handle start delivery - marks order as delivery started without changing status
  const handleStartDelivery = async (order) => {
    try {
      Alert.alert(
        'Xác nhận',
        `Bắt đầu giao hàng ${order.orderNumber}?`,
        [
          { text: 'Hủy', style: 'cancel' },
          { 
            text: 'Xác nhận', 
            onPress: () => {
              // Mark this order as delivery started
              setDeliveryStartedOrders(prev => new Set([...prev, order._id]));
              Alert.alert('Thành công', 'Đã bắt đầu giao hàng. Bạn có thể hoàn thành đơn hàng khi giao xong.');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error in handleStartDelivery:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra');
    }
  };
  
  // Get tab configuration based on user role
  const getTabConfig = () => {
    console.log('🏷️ Getting tab config for isShipper:', isShipper);
    console.log('🏷️ All orders for tab config:', allOrders?.map(o => ({ orderNumber: o.orderNumber, status: o.status })) || []);
    
    if (isShipper) {
      // Match web admin exactly
      const pendingOrders = allOrders.filter(o => o.status === 'pending');
      const confirmedOrders = allOrders.filter(o => o.status === 'confirmed');
      const activeOrders = allOrders.filter(o => ['shipped'].includes(o.status)); // Same as web admin "Đang giao"
      const deliveredOrders = allOrders.filter(o => o.status === 'delivered'); // Same as web admin "Đã giao"
      const cancelledOrders = allOrders.filter(o => o.status === 'cancelled');
      
      // My orders - orders assigned to this shipper
      const myOrders = allOrders.filter(o => o.shipper?._id === user?._id);
      
      console.log('🏷️ Pending orders count:', pendingOrders.length, pendingOrders.map(o => o.orderNumber));
      console.log('🏷️ Confirmed orders count:', confirmedOrders.length, confirmedOrders.map(o => o.orderNumber));
      console.log('🏷️ Active (shipped) orders count:', activeOrders.length, activeOrders.map(o => o.orderNumber));
      console.log('🏷️ Delivered orders count:', deliveredOrders.length, deliveredOrders.map(o => o.orderNumber));
      console.log('🏷️ Cancelled orders count:', cancelledOrders.length, cancelledOrders.map(o => o.orderNumber));
      console.log('🏷️ My orders count:', myOrders.length, myOrders.map(o => o.orderNumber));
      
      return [
        { key: 'available', label: 'Chờ lấy hàng', count: confirmedOrders.length }, // Only confirmed orders available for pickup
        { key: 'active', label: 'Đang giao', count: activeOrders.length }, // shipped (matches web admin)
        { key: 'completed', label: 'Đã giao', count: deliveredOrders.length }, // Only delivered orders (matches web admin)
        { key: 'my-orders', label: 'Của tôi', count: myOrders.length }, // Orders assigned to this shipper
      ];
    } else {
      return [
        { key: 'all', label: 'Tất cả', count: allOrders.length },
        { key: 'pending', label: 'Chờ xử lý', count: allOrders.filter(o => ['pending', 'processing'].includes(o.status)).length },
        { key: 'active', label: 'Đang giao', count: allOrders.filter(o => ['in_progress', 'in_transit'].includes(o.status)).length },
      ];
    }
  };
  
  const tabConfig = getTabConfig();

  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending':
        return {
          color: '#f59e0b',
          bgColor: '#fef3c7',
          icon: 'clock-outline',
          text: 'Chờ xử lý'
        };
      case 'confirmed':
        return {
          color: '#3b82f6',
          bgColor: '#dbeafe',
          icon: 'check-outline',
          text: 'Chờ lấy hàng'
        };
      case 'processing':
        return {
          color: '#f59e0b',
          bgColor: '#fef3c7',
          icon: 'truck-delivery',
          text: 'Đang giao'
        };
      case 'completed':
        return {
          color: '#8b5cf6',
          bgColor: '#e9d5ff',
          icon: 'truck-fast',
          text: 'Hoàn thành'
        };
      case 'shipped':
        return {
          color: '#8b5cf6',
          bgColor: '#e9d5ff',
          icon: 'truck-fast',
          text: 'Đang vận chuyển'
        };
      case 'in_progress':
        return {
          color: '#8b5cf6',
          bgColor: '#e9d5ff',
          icon: 'truck-delivery',
          text: 'Đang giao'
        };
      case 'in_transit':
        return {
          color: '#8b5cf6',
          bgColor: '#e9d5ff',
          icon: 'truck-fast',
          text: 'Đang vận chuyển'
        };
      case 'delivered':
        return {
          color: '#10b981',
          bgColor: '#d1fae5',
          icon: 'check-circle',
          text: 'Đã giao'
        };
      case 'cancelled':
        return {
          color: '#ef4444',
          bgColor: '#fee2e2',
          icon: 'close-circle',
          text: 'Đã hủy'
        };
      default:
        return {
          color: '#6b7280',
          bgColor: '#f3f4f6',
          icon: 'package',
          text: status
        };
    }
  };

  const handleOrderPress = (order) => {
    console.log('Order pressed:', order);
    console.log('Order source:', order._id?.length > 10 ? 'API' : 'Mock');
    
    navigation.navigate('OrderDetail', { 
      order, 
      isShipper
    });
  };

  const handleQuickAction = (order, action) => {
    switch (action) {
      case 'accept':
        Alert.alert(
          'Nhận đơn hàng',
          `Bạn có muốn nhận đơn hàng ${order.orderNumber}?`,
          [
            { text: 'Hủy', style: 'cancel' },
            { text: 'Nhận đơn', onPress: () => console.log('Accept order:', order._id) }
          ]
        );
        break;
      case 'cancel':
        Alert.alert(
          'Hủy đơn hàng',
          `Bạn có chắc muốn hủy đơn hàng ${order.orderNumber}?`,
          [
            { text: 'Không', style: 'cancel' },
            { text: 'Hủy đơn', style: 'destructive', onPress: () => console.log('Cancel order:', order._id) }
          ]
        );
        break;
      case 'track':
        navigation.navigate('Tracking', { order });
        break;
    }
  };

  // Render order for users (their own orders)
  const renderUserOrder = ({ item }) => {
    const statusConfig = getStatusConfig(item.status);
    
    return (
      <TouchableOpacity 
        style={styles.orderCard}
        onPress={() => handleOrderPress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardContainer}>
          {/* Order Header */}
          <View style={styles.orderHeader}>
            <View style={styles.orderTitleSection}>
              <Text style={styles.orderNumber}>{item.orderNumber}</Text>
              <Text style={styles.orderDate}>{item.orderDate}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
              <Icon name={statusConfig.icon} size={14} color={statusConfig.color} />
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.text}
              </Text>
            </View>
          </View>

          {/* Product Preview */}
          <View style={styles.productSection}>
            <View style={styles.productImages}>
              {item.items.slice(0, 3).map((product, index) => (
                <View key={product._id} style={[styles.productImageContainer, { zIndex: 3 - index }]}>
                  <Image 
                    source={{ uri: product.image }} 
                    style={styles.productImage}
                    defaultSource={{ uri: 'https://via.placeholder.com/40x40/e5e7eb/9ca3af?text=?' }}
                  />
                </View>
              ))}
              {item.items.length > 3 && (
                <View style={styles.moreItemsIndicator}>
                  <Text style={styles.moreItemsText}>+{item.items.length - 3}</Text>
                </View>
              )}
            </View>
            <View style={styles.productInfo}>
              <Text style={styles.productCount}>
                {item.items.length} sản phẩm
              </Text>
              <Text style={styles.orderTotal}>{formatVND(item.total || 0)}</Text>
            </View>
          </View>

          {/* Delivery Info */}
          <View style={styles.deliverySection}>
            <View style={styles.deliveryRow}>
              <Icon name="map-marker-outline" size={16} color="#6b7280" />
              <Text style={styles.deliveryText} numberOfLines={1}>
                {item.shippingAddress.address}
              </Text>
            </View>
            {item.estimatedDelivery && (
              <View style={styles.deliveryRow}>
                <Icon name="truck-outline" size={16} color="#6b7280" />
                <Text style={styles.deliveryText}>
                  Dự kiến: {item.estimatedDelivery}
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => handleOrderPress(item)}
            >
              <Icon name="eye-outline" size={16} color="#ffffff" />
              <Text style={styles.primaryButtonText}>Xem chi tiết</Text>
            </TouchableOpacity>
            
            {item.status === 'delivered' && (
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={() => console.log('Review order:', item._id)}
              >
                <Icon name="star-outline" size={16} color="#f59e0b" />
                <Text style={styles.secondaryButtonText}>Đánh giá</Text>
              </TouchableOpacity>
            )}
            
            {(item.status === 'pending' || item.status === 'processing') && (
              <TouchableOpacity 
                style={styles.dangerButton}
                onPress={() => handleQuickAction(item, 'cancel')}
              >
                <Icon name="close" size={16} color="#ef4444" />
                <Text style={styles.dangerButtonText}>Hủy đơn</Text>
              </TouchableOpacity>
            )}
            
            {item.status === 'in_transit' && (
              <TouchableOpacity 
                style={styles.trackButton}
                onPress={() => handleQuickAction(item, 'track')}
              >
                <Icon name="map-marker-path" size={16} color="#8b5cf6" />
                <Text style={styles.trackButtonText}>Theo dõi</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render order for shippers (orders to deliver)
  const renderShipperOrder = ({ item }) => {
    const statusConfig = getStatusConfig(item.status);
    
    // Debug log to check actual status
    console.log(`🔍 Rendering order ${item.orderNumber} with status: ${item.status}`);
    
    // Handle both API format and mock format
    const customer = item.user || item.customer || {};
    const customerName = customer.name || 'Khách hàng';
    const customerAvatar = customer.avatar || 'https://via.placeholder.com/24x24/e5e7eb/9ca3af?text=?';
    const address = item.shippingAddress?.street + ', ' + item.shippingAddress?.city || item.address || 'Địa chỉ giao hàng';
    const totalPrice = item.totalPrice || item.total || 0;
    
    return (
      <TouchableOpacity 
        style={styles.orderCard}
        onPress={() => handleOrderPress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardContainer}>
          {/* Order Header */}
          <View style={styles.orderHeader}>
            <View style={styles.orderTitleSection}>
              <Text style={styles.orderNumber}>{item.orderNumber}</Text>
              <View style={styles.customerRow}>
                <Image 
                  source={{ uri: customerAvatar }} 
                  style={styles.customerAvatar}
                  defaultSource={{ uri: 'https://via.placeholder.com/24x24/e5e7eb/9ca3af?text=?' }}
                />
                <Text style={styles.customerName}>
                  {customerName}
                </Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
              <Icon name={statusConfig.icon} size={14} color={statusConfig.color} />
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.text}
              </Text>
            </View>
          </View>

          {/* Delivery Details */}
          <View style={styles.deliverySection}>
            <View style={styles.deliveryRow}>
              <Icon name="map-marker" size={16} color="#ef4444" />
              <Text style={styles.deliveryText} numberOfLines={2}>
                {address}
              </Text>
            </View>
            <View style={styles.deliveryMetrics}>
              <View style={styles.metricItem}>
                <Icon name="road-variant" size={14} color="#6b7280" />
                <Text style={styles.metricText}>{item.distance || '2.5 km'}</Text>
              </View>
              <View style={styles.metricItem}>
                <Icon name="clock-outline" size={14} color="#6b7280" />
                <Text style={styles.metricText}>{item.estimatedTime || '15 phút'}</Text>
              </View>
              <View style={styles.metricItem}>
                <Icon name="cash-multiple" size={14} color="#10b981" />
                <Text style={[styles.metricText, { color: '#10b981', fontWeight: '600' }]}>
                  {formatVND(totalPrice || 0)}
                </Text>
              </View>
            </View>
            
            {/* Map Preview for in_progress orders */}
            <MapPreview 
              order={item} 
              onPress={() => navigation.navigate('Map', { order: item })}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            {item.status === 'confirmed' && (
              <TouchableOpacity 
                style={styles.acceptButton}
                onPress={() => handleUpdateOrderStatus(item, 'shipped')}
              >
                <Icon name="check" size={14} color="#ffffff" />
                <Text style={styles.acceptButtonText}>Nhận đơn</Text>
              </TouchableOpacity>
            )}
            
            {item.status === 'shipped' && !deliveryStartedOrders.has(item._id) && (
              <TouchableOpacity 
                style={styles.shipButton}
                onPress={() => handleStartDelivery(item)}
              >
                <Icon name="truck" size={14} color="#ffffff" />
                <Text style={styles.shipButtonText}>Bắt đầu giao</Text>
              </TouchableOpacity>
            )}
            
            {item.status === 'shipped' && deliveryStartedOrders.has(item._id) && (
              <TouchableOpacity 
                style={styles.deliverButton}
                onPress={() => handleUpdateOrderStatus(item, 'delivered')}
              >
                <Icon name="check-circle" size={14} color="#ffffff" />
                <Text style={styles.deliverButtonText}>Hoàn thành</Text>
              </TouchableOpacity>
            )}
            
            {item.status === 'delivered' && (
              <View style={styles.completedIndicator}>
                <Icon name="check-circle" size={16} color="#10b981" />
                <Text style={styles.completedText}>Đơn hàng đã hoàn thành</Text>
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.compactButton}
              onPress={() => handleOrderPress(item)}
            >
              <Icon name="eye-outline" size={18} color="#3b82f6" />
            </TouchableOpacity>
            
            {['shipped'].includes(item.status) && (
              <>
                <TouchableOpacity 
                  style={styles.compactButton}
                  onPress={() => navigation.navigate('Map', { order: item })}
                >
                  <Icon name="map" size={18} color="#8b5cf6" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.compactButton}
                  onPress={() => console.log('Call customer:', customer.phone || '0123456789')}
                >
                  <Icon name="phone" size={18} color="#10b981" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTabBar = () => (
    <View style={styles.tabContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabBar}
      >
        {tabConfig.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, selectedTab === tab.key && styles.activeTab]}
            onPress={() => setSelectedTab(tab.key)}
          >
            <Text style={[styles.tabText, selectedTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
            <View style={[styles.tabBadge, selectedTab === tab.key && styles.activeTabBadge]}>
              <Text style={[styles.tabBadgeText, selectedTab === tab.key && styles.activeTabBadgeText]}>
                {tab.count}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-left" size={24} color="#ffffff" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.title}>
                {isShipper ? 'Đơn hàng' : 'Đơn của tôi'}
              </Text>
              <Text style={styles.subtitle}>
                {isShipper ? 'Quản lý giao hàng' : 'Lịch sử mua hàng'}
              </Text>
            </View>
            
            {isShipper ? (
              <View style={styles.headerActions}>
                <TouchableOpacity 
                  style={styles.debugButton}
                  onPress={testLoadOrders}
                >
                  <Icon name="bug" size={20} color="#ffffff" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.refreshButton}
                  onPress={onRefresh}
                >
                  <Icon name="refresh" size={24} color="#ffffff" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={onRefresh}
              >
                <Icon name="refresh" size={24} color="#ffffff" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {renderTabBar()}

      <FlatList
        data={orders}
        renderItem={isShipper ? renderShipperOrder : renderUserOrder}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.ordersList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3b82f6']}
            tintColor="#3b82f6"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyContent}>
              <Icon name="clipboard-list-outline" size={80} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>
                {isShipper ? 'Không có đơn hàng' : 'Chưa có đơn hàng nào'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {isShipper 
                  ? 'Kiểm tra lại sau để có đơn hàng mới' 
                  : 'Hãy mua sắm để tạo đơn hàng đầu tiên'
                }
              </Text>
            </View>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 0,
    backgroundColor: '#3b82f6',
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  debugButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tabBar: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  activeTab: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  activeTabText: {
    color: '#ffffff',
  },
  tabBadge: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  activeTabBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  activeTabBadgeText: {
    color: '#ffffff',
  },
  ordersList: {
    padding: 16,
    paddingBottom: 100,
  },
  orderCard: {
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    backgroundColor: '#ffffff',
  },
  cardContainer: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#ffffff',
    borderWidth: 0.5,
    borderColor: '#e2e8f0',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderTitleSection: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 6,
  },
  orderDate: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  customerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  customerName: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  productSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#e2e8f0',
  },
  productImages: {
    flexDirection: 'row',
    marginRight: 16,
  },
  productImageContainer: {
    marginLeft: -8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  productImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  moreItemsIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  moreItemsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  productInfo: {
    flex: 1,
  },
  productCount: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  deliverySection: {
    marginBottom: 16,
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  deliveryText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  deliveryMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  metricText: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 6,
    fontWeight: '500',
  },
  actionSection: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
    minWidth: 70,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  compactButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#fbbf24',
    gap: 4,
  },
  secondaryButtonText: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '600',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fca5a5',
    gap: 8,
  },
  dangerButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e9d5ff',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#c4b5fd',
    gap: 8,
  },
  trackButtonText: {
    color: '#8b5cf6',
    fontSize: 14,
    fontWeight: '600',
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
    maxWidth: 140,
  },
  acceptButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6ee7b7',
    gap: 8,
  },
  callButtonText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8b5cf6',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    flex: 1,
  },
  mapButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  shipButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f59e0b',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
    maxWidth: 140,
  },
  shipButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  deliverButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
    maxWidth: 140,
  },
  deliverButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  completedIndicator: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d1fae5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
    maxWidth: 180,
  },
  completedText: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyContent: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 24,
    width: '100%',
    backgroundColor: '#f8fafc',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#475569',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default OrdersScreen;