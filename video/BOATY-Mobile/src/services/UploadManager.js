import youtubeService from './YouTubeService';
import database from './VideoDatabase';
import networkService from './NetworkService';
import notificationService from './NotificationService';

class UploadManager {
  constructor() {
    this.activeUploads = new Map(); // uploadId -> { cancel, progress }
    this.queue = [];
    this.maxConcurrent = 1; // YouTube uploads are heavy, do one at a time
    this.isProcessing = false;
    this.allowCellularUploads = false; // Default to WiFi only
  }

  /**
   * Set cellular upload preference
   */
  setAllowCellular(allow) {
    this.allowCellularUploads = allow;
  }

  /**
   * Add video to upload queue
   */
  async addToQueue(video, boatName) {
    try {
      // Check network before adding
      const networkCheck = networkService.shouldAllowUpload(this.allowCellularUploads);
      if (!networkCheck.allowed) {
        throw new Error(networkCheck.reason);
      }

      // Add to database
      const uploadId = await database.addToUploadQueue({
        video_id: video.id,
        priority: 0,
        status: 'pending'
      });

      // Add to in-memory queue
      this.queue.push({
        id: uploadId,
        video: video,
        boatName: boatName
      });

      // Start processing if not already running
      if (!this.isProcessing) {
        this.processQueue();
      }

      return uploadId;
    } catch (error) {
      throw new Error(`Failed to add to queue: ${error.message}`);
    }
  }

  /**
   * Process upload queue
   */
  async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (this.queue.length > 0 || this.activeUploads.size > 0) {
        // Start new uploads up to maxConcurrent
        while (this.activeUploads.size < this.maxConcurrent && this.queue.length > 0) {
          const item = this.queue.shift();
          this.startUpload(item);
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
   * Start uploading a video
   */
  async startUpload(item) {
    const { id, video, boatName } = item;

    try {
      // Update status to uploading
      await database.updateUploadProgress(id, {
        status: 'uploading',
        progress_percent: 0,
        bytes_uploaded: 0
      });

      // Show notification
      await notificationService.notifyUploadStarted(id, video.filename);

      // Ensure authenticated
      if (!youtubeService.isAuthenticated()) {
        throw new Error('Not authenticated with YouTube');
      }

      // Get or create playlist
      let playlistId = null;
      if (boatName) {
        playlistId = await this.getOrCreatePlaylist(boatName);
      }

      // Prepare metadata
      const metadata = {
        title: video.filename,
        description: boatName ? `Boat: ${boatName}` : '',
        privacy: 'unlisted'
      };

      // Initiate resumable upload
      const uploadUrl = await youtubeService.initiateResumableUpload(metadata);

      // Upload video with progress
      const videoId = await youtubeService.uploadVideoChunked(
        uploadUrl,
        video.local_path,
        (progress) => this.onProgress(id, video.filename, progress)
      );

      // Add to playlist if available
      if (playlistId && videoId) {
        await youtubeService.addVideoToPlaylist(videoId, playlistId);
      }

      // Upload completed successfully
      await this.onComplete(id, video.filename, videoId, playlistId);

    } catch (error) {
      await this.onError(id, video.filename, error);
    } finally {
      this.activeUploads.delete(id);
    }
  }

  /**
   * Get or create playlist for boat
   */
  async getOrCreatePlaylist(boatName) {
    try {
      const playlists = await youtubeService.getPlaylists();
      let playlist = youtubeService.findPlaylistByBoatName(playlists, boatName);

      if (!playlist) {
        playlist = await youtubeService.createPlaylist(boatName);
      }

      return playlist.id;
    } catch (error) {
      console.error('Playlist error:', error);
      return null; // Continue without playlist
    }
  }

  /**
   * Handle upload progress
   */
  async onProgress(uploadId, filename, progress) {
    try {
      const uploadInfo = this.activeUploads.get(uploadId) || {};
      const startTime = uploadInfo.startTime || Date.now();
      const lastBytes = uploadInfo.lastBytes || 0;
      const lastNotification = uploadInfo.lastNotification || 0;

      const elapsed = (Date.now() - startTime) / 1000; // seconds
      const uploadSpeed = elapsed > 0 ? (progress.bytesUploaded / elapsed) / (1024 * 1024) : 0; // MB/s
      const remainingBytes = progress.totalBytes - progress.bytesUploaded;
      const eta = uploadSpeed > 0 ? Math.ceil(remainingBytes / (uploadSpeed * 1024 * 1024)) : 0;

      // Track data usage (only new bytes)
      const newBytes = progress.bytesUploaded - lastBytes;
      if (newBytes > 0) {
        await networkService.trackDataUsage(newBytes);
      }

      await database.updateUploadProgress(uploadId, {
        progress_percent: progress.percent,
        bytes_uploaded: progress.bytesUploaded,
        upload_speed_mbps: uploadSpeed,
        eta_seconds: eta,
        status: 'uploading'
      });

      // Update notification (throttle to every 5 seconds)
      const now = Date.now();
      if (now - lastNotification > 5000 || progress.percent >= 100) {
        await notificationService.notifyUploadProgress(
          uploadId,
          filename,
          progress.percent,
          uploadSpeed,
          eta
        );
        uploadInfo.lastNotification = now;
      }

      // Update stored info
      this.activeUploads.set(uploadId, {
        startTime,
        lastBytes: progress.bytesUploaded,
        lastNotification: uploadInfo.lastNotification
      });
    } catch (error) {
      console.error('Progress update error:', error);
    }
  }

  /**
   * Handle upload completion
   */
  async onComplete(uploadId, filename, videoId, playlistId) {
    try {
      // Update upload queue status
      await database.updateUploadProgress(uploadId, {
        progress_percent: 100,
        status: 'completed'
      });

      // Get video details
      const uploads = await database.getUploadQueue();
      const upload = uploads.find(u => u.id === uploadId);

      if (upload && upload.video_id) {
        // Update video record with YouTube info
        await database.updateVideo(upload.video_id, {
          youtube_video_id: videoId,
          youtube_playlist_id: playlistId,
          upload_status: 'completed',
          uploaded_at: Date.now()
        });
      }

      // Show completion notification
      await notificationService.notifyUploadCompleted(uploadId, filename);

      console.log(`Upload completed: ${videoId}`);
    } catch (error) {
      console.error('Completion handler error:', error);
    }
  }

  /**
   * Handle upload error
   */
  async onError(uploadId, filename, error) {
    try {
      // Get current retry count
      const uploads = await database.getUploadQueue();
      const upload = uploads.find(u => u.id === uploadId);
      const retryCount = upload ? upload.retry_count : 0;

      if (retryCount < 3) {
        // Retry
        await database.updateUploadProgress(uploadId, {
          status: 'pending',
          retry_count: retryCount + 1,
          error_message: error.message
        });

        // Add back to queue
        if (upload) {
          this.queue.push({
            id: uploadId,
            video: upload,
            boatName: upload.boat_name
          });
        }
      } else {
        // Failed after retries
        await database.updateUploadProgress(uploadId, {
          status: 'failed',
          error_message: error.message
        });

        // Show failure notification
        await notificationService.notifyUploadFailed(uploadId, filename, error.message);
      }

      console.error(`Upload error: ${error.message}`);
    } catch (err) {
      console.error('Error handler error:', err);
    }
  }

  /**
   * Cancel an upload
   */
  async cancelUpload(uploadId) {
    this.activeUploads.delete(uploadId);

    await database.updateUploadProgress(uploadId, {
      status: 'cancelled'
    });

    // Remove from queue if present
    this.queue = this.queue.filter(item => item.id !== uploadId);
  }

  /**
   * Get current upload queue status
   */
  async getQueueStatus() {
    const uploads = await database.getUploadQueue();

    return {
      total: uploads.length,
      active: this.activeUploads.size,
      pending: uploads.filter(u => u.status === 'pending').length,
      completed: uploads.filter(u => u.status === 'completed').length,
      failed: uploads.filter(u => u.status === 'failed').length
    };
  }

  /**
   * Clear completed uploads from queue
   */
  async clearCompleted() {
    const uploads = await database.getUploadQueue();
    const completed = uploads.filter(u => u.status === 'completed');

    for (const upload of completed) {
      await database.db.runAsync(
        'DELETE FROM upload_queue WHERE id = ?',
        [upload.id]
      );
    }
  }
}

// Export singleton instance
const uploadManager = new UploadManager();
export default uploadManager;