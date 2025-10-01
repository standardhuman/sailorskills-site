import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import goProService from '../services/GoProService';
import downloadManager from '../services/DownloadManager';

export default function GoProBrowserScreen() {
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const [selectedVideos, setSelectedVideos] = useState(new Set());

  useEffect(() => {
    loadVideos();
  }, []);

  async function loadVideos() {
    setLoading(true);
    try {
      const mediaList = await goProService.getMediaList();
      setVideos(mediaList);
    } catch (error) {
      Alert.alert('Error', `Failed to load videos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  function toggleVideoSelection(video) {
    const newSelection = new Set(selectedVideos);
    if (newSelection.has(video.filename)) {
      newSelection.delete(video.filename);
    } else {
      newSelection.add(video.filename);
    }
    setSelectedVideos(newSelection);
  }

  function selectAll() {
    setSelectedVideos(new Set(videos.map(v => v.filename)));
  }

  function deselectAll() {
    setSelectedVideos(new Set());
  }

  async function handleDownloadSelected() {
    if (selectedVideos.size === 0) {
      Alert.alert('No Selection', 'Please select videos to download');
      return;
    }

    const videosToDownload = videos.filter(v => selectedVideos.has(v.filename));

    Alert.alert(
      'Download Videos',
      `Download ${videosToDownload.length} video(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Download',
          onPress: async () => {
            try {
              for (const video of videosToDownload) {
                await downloadManager.addToQueue(video);
              }

              Alert.alert(
                'Success',
                `Added ${videosToDownload.length} video(s) to download queue`,
                [{ text: 'OK', onPress: deselectAll }]
              );
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
  }

  function renderVideo({ item }) {
    const isSelected = selectedVideos.has(item.filename);

    return (
      <TouchableOpacity
        style={[styles.videoCard, isSelected && styles.videoCardSelected]}
        onPress={() => toggleVideoSelection(item)}
      >
        <View style={styles.videoInfo}>
          <Text style={styles.videoName} numberOfLines={1}>
            {item.filename}
          </Text>
          <Text style={styles.videoMeta}>
            {goProService.formatFileSize(item.size)} • {item.modified.toLocaleDateString()}
          </Text>
          <Text style={styles.videoEta}>
            Est. {goProService.estimateDownloadTime(item.size)}
          </Text>
        </View>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading videos...</Text>
      </View>
    );
  }

  if (videos.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No videos found on camera</Text>
        <TouchableOpacity style={styles.button} onPress={loadVideos}>
          <Text style={styles.buttonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {videos.length} video(s) available
        </Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={selectAll} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Select All</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={deselectAll} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={videos}
        renderItem={renderVideo}
        keyExtractor={(item) => item.filename}
        contentContainerStyle={styles.listContent}
      />

      {selectedVideos.size > 0 && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {selectedVideos.size} selected
          </Text>
          <TouchableOpacity
            style={styles.downloadButton}
            onPress={handleDownloadSelected}
          >
            <Text style={styles.downloadButtonText}>Download Selected</Text>
          </TouchableOpacity>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    padding: 20
  },
  header: {
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0'
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12
  },
  headerButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 8
  },
  headerButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600'
  },
  listContent: {
    padding: 16
  },
  videoCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  videoCardSelected: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#007AFF'
  },
  videoInfo: {
    flex: 1,
    marginRight: 12
  },
  videoName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4
  },
  videoMeta: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2
  },
  videoEta: {
    fontSize: 12,
    color: '#999'
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center'
  },
  checkboxSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF'
  },
  checkmark: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold'
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
  downloadButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8
  },
  downloadButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666'
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600'
  }
});