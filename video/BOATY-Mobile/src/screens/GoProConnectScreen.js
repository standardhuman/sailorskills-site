import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';
import goProService from '../services/GoProService';
import ConnectionStatus from '../components/ConnectionStatus';

export default function GoProConnectScreen({ navigation }) {
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [cameraInfo, setCameraInfo] = useState(null);
  const [cameraStatus, setCameraStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  async function checkConnection() {
    setLoading(true);
    try {
      const isConnected = await goProService.testConnection();
      setConnected(isConnected);

      if (isConnected) {
        await loadCameraInfo();
      }
    } catch (error) {
      console.error('Connection check failed:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadCameraInfo() {
    try {
      const info = await goProService.getCameraInfo();
      setCameraInfo(info);

      const status = await goProService.getCameraStatus();
      setCameraStatus(status);
    } catch (error) {
      console.error('Failed to load camera info:', error);
    }
  }

  async function handleConnect() {
    setConnecting(true);
    try {
      // Since we can't programmatically connect to WiFi in Expo,
      // we just test if the connection exists
      Alert.alert(
        'Connect to GoPro WiFi',
        'Please connect to your GoPro WiFi network in your device settings, then tap Test Connection.',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Test Connection',
            onPress: async () => {
              const isConnected = await goProService.testConnection();
              if (isConnected) {
                await loadCameraInfo();
                setConnected(true);
                Alert.alert('Success', 'Connected to GoPro!');
              } else {
                Alert.alert('Error', 'Could not connect to GoPro. Make sure you are connected to the GoPro WiFi network.');
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setConnecting(false);
    }
  }

  function handleBrowseMedia() {
    if (!connected) {
      Alert.alert('Not Connected', 'Please connect to GoPro first');
      return;
    }
    navigation.navigate('GoProBrowser');
  }

  function handleDisconnect() {
    goProService.disconnect();
    setConnected(false);
    setCameraInfo(null);
    setCameraStatus(null);
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Checking connection...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>GoPro Connection</Text>

      <ConnectionStatus connected={connected} cameraInfo={cameraInfo} />

      {cameraStatus && (
        <View style={styles.statusCard}>
          <Text style={styles.cardTitle}>Camera Status</Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Battery:</Text>
            <Text style={styles.statusValue}>{cameraStatus.battery}%</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>SD Card:</Text>
            <Text style={styles.statusValue}>
              {cameraStatus.sdCard ? 'Inserted' : 'Missing'}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Recording:</Text>
            <Text style={styles.statusValue}>
              {cameraStatus.recording ? 'Yes' : 'No'}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>Instructions:</Text>
        <Text style={styles.instructionsText}>
          1. Turn on your GoPro camera{'\n'}
          2. Enable WiFi on the camera{'\n'}
          3. Connect your phone to the GoPro WiFi network{'\n'}
          4. Tap "Connect to GoPro" below
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        {!connected ? (
          <TouchableOpacity
            style={styles.button}
            onPress={handleConnect}
            disabled={connecting}
          >
            {connecting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Connect to GoPro</Text>
            )}
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={styles.button}
              onPress={handleBrowseMedia}
            >
              <Text style={styles.buttonText}>Browse Media</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={checkConnection}
            >
              <Text style={styles.buttonTextSecondary}>Refresh Status</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonDanger]}
              onPress={handleDisconnect}
            >
              <Text style={styles.buttonText}>Disconnect</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7'
  },
  content: {
    padding: 20
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666'
  },
  statusCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginVertical: 12
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE'
  },
  statusLabel: {
    fontSize: 16,
    color: '#666'
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000'
  },
  instructions: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginVertical: 12
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22
  },
  buttonContainer: {
    marginTop: 20
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12
  },
  buttonSecondary: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#007AFF'
  },
  buttonDanger: {
    backgroundColor: '#FF3B30'
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600'
  },
  buttonTextSecondary: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: '600'
  }
});