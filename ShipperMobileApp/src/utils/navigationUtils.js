/**
 * Navigation utility functions to handle safe navigation
 */

/**
 * Safely go back or navigate to a fallback screen
 * @param {object} navigation - React Navigation object
 * @param {string} fallbackScreen - Screen to navigate to if can't go back
 */
export const safeGoBack = (navigation, fallbackScreen = 'MainApp') => {
  if (navigation.canGoBack()) {
    navigation.goBack();
  } else {
    // If can't go back, navigate to main screen
    navigation.navigate(fallbackScreen);
  }
};

/**
 * Navigate with error handling
 * @param {object} navigation - React Navigation object
 * @param {string} screenName - Screen name to navigate to
 * @param {object} params - Navigation parameters
 */
export const safeNavigate = (navigation, screenName, params = {}) => {
  try {
    navigation.navigate(screenName, params);
  } catch (error) {
    console.error('Navigation error:', error);
    // Fallback to main app
    navigation.navigate('MainApp');
  }
};

/**
 * Reset navigation stack to a specific screen
 * @param {object} navigation - React Navigation object
 * @param {string} screenName - Screen name to reset to
 */
export const resetToScreen = (navigation, screenName) => {
  navigation.reset({
    index: 0,
    routes: [{ name: screenName }],
  });
};