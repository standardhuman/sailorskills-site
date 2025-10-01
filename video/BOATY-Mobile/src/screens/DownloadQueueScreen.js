import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import database from '../services/VideoDatabase';
import downloadManager from '../services/DownloadManager';

export default function DownloadQueueScreen() {
  const [downloads, setDownloads] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadDownloads();

    // Refresh every 2 seconds while downloads are active
    const interval = setInterval(loadDownloads, 2000);
    return () => clearInterval(interval);
  }, []);

  async function loadDownloads() {
    try {
      const queue = await database.getDownloadQueue();
      setDownloads(queue);

      const status = await downloadManager.getQueueStatus();
      setStats(status);
    } catch (error) {
      console.error('Failed to load downloads:', error);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadDownloads();
    setRefreshing(false);
  }

  async function handleCancelDownload(downloadId) {
    try {
      await downloadManager.cancelDownload(downloadId);
      await loadDownloads();
    } catch (error) {
      console.error('Failed to cancel download:', error);
    }
  }

  async function handleClearCompleted() {
    try {
      await downloadManager.clearCompleted();
      await loadDownloads();
    } catch (error) {
      console.error('Failed to clear completed:', error);
    }
  }

  function getStatusColor(status) {
    switch (status) {
      case 'downloading': return '#007AFF';
      case 'completed': return '#34C759';
      case 'failed': return '#FF3B30';
      case 'paused': return '#FF9500';
      default: return '#8E8E93';
    }
  }

  function getStatusLabel(status) {
    switch (status) {
      case 'downloading': return 'Downloading';
      case 'completed': return 'Completed';
      case 'failed': return 'Failed';
      case 'paused': return 'Paused';
      case 'pending': return 'Pending';
      default: return status;
    }
  }

  function renderDownload({ item }) {
    const progress = item.progress_percent || 0;
    const statusColor = getStatusColor(item.status);

    return (
      <View style={styles.downloadCard}>
        <View style={styles.downloadInfo}>
          <Text style={styles.downloadName} numberOfLines={1}>
            {item.gopro_filename}
          </Text>

          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={styles.statusText}>
              {getStatusLabel(item.status)}
            </Text>
            <Text style={styles.progressText}>
              {progress.toFixed(0)}%
            </Text>
          </View>

          {item.status === 'downloading' && (
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${progress}%` }]} />
            </View>
          )}

          {item.error_message && (
            <Text style={styles.errorText} numberOfLines={2}>
              Error: {item.error_message}
            </Text>
          )}
        </View>

        {(item.status === 'downloading' || item.status === 'pending') && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancelDownload(item.id)}
          >
            <Text style={styles.cancelButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (downloads.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No downloads in queue</Text>
        <Text style={styles.emptySubtext}>
          Connect to your GoPro and select videos to download
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.active}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.failed}</Text>
            <Text style={styles.statLabel}>Failed</Text>
          </View>
        </View>
      )}

      <FlatList
        data={downloads}
        renderItem={renderDownload}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />

      {stats && stats.completed > 0 && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClearCompleted}
        >
          <Text style={styles.clearButtonText}>Clear Completed</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    padding: 20
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center'
  },
  statsContainer: {
    backgroundColor: '#FFF',
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0'
  },
  statItem: {
    flex: 1,
    alignItems: 'center'
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000'
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4
  },
  listContent: {
    padding: 16
  },
  downloadCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center'
  },
  downloadInfo: {
    flex: 1
  },
  downloadName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    flex: 1
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000'
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden'
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 3
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4
  },
  cancelButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12
  },
  cancelButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold'
  },
  clearButton: {
    backgroundColor: '#007AFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  clearButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600'
  }
});