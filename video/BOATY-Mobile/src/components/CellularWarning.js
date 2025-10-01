import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';

export default function CellularWarning({ visible, videoSize, onCancel, onContinue }) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.icon}>⚠️</Text>

          <Text style={styles.title}>Cellular Data Warning</Text>

          <Text style={styles.message}>
            You're about to upload {videoSize} over cellular data.
            This may use a significant amount of your data plan.
          </Text>

          <Text style={styles.subMessage}>
            Consider waiting until you're connected to WiFi to save on data costs.
          </Text>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Wait for WiFi</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.continueButton]}
              onPress={onContinue}
            >
              <Text style={styles.continueButtonText}>Upload Anyway</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modal: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center'
  },
  icon: {
    fontSize: 48,
    marginBottom: 16
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center'
  },
  message: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 22
  },
  subMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20
  },
  buttons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center'
  },
  cancelButton: {
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600'
  },
  continueButton: {
    backgroundColor: '#FF9500'
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600'
  }
});
