import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  constructor() {
    this.permissionGranted = false;
    this.notificationIds = new Map(); // uploadId -> notificationId
  }

  /**
   * Request notification permissions
   */
  async requestPermissions() {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      this.permissionGranted = finalStatus === 'granted';

      if (!this.permissionGranted) {
        console.warn('Notification permissions not granted');
      }

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('uploads', {
          name: 'Upload Progress',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#007AFF',
        });
      }

      return this.permissionGranted;
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      return false;
    }
  }

  /**
   * Show upload started notification
   */
  async notifyUploadStarted(uploadId, filename) {
    if (!this.permissionGranted) return;

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Upload Started',
          body: filename,
          data: { uploadId, type: 'upload_started' },
        },
        trigger: null, // Show immediately
      });

      this.notificationIds.set(uploadId, notificationId);
    } catch (error) {
      console.error('Failed to show upload started notification:', error);
    }
  }

  /**
   * Update upload progress notification
   */
  async notifyUploadProgress(uploadId, filename, progress, speed, eta) {
    if (!this.permissionGranted) return;

    try {
      const progressPercent = Math.round(progress);
      const speedText = speed ? `${speed.toFixed(1)} MB/s` : '';
      const etaText = eta ? `${Math.floor(eta / 60)}m ${eta % 60}s remaining` : '';

      const existingId = this.notificationIds.get(uploadId);

      // Dismiss old notification if exists
      if (existingId) {
        await Notifications.dismissNotificationAsync(existingId);
      }

      // Show new notification
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `Uploading: ${progressPercent}%`,
          body: `${filename}\n${speedText} • ${etaText}`,
          data: { uploadId, type: 'upload_progress', progress: progressPercent },
          sticky: true,
          ongoing: true, // Android only
        },
        trigger: null,
      });

      this.notificationIds.set(uploadId, notificationId);
    } catch (error) {
      console.error('Failed to update upload progress notification:', error);
    }
  }

  /**
   * Show upload completed notification
   */
  async notifyUploadCompleted(uploadId, filename) {
    if (!this.permissionGranted) return;

    try {
      // Dismiss progress notification
      const existingId = this.notificationIds.get(uploadId);
      if (existingId) {
        await Notifications.dismissNotificationAsync(existingId);
        this.notificationIds.delete(uploadId);
      }

      // Show completion notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Upload Complete',
          body: filename,
          data: { uploadId, type: 'upload_completed' },
          sound: true,
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Failed to show upload completed notification:', error);
    }
  }

  /**
   * Show upload failed notification
   */
  async notifyUploadFailed(uploadId, filename, error) {
    if (!this.permissionGranted) return;

    try {
      // Dismiss progress notification
      const existingId = this.notificationIds.get(uploadId);
      if (existingId) {
        await Notifications.dismissNotificationAsync(existingId);
        this.notificationIds.delete(uploadId);
      }

      // Show failure notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Upload Failed',
          body: `${filename}\n${error}`,
          data: { uploadId, type: 'upload_failed', error },
          sound: true,
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Failed to show upload failed notification:', error);
    }
  }

  /**
   * Show download started notification
   */
  async notifyDownloadStarted(downloadId, filename) {
    if (!this.permissionGranted) return;

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Download Started',
          body: filename,
          data: { downloadId, type: 'download_started' },
        },
        trigger: null,
      });

      this.notificationIds.set(`download_${downloadId}`, notificationId);
    } catch (error) {
      console.error('Failed to show download started notification:', error);
    }
  }

  /**
   * Update download progress notification
   */
  async notifyDownloadProgress(downloadId, filename, progress) {
    if (!this.permissionGranted) return;

    try {
      const progressPercent = Math.round(progress);
      const existingId = this.notificationIds.get(`download_${downloadId}`);

      if (existingId) {
        await Notifications.dismissNotificationAsync(existingId);
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `Downloading: ${progressPercent}%`,
          body: filename,
          data: { downloadId, type: 'download_progress', progress: progressPercent },
          sticky: true,
          ongoing: true,
        },
        trigger: null,
      });

      this.notificationIds.set(`download_${downloadId}`, notificationId);
    } catch (error) {
      console.error('Failed to update download progress notification:', error);
    }
  }

  /**
   * Show download completed notification
   */
  async notifyDownloadCompleted(downloadId, filename) {
    if (!this.permissionGranted) return;

    try {
      const existingId = this.notificationIds.get(`download_${downloadId}`);
      if (existingId) {
        await Notifications.dismissNotificationAsync(existingId);
        this.notificationIds.delete(`download_${downloadId}`);
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Download Complete',
          body: filename,
          data: { downloadId, type: 'download_completed' },
          sound: true,
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Failed to show download completed notification:', error);
    }
  }

  /**
   * Dismiss notification by upload/download ID
   */
  async dismissNotification(id) {
    try {
      const notificationId = this.notificationIds.get(id);
      if (notificationId) {
        await Notifications.dismissNotificationAsync(notificationId);
        this.notificationIds.delete(id);
      }
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
    }
  }

  /**
   * Dismiss all notifications
   */
  async dismissAll() {
    try {
      await Notifications.dismissAllNotificationsAsync();
      this.notificationIds.clear();
    } catch (error) {
      console.error('Failed to dismiss all notifications:', error);
    }
  }

  /**
   * Add notification listener
   */
  addNotificationListener(handler) {
    return Notifications.addNotificationReceivedListener(handler);
  }

  /**
   * Add notification response listener (when user taps notification)
   */
  addNotificationResponseListener(handler) {
    return Notifications.addNotificationResponseReceivedListener(handler);
  }
}

// Export singleton instance
const notificationService = new NotificationService();
export default notificationService;
