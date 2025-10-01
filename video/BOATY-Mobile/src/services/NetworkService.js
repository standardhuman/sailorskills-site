import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

class NetworkService {
  constructor() {
    this.currentNetworkType = null;
    this.isConnected = false;
    this.listeners = [];
    this.dataUsage = {
      total: 0,
      today: 0,
      lastReset: Date.now()
    };
  }

  /**
   * Initialize network monitoring
   */
  async init() {
    // Load saved data usage
    await this.loadDataUsage();

    // Subscribe to network state changes
    this.unsubscribe = NetInfo.addEventListener(state => {
      this.currentNetworkType = state.type;
      this.isConnected = state.isConnected;

      // Notify listeners
      this.listeners.forEach(listener => {
        listener({
          type: state.type,
          isConnected: state.isConnected,
          details: state.details
        });
      });
    });

    // Get initial state
    const state = await NetInfo.fetch();
    this.currentNetworkType = state.type;
    this.isConnected = state.isConnected;

    // Reset daily data usage if needed
    this.checkDailyReset();
  }

  /**
   * Clean up subscriptions
   */
  cleanup() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  /**
   * Add network state change listener
   */
  addListener(callback) {
    this.listeners.push(callback);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Get current network state
   */
  async getNetworkState() {
    const state = await NetInfo.fetch();
    return {
      type: state.type,
      isConnected: state.isConnected,
      isCellular: state.type === 'cellular',
      isWifi: state.type === 'wifi',
      details: state.details
    };
  }

  /**
   * Check if currently on cellular
   */
  isCellular() {
    return this.currentNetworkType === 'cellular';
  }

  /**
   * Check if currently on WiFi
   */
  isWifi() {
    return this.currentNetworkType === 'wifi';
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return this.isConnected;
  }

  /**
   * Track data usage
   */
  async trackDataUsage(bytes) {
    this.dataUsage.total += bytes;
    this.dataUsage.today += bytes;

    // Save to storage
    await this.saveDataUsage();
  }

  /**
   * Get data usage statistics
   */
  getDataUsage() {
    return {
      total: this.dataUsage.total,
      today: this.dataUsage.today,
      totalFormatted: this.formatBytes(this.dataUsage.total),
      todayFormatted: this.formatBytes(this.dataUsage.today)
    };
  }

  /**
   * Reset daily data usage counter
   */
  async resetDailyUsage() {
    this.dataUsage.today = 0;
    this.dataUsage.lastReset = Date.now();
    await this.saveDataUsage();
  }

  /**
   * Reset all data usage
   */
  async resetAllUsage() {
    this.dataUsage = {
      total: 0,
      today: 0,
      lastReset: Date.now()
    };
    await this.saveDataUsage();
  }

  /**
   * Check if daily reset is needed (midnight rollover)
   */
  checkDailyReset() {
    const lastReset = new Date(this.dataUsage.lastReset);
    const now = new Date();

    // Check if different day
    if (
      lastReset.getDate() !== now.getDate() ||
      lastReset.getMonth() !== now.getMonth() ||
      lastReset.getFullYear() !== now.getFullYear()
    ) {
      this.resetDailyUsage();
    }
  }

  /**
   * Load saved data usage from storage
   */
  async loadDataUsage() {
    try {
      const saved = await AsyncStorage.getItem('network_data_usage');
      if (saved) {
        this.dataUsage = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load data usage:', error);
    }
  }

  /**
   * Save data usage to storage
   */
  async saveDataUsage() {
    try {
      await AsyncStorage.setItem('network_data_usage', JSON.stringify(this.dataUsage));
    } catch (error) {
      console.error('Failed to save data usage:', error);
    }
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get network indicator for UI
   */
  getNetworkIndicator() {
    if (!this.isConnected) {
      return { icon: '📡', text: 'No Connection', color: '#FF3B30' };
    }

    switch (this.currentNetworkType) {
      case 'wifi':
        return { icon: '📶', text: 'WiFi', color: '#34C759' };
      case 'cellular':
        return { icon: '📱', text: 'Cellular', color: '#FF9500' };
      case 'ethernet':
        return { icon: '🔌', text: 'Ethernet', color: '#34C759' };
      default:
        return { icon: '❓', text: 'Unknown', color: '#8E8E93' };
    }
  }

  /**
   * Get optimal chunk size based on network type
   */
  getOptimalChunkSize() {
    if (this.isCellular()) {
      return 512 * 1024; // 512KB for cellular
    }
    return 1024 * 1024; // 1MB for WiFi
  }

  /**
   * Check if upload should be allowed based on network and settings
   */
  shouldAllowUpload(allowCellular = false) {
    if (!this.isConnected) {
      return { allowed: false, reason: 'No internet connection' };
    }

    if (this.isCellular() && !allowCellular) {
      return { allowed: false, reason: 'Cellular uploads disabled in settings' };
    }

    return { allowed: true };
  }
}

// Export singleton instance
const networkService = new NetworkService();
export default networkService;
