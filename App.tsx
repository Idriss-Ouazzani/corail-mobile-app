/**
 * Corail - VTC Marketplace Mobile App
 * React Native + Expo + TypeScript
 */

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import SplashScreen from './src/screens/SplashScreen';
import AppNavigator from './src/navigation/AppNavigator';
import apiClient from './src/services/api';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialize app
    const initializeApp = async () => {
      try {
        // Set mock user ID for development
        // TODO: Replace with real auth flow (Firebase)
        apiClient.setUserId('501dd19d-af5f-4b00-870b-96dbcbe8671e'); // Hassan's ID
        
        // You can add more initialization here:
        // - Load cached data
        // - Check auth state
        // - Fetch initial app config
        
        setIsReady(true);
      } catch (error) {
        console.error('Error initializing app:', error);
        setIsReady(true); // Continue even if there's an error
      }
    };

    initializeApp();
  }, []);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  if (!isReady) {
    return null;
  }

  if (showSplash) {
    return (
      <>
        <StatusBar style="light" />
        <SplashScreen onFinish={handleSplashFinish} />
      </>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
