import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useDispatch, useSelector } from 'react-redux';
import { setUserFromCache, setupAuthEventListener, getMe, forceLogout } from '../store/slices/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useRealTimeOrders from '../hooks/useRealTimeOrders';
import { Alert } from 'react-native';

// Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ShipperRegistrationScreen from '../screens/auth/ShipperRegistrationScreen';
import DashboardScreen from '../screens/shipper/DashboardScreen';
import OrdersScreen from '../screens/shipper/OrdersScreen';
import RouteScreen from '../screens/shipper/RouteScreen';
import ShipperProfileScreen from '../screens/shipper/ProfileScreen';
import SplashScreen from '../screens/SplashScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import ShipperApplicationsScreen from '../screens/admin/ShipperApplicationsScreen';
import MapScreen from '../screens/MapScreen';
import MapSettingsScreen from '../screens/MapSettingsScreen';
import ErrorBoundary from '../components/ErrorBoundary';

// Icons
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack
const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
};

// Main App Tabs (for regular users - simplified for shipper app)
const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#6b7280',
        headerStyle: {
          backgroundColor: '#3b82f6',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      {/* Home/Dashboard */}
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" color={color} size={size} />
          ),
        }}
      />

      {/* Orders */}
      <Tab.Screen
        name="OrdersTab"
        component={OrdersScreen}
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, size }) => (
            <Icon name="clipboard-list" color={color} size={size} />
          ),
        }}
      />

      {/* Profile/Account */}
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Icon name="account" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Delivery Staff Tabs (for delivery personnel)
const DeliveryTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#6b7280',
        headerStyle: {
          backgroundColor: '#3b82f6',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
      }}
    >
      <Tab.Screen
        name="OrdersTab"
        component={OrdersScreen}
        options={{
          title: 'Đơn hàng',
          tabBarIcon: ({ color, size }) => (
            <Icon name="clipboard-list" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Icon name="view-dashboard" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="RouteTab"
        component={RouteScreen}
        options={{
          title: 'Lộ trình',
          tabBarIcon: ({ color, size }) => (
            <Icon name="map" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ShipperProfileScreen}
        options={{
          title: 'Hồ sơ',
          tabBarIcon: ({ color, size }) => (
            <Icon name="account" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const RootNavigator = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth);
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);
  const [navigationReady, setNavigationReady] = React.useState(false);

  // Initialize real-time orders for shippers
  useRealTimeOrders();

  // Global error handler for navigation
  const handleNavigationError = (error) => {
    console.error('Navigation error:', error);
    if (error.message && error.message.includes('GO_BACK')) {
      console.warn('GO_BACK action failed - navigation stack might be empty');
      // Don't show alert for GO_BACK errors as they're usually harmless
      return;
    }
    // For other navigation errors, you might want to show an alert or handle differently
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        const cachedUser = await AsyncStorage.getItem('user');
        
        if (token && cachedUser) {
          // Use cached user data immediately for better UX
          const userData = JSON.parse(cachedUser);
          dispatch(setUserFromCache(userData));
          console.log('Using cached user data:', userData.email, 'Role:', userData.role);
          
          // Verify token with server in background
          try {
            console.log('Verifying token with server...');
            await dispatch(getMe()).unwrap();
            console.log('Token verified successfully');
          } catch (verifyError) {
            console.log('Token verification failed:', verifyError.message || verifyError);
            // Token is invalid, clear auth state silently
            await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
            dispatch(forceLogout());
            // Don't show error for automatic token verification
            if (!verifyError.isAutoCheck && !verifyError.isTokenExpired) {
              console.error('Unexpected verification error:', verifyError);
            }
          }
        } else {
          console.log('No token or cached user found');
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [dispatch]);

  // Setup auth event listener
  useEffect(() => {
    const removeListener = setupAuthEventListener(dispatch);
    return removeListener; // Cleanup on unmount
  }, [dispatch]);

  // Listen for authentication changes to reset checking state
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      setIsCheckingAuth(false);
    }
  }, [isAuthenticated, loading]);

  if (isCheckingAuth) {
    return <SplashScreen />;
  }

  return (
    <ErrorBoundary>
      <NavigationContainer
        onStateChange={(state) => {
          // Log navigation state changes for debugging
          console.log('Navigation state changed');
        }}
        onReady={() => {
          console.log('Navigation container is ready');
          setNavigationReady(true);
        }}
        onUnhandledAction={(action) => {
          // Handle unhandled navigation actions
          console.warn('Unhandled navigation action:', action);
          if (action.type === 'GO_BACK') {
            console.warn('GO_BACK action was not handled - this is usually harmless');
          }
        }}
      >
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {isAuthenticated ? (
            // Main app with tabs
            <>
              <Stack.Screen name="MainApp">
                {() => (
                  user?.role === 'shipper' ? <DeliveryTabs /> : <MainTabs />
                )}
              </Stack.Screen>
              
              {/* Change Password Screen */}
              <Stack.Screen 
                name="ChangePassword" 
                component={ChangePasswordScreen}
                options={{
                  headerShown: false,
                  presentation: 'modal'
                }}
              />
              
              {/* Order Detail Screen - accessible from both user and shipper flows */}
              <Stack.Screen 
                name="OrderDetail" 
                component={OrderDetailScreen}
                options={{
                  headerShown: false,
                  presentation: 'modal'
                }}
              />
              
              {/* Admin Screens */}
              <Stack.Screen 
                name="ShipperApplications" 
                component={ShipperApplicationsScreen}
                options={{
                  headerShown: false,
                  presentation: 'modal'
                }}
              />
            </>
          ) : (
            // Auth screens
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
            </>
          )}
          {/* Global screens accessible from anywhere */}
          <Stack.Screen name="ShipperRegistration" component={ShipperRegistrationScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: true, title: 'Chỉnh sửa hồ sơ' }} />
          <Stack.Screen name="Map" component={MapScreen} options={{ headerShown: false }} />
          <Stack.Screen name="MapSettings" component={MapSettingsScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
  );
};

export default RootNavigator;
