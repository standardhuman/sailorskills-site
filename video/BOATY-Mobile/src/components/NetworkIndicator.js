import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import networkService from '../services/NetworkService';

export default function NetworkIndicator({ showDataUsage = false }) {
  const [networkInfo, setNetworkInfo] = useState(null);
  const [dataUsage, setDataUsage] = useState(null);

  useEffect(() => {
    // Initialize network service
    networkService.init();

    // Get initial state
    updateNetworkInfo();
    if (showDataUsage) {
      updateDataUsage();
    }

    // Subscribe to network changes
    const unsubscribe = networkService.addListener(() => {
      updateNetworkInfo();
    });

    // Update data usage every 5 seconds
    let interval;
    if (showDataUsage) {
      interval = setInterval(updateDataUsage, 5000);
    }

    return () => {
      unsubscribe();
      if (interval) clearInterval(interval);
    };
  }, [showDataUsage]);

  async function updateNetworkInfo() {
    const state = await networkService.getNetworkState();
    const indicator = networkService.getNetworkIndicator();
    setNetworkInfo({ ...state, ...indicator });
  }

  function updateDataUsage() {
    const usage = networkService.getDataUsage();
    setDataUsage(usage);
  }

  if (!networkInfo) return null;

  return (
    <View style={styles.container}>
      <View style={styles.networkInfo}>
        <Text style={styles.icon}>{networkInfo.icon}</Text>
        <Text style={[styles.text, { color: networkInfo.color }]}>
          {networkInfo.text}
        </Text>
      </View>

      {showDataUsage && dataUsage && (
        <View style={styles.dataUsage}>
          <Text style={styles.dataText}>
            Today: {dataUsage.todayFormatted}
          </Text>
          <Text style={styles.dataText}>
            Total: {dataUsage.totalFormatted}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12
  },
  networkInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  icon: {
    fontSize: 20,
    marginRight: 8
  },
  text: {
    fontSize: 16,
    fontWeight: '600'
  },
  dataUsage: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  dataText: {
    fontSize: 12,
    color: '#666'
  }
});
