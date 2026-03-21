/**
 * Shipper Mobile App
 * Delivery Management System
 */

import React from 'react';
import { StatusBar, SafeAreaView } from 'react-native';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import store from './src/store';
import RootNavigator from './src/navigation/RootNavigator';

function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#3b82f6" />
        <RootNavigator />
      </SafeAreaProvider>
    </Provider>
  );
}

export default App;
