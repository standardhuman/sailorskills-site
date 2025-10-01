import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { ThemeProvider } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import database from './src/services/VideoDatabase';
import notificationService from './src/services/NotificationService';
import networkService from './src/services/NetworkService';

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize database
        await database.init();
        console.log('Database initialized');

        // Request notification permissions
        await notificationService.requestPermissions();
        console.log('Notification permissions requested');

        // Initialize network service
        await networkService.init();
        console.log('Network service initialized');
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsReady(true);
      }
    }

    prepare();
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading BOATY...</Text>
      </View>
    );
  }

  return (
    <ThemeProvider>
      <AppNavigator />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666'
  }
});
