import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import database from '../services/VideoDatabase';
import VideoCard from '../components/VideoCard';

export default function VideoLibraryScreen({ navigation }) {
  const [videos, setVideos] = useState([]);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [selectedVideos, setSelectedVideos] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [storageInfo, setStorageInfo] = useState(null);

  useEffect(() => {
    loadVideos();
    loadStorageInfo();
  }, []);

  useEffect(() => {
    filterVideos();
  }, [searchQuery, videos]);

  async function loadVideos() {
    try {
      const videoList = await database.getVideos();
      setVideos(videoList);
      setFilteredVideos(videoList);
    } catch (error) {
      console.error('Failed to load videos:', error);
    }
  }

  async function loadStorageInfo() {
    try {
      const videosDir = `${FileSystem.documentDirectory}videos/`;
      let totalSize = 0;

      const dirInfo = await FileSystem.getInfoAsync(videosDir);
      if (dirInfo.exists) {
        const files = await FileSystem.readDirectoryAsync(videosDir);
        for (const file of files) {
          const fileInfo = await FileSystem.getInfoAsync(`${videosDir}${file}`);
          if (fileInfo.exists) {
            totalSize += fileInfo.size || 0;
          }
        }
      }

      const freeDiskStorage = await FileSystem.getFreeDiskStorageAsync();

      setStorageInfo({
        used: totalSize,
        free: freeDiskStorage,
        videoCount: videos.length
      });
    } catch (error) {
      console.error('Failed to load storage info:', error);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadVideos();
    await loadStorageInfo();
    setRefreshing(false);
  }

  function filterVideos() {
    if (!searchQuery) {
      setFilteredVideos(videos);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = videos.filter(video =>
      video.filename.toLowerCase().includes(query) ||
      (video.boat_name && video.boat_name.toLowerCase().includes(query))
    );
    setFilteredVideos(filtered);
  }

  function toggleVideoSelection(video) {
    const newSelection = new Set(selectedVideos);
    if (newSelection.has(video.id)) {
      newSelection.delete(video.id);
    } else {
      newSelection.add(video.id);
    }
    setSelectedVideos(newSelection);
  }

  function selectAll() {
    setSelectedVideos(new Set(filteredVideos.map(v => v.id)));
  }

  function deselectAll() {
    setSelectedVideos(new Set());
  }

  function handleRenameSelected() {
    if (selectedVideos.size === 0) {
      Alert.alert('No Selection', 'Please select videos to rename');
      return;
    }

    const videosToRename = videos.filter(v => selectedVideos.has(v.id));
    navigation.navigate('RenameVideos', { videos: videosToRename });
  }

  async function handleDeleteSelected() {
    if (selectedVideos.size === 0) {
      Alert.alert('No Selection', 'Please select videos to delete');
      return;
    }

    Alert.alert(
      'Delete Videos',
      `Delete ${selectedVideos.size} video(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              for (const videoId of selectedVideos) {
                const video = videos.find(v => v.id === videoId);
                if (video) {
                  // Delete file
                  await FileSystem.deleteAsync(video.local_path, { idempotent: true });
                  // Delete from database
                  await database.deleteVideo(videoId);
                }
              }
              deselectAll();
              await loadVideos();
              await loadStorageInfo();
            } catch (error) {
              Alert.alert('Error', `Failed to delete videos: ${error.message}`);
            }
          }
        }
      ]
    );
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  if (videos.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📹</Text>
        <Text style={styles.emptyText}>No videos in library</Text>
        <Text style={styles.emptySubtext}>
          Download videos from your GoPro to get started
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {storageInfo && (
        <View style={styles.storageBar}>
          <Text style={styles.storageText}>
            {storageInfo.videoCount} videos • {formatFileSize(storageInfo.used)} used
          </Text>
          <Text style={styles.storageText}>
            {formatFileSize(storageInfo.free)} free
          </Text>
        </View>
      )}

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search videos or boats..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>

      <View style={styles.actions}>
        <TouchableOpacity onPress={selectAll} style={styles.actionButton}>
          <Text style={styles.actionText}>Select All</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={deselectAll} style={styles.actionButton}>
          <Text style={styles.actionText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredVideos}
        renderItem={({ item }) => (
          <VideoCard
            video={item}
            selected={selectedVideos.has(item.id)}
            onPress={() => toggleVideoSelection(item)}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />

      {selectedVideos.size > 0 && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {selectedVideos.size} selected
          </Text>
          <View style={styles.footerButtons}>
            <TouchableOpacity
              style={[styles.footerButton, styles.renameButton]}
              onPress={handleRenameSelected}
            >
              <Text style={styles.footerButtonText}>Rename</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.footerButton, styles.deleteButton]}
              onPress={handleDeleteSelected}
            >
              <Text style={styles.footerButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    textAlign: 'center'
  },
  storageBar: {
    backgroundColor: '#FFF',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0'
  },
  storageText: {
    fontSize: 12,
    color: '#666'
  },
  searchContainer: {
    padding: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0'
  },
  searchInput: {
    backgroundColor: '#F2F2F7',
    padding: 12,
    borderRadius: 8,
    fontSize: 16
  },
  actions: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFF',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0'
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 8
  },
  actionText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600'
  },
  listContent: {
    padding: 16
  },
  footer: {
    backgroundColor: '#FFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600'
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12
  },
  footerButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8
  },
  renameButton: {
    backgroundColor: '#007AFF'
  },
  deleteButton: {
    backgroundColor: '#FF3B30'
  },
  footerButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600'
  }
});