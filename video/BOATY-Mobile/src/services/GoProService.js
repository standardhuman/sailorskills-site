import axios from 'axios';
import * as FileSystem from 'expo-file-system';

class GoProService {
  constructor() {
    this.baseURL = 'http://10.5.5.9:8080';
    this.timeout = 30000;
    this.connected = false;
    this.cameraInfo = null;
  }

  /**
   * Test connection to GoPro camera
   */
  async testConnection() {
    try {
      const response = await axios.get(`${this.baseURL}/gp/gpControl/info`, {
        timeout: 5000
      });
      this.connected = response.status === 200;
      return this.connected;
    } catch (error) {
      this.connected = false;
      return false;
    }
  }

  /**
   * Wait for connection to be established
   */
  async waitForConnection(maxAttempts = 10) {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (await this.testConnection()) {
        return true;
      }
    }
    throw new Error('Connection timeout - unable to reach GoPro');
  }

  /**
   * Get camera information (model, firmware, etc)
   */
  async getCameraInfo() {
    try {
      const response = await axios.get(`${this.baseURL}/gp/gpControl/info`, {
        timeout: this.timeout
      });

      this.cameraInfo = {
        modelNumber: response.data.info.model_number,
        modelName: response.data.info.model_name,
        firmwareVersion: response.data.info.firmware_version,
        serialNumber: response.data.info.serial_number
      };

      return this.cameraInfo;
    } catch (error) {
      throw new Error(`Failed to get camera info: ${error.message}`);
    }
  }

  /**
   * Get camera status (battery, recording, etc)
   */
  async getCameraStatus() {
    try {
      const response = await axios.get(`${this.baseURL}/gp/gpControl/status`, {
        timeout: this.timeout
      });

      const status = response.data.status;

      return {
        battery: status['2'] || 0,           // Battery percentage (0-100)
        batteryLevel: status['1'] || 0,      // Battery bars (0-4)
        recording: status['8'] === 1,        // Recording status
        sdCard: status['54'] === 0,          // SD card inserted
        busy: status['8'] === 1              // Camera busy
      };
    } catch (error) {
      throw new Error(`Failed to get camera status: ${error.message}`);
    }
  }

  /**
   * Get list of all media files on camera
   */
  async getMediaList() {
    try {
      const response = await axios.get(`${this.baseURL}/gp/gpMediaList`, {
        timeout: this.timeout
      });

      const videos = [];

      if (response.data.media) {
        response.data.media.forEach(dir => {
          if (dir.fs) {
            dir.fs.forEach(file => {
              // Only include video files
              if (file.n.endsWith('.MP4') || file.n.endsWith('.mp4')) {
                videos.push({
                  filename: file.n,
                  directory: dir.d,
                  size: parseInt(file.s),
                  modified: new Date(parseInt(file.mod) * 1000),
                  path: `${dir.d}/${file.n}`
                });
              }
            });
          }
        });
      }

      // Sort by modified date (newest first)
      videos.sort((a, b) => b.modified - a.modified);

      return videos;
    } catch (error) {
      throw new Error(`Failed to get media list: ${error.message}`);
    }
  }

  /**
   * Download a video file from camera
   * @param {string} filename - Video filename
   * @param {string} directory - Directory on camera (e.g., "100GOPRO")
   * @param {string} localPath - Local path to save file
   * @param {function} onProgress - Progress callback
   */
  async downloadVideo(filename, directory, localPath, onProgress) {
    try {
      const url = `${this.baseURL}/videos/DCIM/${directory}/${filename}`;

      // Check if partial file exists for resume
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      let resumeData = 0;

      if (fileInfo.exists) {
        resumeData = fileInfo.size;
      }

      // Create download resumable
      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        localPath,
        {
          headers: resumeData > 0 ? { 'Range': `bytes=${resumeData}-` } : {}
        },
        (downloadProgress) => {
          if (onProgress) {
            const progress = {
              bytesWritten: downloadProgress.totalBytesWritten,
              contentLength: downloadProgress.totalBytesExpectedToWrite,
              percent: (downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100
            };
            onProgress(progress);
          }
        }
      );

      const result = await downloadResumable.downloadAsync();
      return result;

    } catch (error) {
      throw new Error(`Failed to download video: ${error.message}`);
    }
  }

  /**
   * Get thumbnail for a video (if available)
   */
  async getThumbnail(directory, filename) {
    try {
      const url = `${this.baseURL}/gp/gpMediaMetadata?p=${directory}/${filename}&t=b`;
      const response = await axios.get(url, {
        timeout: 10000,
        responseType: 'arraybuffer'
      });

      // Convert to base64 for React Native Image component
      const base64 = btoa(
        new Uint8Array(response.data)
          .reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      return `data:image/jpeg;base64,${base64}`;
    } catch (error) {
      // Thumbnails may not be available for all videos
      return null;
    }
  }

  /**
   * Check if GoPro is currently connected
   */
  isConnected() {
    return this.connected;
  }

  /**
   * Disconnect from GoPro
   */
  disconnect() {
    this.connected = false;
    this.cameraInfo = null;
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Estimate download time based on file size
   * Assumes average WiFi speed of 10 MB/s
   */
  estimateDownloadTime(bytes) {
    const averageSpeed = 10 * 1024 * 1024; // 10 MB/s
    const seconds = Math.ceil(bytes / averageSpeed);

    if (seconds < 60) {
      return `${seconds}s`;
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }
}

// Export singleton instance
const goProService = new GoProService();
export default goProService;