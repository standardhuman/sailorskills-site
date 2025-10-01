import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>BOATY Mobile</Text>
      <Text style={styles.subtitle}>Boat Video Workflow</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('GoProConnect')}
      >
        <Text style={styles.buttonText}>Connect to GoPro</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.buttonSecondary}
        onPress={() => navigation.navigate('DownloadQueue')}
      >
        <Text style={styles.buttonTextSecondary}>Download Queue</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.buttonSecondary}
        onPress={() => navigation.navigate('Videos')}
      >
        <Text style={styles.buttonTextSecondary}>View Library</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    padding: 20
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 40
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    width: '80%',
    alignItems: 'center'
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600'
  },
  buttonSecondary: {
    backgroundColor: '#FFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    width: '80%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF'
  },
  buttonTextSecondary: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: '600'
  }
});