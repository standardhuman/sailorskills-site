import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

export default function VideoCard({ video, onPress, selected }) {
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onPress}
    >
      <View style={styles.thumbnail}>
        <Text style={styles.thumbnailText}>🎥</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.filename} numberOfLines={1}>
          {video.filename}
        </Text>

        {video.boat_name && (
          <Text style={styles.boatName}>
            🚤 {video.boat_name}
          </Text>
        )}

        <View style={styles.metadata}>
          <Text style={styles.metaText}>
            {formatFileSize(video.size_bytes)}
          </Text>
          {video.video_date && (
            <Text style={styles.metaText}>
              • {formatDate(video.video_date)}
            </Text>
          )}
        </View>

        {video.video_type && (
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{video.video_type}</Text>
          </View>
        )}
      </View>

      {selected && (
        <View style={styles.checkmark}>
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center'
  },
  cardSelected: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#007AFF'
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  thumbnailText: {
    fontSize: 32
  },
  info: {
    flex: 1
  },
  filename: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4
  },
  boatName: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 4
  },
  metadata: {
    flexDirection: 'row',
    marginTop: 4
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    marginRight: 8
  },
  typeBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4
  },
  typeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600'
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8
  },
  checkmarkText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold'
  }
});