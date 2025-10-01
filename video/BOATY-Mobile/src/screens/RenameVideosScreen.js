import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import database from '../services/VideoDatabase';

export default function RenameVideosScreen({ route, navigation }) {
  const { videos } = route.params;
  const [boatName, setBoatName] = useState('');
  const [videoDate, setVideoDate] = useState(new Date().toISOString().split('T')[0]);
  const [videoTypes, setVideoTypes] = useState({});
  const [customSuffixes, setCustomSuffixes] = useState({});
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    // Initialize video types
    const initialTypes = {};
    videos.forEach((video, index) => {
      if (videos.length === 1) {
        initialTypes[video.id] = 'None';
      } else if (videos.length === 2) {
        initialTypes[video.id] = index === 0 ? 'Before' : 'After';
      } else {
        if (index === 0) {
          initialTypes[video.id] = 'Before';
        } else if (index === videos.length - 1) {
          initialTypes[video.id] = 'After';
        } else {
          initialTypes[video.id] = 'Custom';
        }
      }
    });
    setVideoTypes(initialTypes);
    generatePreviews();
  }, []);

  useEffect(() => {
    generatePreviews();
  }, [boatName, videoDate, videoTypes, customSuffixes]);

  function generatePreviews() {
    const newPreviews = videos.map((video, index) => {
      const extension = video.filename.split('.').pop();
      const type = videoTypes[video.id] || 'None';
      const customSuffix = customSuffixes[video.id] || '';

      // Format date as MM-DD-YYYY
      const date = new Date(videoDate);
      const formattedDate = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${date.getFullYear()}`;

      // Build filename
      let newFilename = '';
      if (boatName) {
        newFilename = `${boatName} ${formattedDate} ${index + 1}`;

        // Add type suffix
        if (type === 'Before') {
          newFilename += ' (Before)';
        } else if (type === 'After') {
          newFilename += ' (After)';
        } else if (type === 'Custom' && customSuffix) {
          newFilename += ` (${customSuffix})`;
        }

        newFilename += `.${extension}`;
      } else {
        newFilename = video.filename; // Keep original if no boat name
      }

      return {
        videoId: video.id,
        original: video.filename,
        renamed: newFilename
      };
    });

    setPreviews(newPreviews);
  }

  function handleTypeChange(videoId, type) {
    setVideoTypes(prev => ({
      ...prev,
      [videoId]: type
    }));
  }

  function handleCustomSuffixChange(videoId, suffix) {
    setCustomSuffixes(prev => ({
      ...prev,
      [videoId]: suffix
    }));
  }

  async function handleApplyRename() {
    if (!boatName.trim()) {
      Alert.alert('Error', 'Please enter a boat name');
      return;
    }

    // Check for custom type without suffix
    const invalidCustom = videos.some(video => {
      const type = videoTypes[video.id];
      const suffix = customSuffixes[video.id];
      return type === 'Custom' && !suffix?.trim();
    });

    if (invalidCustom) {
      Alert.alert('Error', 'Please enter custom suffix for all Custom type videos');
      return;
    }

    Alert.alert(
      'Rename Videos',
      `Rename ${videos.length} video(s) for boat "${boatName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Rename',
          onPress: async () => {
            try {
              const videosDir = `${FileSystem.documentDirectory}videos/`;

              for (let i = 0; i < videos.length; i++) {
                const video = videos[i];
                const preview = previews[i];

                if (preview.renamed !== video.filename) {
                  const oldPath = video.local_path;
                  const newPath = `${videosDir}${preview.renamed}`;

                  // Rename file
                  await FileSystem.moveAsync({
                    from: oldPath,
                    to: newPath
                  });

                  // Update database
                  await database.updateVideo(video.id, {
                    filename: preview.renamed,
                    boat_name: boatName,
                    video_date: videoDate,
                    video_type: videoTypes[video.id],
                    local_path: newPath
                  });
                }
              }

              Alert.alert('Success', 'Videos renamed successfully', [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack()
                }
              ]);
            } catch (error) {
              Alert.alert('Error', `Failed to rename videos: ${error.message}`);
            }
          }
        }
      ]
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Rename {videos.length} Video(s)</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Boat Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter boat name"
          value={boatName}
          onChangeText={setBoatName}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Video Date *</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          value={videoDate}
          onChangeText={setVideoDate}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Video Types</Text>
        {videos.map((video, index) => (
          <View key={video.id} style={styles.videoConfig}>
            <Text style={styles.videoNumber}>Video {index + 1}</Text>
            <Text style={styles.originalName} numberOfLines={1}>
              {video.filename}
            </Text>

            <View style={styles.typeButtons}>
              {['Before', 'Custom', 'After', 'None'].map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    videoTypes[video.id] === type && styles.typeButtonActive
                  ]}
                  onPress={() => handleTypeChange(video.id, type)}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      videoTypes[video.id] === type && styles.typeButtonTextActive
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {videoTypes[video.id] === 'Custom' && (
              <TextInput
                style={styles.customInput}
                placeholder="Enter custom suffix"
                value={customSuffixes[video.id] || ''}
                onChangeText={(text) => handleCustomSuffixChange(video.id, text)}
              />
            )}
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preview</Text>
        {previews.map((preview, index) => (
          <View key={preview.videoId} style={styles.previewCard}>
            <Text style={styles.previewLabel}>Video {index + 1}</Text>
            <Text style={styles.previewOriginal} numberOfLines={1}>
              {preview.original}
            </Text>
            <Text style={styles.previewArrow}>↓</Text>
            <Text style={styles.previewRenamed} numberOfLines={1}>
              {preview.renamed}
            </Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.applyButton}
        onPress={handleApplyRename}
      >
        <Text style={styles.applyButtonText}>Apply Rename</Text>
      </TouchableOpacity>
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20
  },
  section: {
    marginBottom: 24
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8
  },
  input: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12
  },
  videoConfig: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12
  },
  videoNumber: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4
  },
  originalName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8
  },
  typeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center'
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF'
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000'
  },
  typeButtonTextActive: {
    color: '#FFF'
  },
  customInput: {
    backgroundColor: '#F2F2F7',
    padding: 10,
    borderRadius: 8,
    fontSize: 14
  },
  previewCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8
  },
  previewOriginal: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4
  },
  previewArrow: {
    fontSize: 16,
    color: '#007AFF',
    marginVertical: 4
  },
  previewRenamed: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000'
  },
  applyButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40
  },
  applyButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600'
  }
});