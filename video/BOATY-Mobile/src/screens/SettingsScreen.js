import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import uploadManager from '../services/UploadManager';
import networkService from '../services/NetworkService';
import NetworkIndicator from '../components/NetworkIndicator';

export default function SettingsScreen() {
  const { mode, isDark, setTheme, colors } = useTheme();
  const [allowCellular, setAllowCellular] = useState(false);
  const [dataUsage, setDataUsage] = useState(null);

  useEffect(() => {
    loadSettings();
    updateDataUsage();

    // Update data usage every 10 seconds
    const interval = setInterval(updateDataUsage, 10000);
    return () => clearInterval(interval);
  }, []);

  async function loadSettings() {
    try {
      const saved = await AsyncStorage.getItem('allow_cellular_uploads');
      if (saved !== null) {
        const value = JSON.parse(saved);
        setAllowCellular(value);
        uploadManager.setAllowCellular(value);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  async function handleCellularToggle(value) {
    try {
      setAllowCellular(value);
      uploadManager.setAllowCellular(value);
      await AsyncStorage.setItem('allow_cellular_uploads', JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save setting:', error);
    }
  }

  function updateDataUsage() {
    const usage = networkService.getDataUsage();
    setDataUsage(usage);
  }

  function handleResetDailyUsage() {
    Alert.alert(
      'Reset Daily Usage',
      'Reset today\'s data usage counter?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: async () => {
            await networkService.resetDailyUsage();
            updateDataUsage();
          }
        }
      ]
    );
  }

  function handleResetTotalUsage() {
    Alert.alert(
      'Reset All Usage',
      'Reset all data usage tracking? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await networkService.resetAllUsage();
            updateDataUsage();
          }
        }
      ]
    );
  }

  function getThemeDisplayName() {
    switch(mode) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'system': return 'System';
      default: return 'System';
    }
  }

  function handleThemePress() {
    Alert.alert(
      'Appearance',
      'Choose your preferred theme',
      [
        { text: 'Light', onPress: () => setTheme('light') },
        { text: 'Dark', onPress: () => setTheme('dark') },
        { text: 'System', onPress: () => setTheme('system') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>

        <TouchableOpacity
          style={[styles.settingRow, { backgroundColor: colors.surface }]}
          onPress={handleThemePress}
        >
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Theme</Text>
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
              {getThemeDisplayName()}
            </Text>
          </View>
          <Text style={[styles.settingValue, { color: colors.textSecondary }]}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Network</Text>

        <NetworkIndicator showDataUsage={true} />

        <View style={[styles.settingRow, { backgroundColor: colors.surface }]}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Allow Cellular Uploads</Text>
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
              Upload videos over cellular data when WiFi is unavailable
            </Text>
          </View>
          <Switch
            value={allowCellular}
            onValueChange={handleCellularToggle}
            trackColor={{ false: '#E0E0E0', true: '#34C759' }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Data Usage</Text>

        {dataUsage && (
          <View style={[styles.usageCard, { backgroundColor: colors.surface }]}>
            <View style={styles.usageRow}>
              <Text style={[styles.usageLabel, { color: colors.textSecondary }]}>Today</Text>
              <Text style={[styles.usageValue, { color: colors.text }]}>{dataUsage.todayFormatted}</Text>
            </View>
            <View style={styles.usageRow}>
              <Text style={[styles.usageLabel, { color: colors.textSecondary }]}>Total (All Time)</Text>
              <Text style={[styles.usageValue, { color: colors.text }]}>{dataUsage.totalFormatted}</Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.resetButton, { backgroundColor: colors.primary }]}
          onPress={handleResetDailyUsage}
        >
          <Text style={styles.resetButtonText}>Reset Daily Usage</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.resetButton, styles.dangerButton, { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' }]}
          onPress={handleResetTotalUsage}
        >
          <Text style={[styles.resetButtonText, styles.dangerButtonText]}>
            Reset All Usage
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
        <View style={[styles.aboutCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.appName, { color: colors.text }]}>BOATY Mobile</Text>
          <Text style={[styles.appVersion, { color: colors.textSecondary }]}>Version 1.0.0</Text>
          <Text style={[styles.appDescription, { color: colors.textSecondary }]}>
            Boat video workflow from GoPro to YouTube
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  section: {
    padding: 16,
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12
  },
  settingRow: {
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  settingInfo: {
    flex: 1,
    marginRight: 12
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4
  },
  settingDescription: {
    fontSize: 14,
    lineHeight: 18
  },
  settingValue: {
    fontSize: 20,
    fontWeight: '300'
  },
  usageCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12
  },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8
  },
  usageLabel: {
    fontSize: 16
  },
  usageValue: {
    fontSize: 18,
    fontWeight: '600'
  },
  resetButton: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12
  },
  resetButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600'
  },
  dangerButton: {
    borderWidth: 1,
    borderColor: '#FF3B30'
  },
  dangerButtonText: {
    color: '#FF3B30'
  },
  aboutCard: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center'
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4
  },
  appVersion: {
    fontSize: 14,
    marginBottom: 12
  },
  appDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20
  }
});