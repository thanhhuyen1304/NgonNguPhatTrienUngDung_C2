import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

const useRoleBasedRouting = () => {
  const navigation = useNavigation();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Role-based routing logic
      if (user.role === 'shipper') {
        // For shippers, redirect to awaiting pickup orders on login
        const currentRoute = navigation.getState()?.routes?.[navigation.getState()?.index]?.name;
        
        // Only redirect if not already on a shipper-specific screen
        if (!currentRoute?.includes('Shipper') && !currentRoute?.includes('Order')) {
          navigation.navigate('OrdersTab');
        }
      } else if (user.role === 'admin') {
        // For admins, redirect to admin dashboard
        navigation.navigate('ShipperApplications');
      }
      // Regular users stay on the default home screen
    }
  }, [user, isAuthenticated, navigation]);

  // Return role-based navigation helpers
  const navigateToRoleHome = () => {
    if (!user) return;

    switch (user.role) {
      case 'shipper':
        navigation.navigate('OrdersTab');
        break;
      case 'admin':
        navigation.navigate('ShipperApplications');
        break;
      default:
        navigation.navigate('HomeTab');
        break;
    }
  };

  const getRoleHomeScreen = () => {
    if (!user) return 'HomeTab';

    switch (user.role) {
      case 'shipper':
        return 'AwaitingPickupOrders';
      case 'admin':
        return 'ShipperApplications';
      default:
        return 'HomeTab';
    }
  };

  const isShipper = user?.role === 'shipper';
  const isAdmin = user?.role === 'admin';
  const isRegularUser = user?.role === 'user' || !user?.role;

  return {
    navigateToRoleHome,
    getRoleHomeScreen,
    isShipper,
    isAdmin,
    isRegularUser,
    userRole: user?.role,
  };
};

export default useRoleBasedRouting;