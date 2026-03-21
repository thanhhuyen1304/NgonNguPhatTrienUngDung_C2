import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { AppState } from 'react-native';

const useRealTimeOrders = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const intervalRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  const isShipper = user?.role === 'shipper';

  // Simplified polling function
  const pollForUpdates = async () => {
    if (!isAuthenticated || !isShipper) return;

    try {
      console.log('Polling for order updates...');
      // In a real app, this would refresh order data
      // For now, just log that we're polling
    } catch (error) {
      console.log('Polling error:', error);
    }
  };

  // Start polling
  const startPolling = () => {
    if (intervalRef.current) return;

    // Poll every 30 seconds for new orders
    intervalRef.current = setInterval(pollForUpdates, 30000);
  };

  // Stop polling
  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Handle app state changes
  const handleAppStateChange = (nextAppState) => {
    if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
      // App came to foreground, refresh orders
      if (isAuthenticated && isShipper) {
        pollForUpdates();
        startPolling();
      }
    } else if (nextAppState.match(/inactive|background/)) {
      // App went to background, stop polling
      stopPolling();
    }

    appStateRef.current = nextAppState;
  };

  useEffect(() => {
    if (isAuthenticated && isShipper) {
      // Start polling when user is authenticated shipper
      startPolling();

      // Listen for app state changes
      const subscription = AppState.addEventListener('change', handleAppStateChange);

      return () => {
        stopPolling();
        subscription?.remove();
      };
    } else {
      stopPolling();
    }
  }, [isAuthenticated, isShipper]);

  // Manual refresh function
  const refreshOrders = () => {
    if (isAuthenticated && isShipper) {
      pollForUpdates();
    }
  };

  return {
    refreshOrders,
    isPolling: !!intervalRef.current,
  };
};

export default useRealTimeOrders;