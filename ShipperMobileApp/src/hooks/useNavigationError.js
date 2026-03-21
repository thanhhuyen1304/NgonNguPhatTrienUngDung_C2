import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';

/**
 * Hook to handle navigation errors gracefully
 */
const useNavigationError = () => {
  const navigation = useNavigation();

  useEffect(() => {
    // Add error boundary for navigation actions
    const originalGoBack = navigation.goBack;
    const originalNavigate = navigation.navigate;

    // Override goBack with error handling
    navigation.goBack = () => {
      try {
        if (navigation.canGoBack()) {
          originalGoBack();
        } else {
          console.warn('Cannot go back, navigating to main app');
          navigation.navigate('MainApp');
        }
      } catch (error) {
        console.error('Navigation goBack error:', error);
        navigation.navigate('MainApp');
      }
    };

    // Override navigate with error handling
    navigation.navigate = (name, params) => {
      try {
        originalNavigate(name, params);
      } catch (error) {
        console.error('Navigation navigate error:', error);
        // Fallback to main app if navigation fails
        originalNavigate('MainApp');
      }
    };

    // Cleanup on unmount
    return () => {
      navigation.goBack = originalGoBack;
      navigation.navigate = originalNavigate;
    };
  }, [navigation]);

  return navigation;
};

export default useNavigationError;