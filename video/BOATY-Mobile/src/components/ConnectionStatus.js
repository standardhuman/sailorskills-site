import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ConnectionStatus({ connected, cameraInfo }) {
  if (!connected) {
    return (
      <View style={[styles.container, styles.disconnected]}>
        <Text style={styles.statusText}>● Not Connected</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.connected]}>
      <Text style={styles.statusText}>● Connected</Text>
      {cameraInfo && (
        <Text style={styles.infoText}>
          {cameraInfo.modelName} - {cameraInfo.firmwareVersion}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 8
  },
  connected: {
    backgroundColor: '#E8F5E9'
  },
  disconnected: {
    backgroundColor: '#FFEBEE'
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000'
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4
  }
});