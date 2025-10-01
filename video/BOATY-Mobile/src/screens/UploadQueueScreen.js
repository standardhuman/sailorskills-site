import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native';
import database from '../services/VideoDatabase';
import uploadManager from '../services/UploadManager';
import youtubeService from '../services/YouTubeService';
import NetworkIndicator from '../components/NetworkIndicator';

export default function UploadQueueScreen() {
  const [uploads, setUploads] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
    loadUploads();

    // Refresh every 2 seconds while uploads are active
    const interval = setInterval(loadUploads, 2000);
    return () => clearInterval(interval);
  }, []);

  async function checkAuth() {
    await youtubeService.init();
    setIsAuthenticated(youtubeService.isAuthenticated());
  }

  async function loadUploads() {
    try {
      const queue = await database.getUploadQueue();
      setUploads(queue);

      const status = await uploadManager.getQueueStatus();
      setStats(status);
    } catch (error) {
      console.error('Failed to load uploads:', error);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await checkAuth();
    await loadUploads();
    setRefreshing(false);
  }

  async function handleSignIn() {
    try {
      const success = await youtubeService.authenticate();
      if (success) {
        setIsAuthenticated(true);
        Alert.alert('Success', 'Signed in to YouTube');
      }
    } catch (error) {
      Alert.alert('Error', `Sign in failed: ${error.message}`);
    }
  }

  async function handleSignOut() {
    Alert.alert(
      'Sign Out',
      'Sign out of YouTube?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          onPress: async () => {
            await youtubeService.signOut();
            setIsAuthenticated(false);
          }
        }
      ]
    );
  }

  async function handleCancelUpload(uploadId) {
    try {
      await uploadManager.cancelUpload(uploadId);
      await loadUploads();
    } catch (error) {
      console.error('Failed to cancel upload:', error);
    }
  }

  async function handleClearCompleted() {
    try {
      await uploadManager.clearCompleted();
      await loadUploads();
    } catch (error) {
      console.error('Failed to clear completed:', error);
    }
  }

  function getStatusColor(status) {
    switch (status) {
      case 'uploading': return '#007AFF';
      case 'completed': return '#34C759';
      case 'failed': return '#FF3B30';
      case 'pending': return '#FF9500';
      default: return '#8E8E93';
    }
  }

  function getStatusLabel(status) {
    switch (status) {
      case 'uploading': return 'Uploading';
      case 'completed': return 'Completed';
      case 'failed': return 'Failed';
      case 'pending': return 'Pending';
      default: return status;
    }
  }

  function renderUpload({ item }) {
    const progress = item.progress_percent || 0;
    const statusColor = getStatusColor(item.status);
    const speed = item.upload_speed_mbps ? `${item.upload_speed_mbps.toFixed(2)} MB/s` : '';
    const eta = item.eta_seconds ? `${Math.floor(item.eta_seconds / 60)}m ${item.eta_seconds % 60}s` : '';

    return (
      <View style={styles.uploadCard}>
        <View style={styles.uploadInfo}>
          <Text style={styles.uploadName} numberOfLines={1}>
            {item.filename}
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

          {item.status === 'uploading' && (
            <>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${progress}%` }]} />
              </View>
              <View style={styles.uploadMeta}>
                <Text style={styles.metaText}>{speed}</Text>
                <Text style={styles.metaText}>ETA: {eta}</Text>
              </View>
            </>
          )}

          {item.error_message && (
            <Text style={styles.errorText} numberOfLines={2}>
              Error: {item.error_message}
            </Text>
          )}
        </View>

        {(item.status === 'uploading' || item.status === 'pending') && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancelUpload(item.id)}
          >
            <Text style={styles.cancelButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📺</Text>
        <Text style={styles.emptyText}>Sign in to YouTube</Text>
        <Text style={styles.emptySubtext}>
          Connect your YouTube account to upload videos
        </Text>
        <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
          <Text style={styles.signInButtonText}>Sign In with Google</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (uploads.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No uploads in queue</Text>
        <Text style={styles.emptySubtext}>
          Select renamed videos and upload to YouTube
        </Text>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleSignOut}>
          <Text style={styles.secondaryButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>YouTube Uploads</Text>
        <TouchableOpacity onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.networkSection}>
        <NetworkIndicator showDataUsage={false} />
      </View>

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
        data={uploads}
        renderItem={renderUpload}
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
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16
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
    textAlign: 'center',
    marginBottom: 24
  },
  signInButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12
  },
  signInButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600'
  },
  secondaryButton: {
    backgroundColor: '#F2F2F7',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600'
  },
  header: {
    backgroundColor: '#FFF',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600'
  },
  signOutText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600'
  },
  networkSection: {
    padding: 16,
    paddingBottom: 0
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
  uploadCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center'
  },
  uploadInfo: {
    flex: 1
  },
  uploadName: {
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
    overflow: 'hidden',
    marginBottom: 8
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 3
  },
  uploadMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  metaText: {
    fontSize: 12,
    color: '#666'
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