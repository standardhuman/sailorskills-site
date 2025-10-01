import * as FileSystem from 'expo-file-system';
import goProService from './GoProService';
import database from './VideoDatabase';
import notificationService from './NotificationService';

class DownloadManager {
  constructor() {
    this.activeDownloads = new Map(); // downloadId -> { resumable, cancel }
    this.queue = [];
    this.maxConcurrent = 2;
    this.isProcessing = false;
  }

  /**
   * Add video to download queue
   */
  async addToQueue(video) {
    try {
      // Generate local path
      const localPath = `${FileSystem.documentDirectory}videos/${video.filename}`;

      // Add to database
      const downloadId = await database.addToDownloadQueue({
        gopro_filename: video.filename,
        size_bytes: video.size,
        status: 'pending'
      });

      // Add to in-memory queue
      this.queue.push({
        id: downloadId,
        video: video,
        localPath: localPath
      });

      // Start processing if not already running
      if (!this.isProcessing) {
        this.processQueue();
      }

      return downloadId;
    } catch (error) {
      throw new Error(`Failed to add to queue: ${error.message}`);
    }
  }

  /**
   * Process download queue
   */
  async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      // Ensure videos directory exists
      const videosDir = `${FileSystem.documentDirectory}videos/`;
      const dirInfo = await FileSystem.getInfoAsync(videosDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(videosDir, { intermediates: true });
      }

      while (this.queue.length > 0 || this.activeDownloads.size > 0) {
        // Start new downloads up to maxConcurrent
        while (this.activeDownloads.size < this.maxConcurrent && this.queue.length > 0) {
          const item = this.queue.shift();
          this.startDownload(item);
        }

        // Wait a bit before checking again
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error('Queue processing error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Start downloading a video
   */
  async startDownload(item) {
    const { id, video, localPath } = item;

    try {
      // Update status to downloading
      await database.updateDownloadProgress(id, {
        status: 'downloading',
        progress_percent: 0,
        bytes_downloaded: 0
      });

      // Show notification
      await notificationService.notifyDownloadStarted(id, video.filename);

      // Start download with progress tracking
      const downloadResumable = await this.createDownloadResumable(
        video,
        localPath,
        (progress) => this.onProgress(id, video.filename, progress)
      );

      this.activeDownloads.set(id, downloadResumable);

      // Wait for download to complete
      const result = await downloadResumable.downloadAsync();

      // Download completed successfully
      await this.onComplete(id, video, localPath, result);

    } catch (error) {
      await this.onError(id, video.filename, error);
    } finally {
      this.activeDownloads.delete(id);
    }
  }

  /**
   * Create resumable download
   */
  async createDownloadResumable(video, localPath, onProgress) {
    const url = `${goProService.baseURL}/videos/DCIM/${video.directory}/${video.filename}`;

    // Check if partial file exists
    const fileInfo = await FileSystem.getInfoAsync(localPath);
    let resumeData = 0;

    if (fileInfo.exists) {
      resumeData = fileInfo.size;
    }

    return FileSystem.createDownloadResumable(
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
  }

  /**
   * Handle download progress
   */
  async onProgress(downloadId, filename, progress) {
    try {
      await database.updateDownloadProgress(downloadId, {
        progress_percent: progress.percent,
        bytes_downloaded: progress.bytesWritten,
        status: 'downloading'
      });

      // Update notification periodically (every 10%)
      if (progress.percent % 10 < 1) {
        await notificationService.notifyDownloadProgress(downloadId, filename, progress.percent);
      }
    } catch (error) {
      console.error('Progress update error:', error);
    }
  }

  /**
   * Handle download completion
   */
  async onComplete(downloadId, video, localPath, result) {
    try {
      // Update download queue status
      await database.updateDownloadProgress(downloadId, {
        progress_percent: 100,
        bytes_downloaded: result.headers['content-length'] || video.size,
        status: 'completed'
      });

      // Add video to library
      await database.addVideo({
        filename: video.filename,
        original_filename: video.filename,
        local_path: localPath,
        size_bytes: video.size,
        boat_name: null, // To be set during rename
        video_date: video.modified.toISOString().split('T')[0],
        video_type: null
      });

      // Show completion notification
      await notificationService.notifyDownloadCompleted(downloadId, video.filename);

      console.log(`Download completed: ${video.filename}`);
    } catch (error) {
      console.error('Completion handler error:', error);
    }
  }

  /**
   * Handle download error
   */
  async onError(downloadId, filename, error) {
    try {
      // Get current retry count
      const downloads = await database.getDownloadQueue();
      const download = downloads.find(d => d.id === downloadId);
      const retryCount = download ? download.retry_count : 0;

      if (retryCount < 3) {
        // Retry
        await database.updateDownloadProgress(downloadId, {
          status: 'pending',
          retry_count: retryCount + 1,
          error_message: error.message
        });

        // Add back to queue
        const item = { id: downloadId, ...download };
        this.queue.push(item);
      } else {
        // Failed after retries
        await database.updateDownloadProgress(downloadId, {
          status: 'failed',
          error_message: error.message
        });

        // No notification for failed downloads (user can see in app)
      }

      console.error(`Download error: ${error.message}`);
    } catch (err) {
      console.error('Error handler error:', err);
    }
  }

  /**
   * Pause a download
   */
  async pauseDownload(downloadId) {
    const download = this.activeDownloads.get(downloadId);
    if (download) {
      await download.pauseAsync();
      await database.updateDownloadProgress(downloadId, {
        status: 'paused'
      });
    }
  }

  /**
   * Resume a download
   */
  async resumeDownload(downloadId) {
    const download = this.activeDownloads.get(downloadId);
    if (download) {
      await download.resumeAsync();
      await database.updateDownloadProgress(downloadId, {
        status: 'downloading'
      });
    }
  }

  /**
   * Cancel a download
   */
  async cancelDownload(downloadId) {
    const download = this.activeDownloads.get(downloadId);
    if (download) {
      await download.cancelAsync();
      this.activeDownloads.delete(downloadId);

      await database.updateDownloadProgress(downloadId, {
        status: 'cancelled'
      });
    }

    // Remove from queue if present
    this.queue = this.queue.filter(item => item.id !== downloadId);
  }

  /**
   * Get current download queue status
   */
  async getQueueStatus() {
    const downloads = await database.getDownloadQueue();

    return {
      total: downloads.length,
      active: this.activeDownloads.size,
      pending: downloads.filter(d => d.status === 'pending').length,
      completed: downloads.filter(d => d.status === 'completed').length,
      failed: downloads.filter(d => d.status === 'failed').length
    };
  }

  /**
   * Clear completed downloads from queue
   */
  async clearCompleted() {
    const downloads = await database.getDownloadQueue();
    const completed = downloads.filter(d => d.status === 'completed');

    for (const download of completed) {
      await database.db.runAsync(
        'DELETE FROM download_queue WHERE id = ?',
        [download.id]
      );
    }
  }
}

// Export singleton instance
const downloadManager = new DownloadManager();
export default downloadManager;