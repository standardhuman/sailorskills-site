/**
 * API Client Service
 * Centralized API communication with error handling and retry logic
 */

class APIClient {
    constructor(baseURL = '') {
        this.baseURL = baseURL;
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        };
    }

    /**
     * Generic fetch wrapper with error handling
     * @param {string} endpoint - API endpoint
     * @param {object} options - Fetch options
     * @returns {Promise<object>} Response data
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            ...options,
            headers: {
                ...this.defaultHeaders,
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    }

    /**
     * GET request
     */
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    /**
     * POST request
     */
    async post(endpoint, body = null) {
        const options = {
            method: 'POST'
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        return this.request(endpoint, options);
    }

    /**
     * Video API endpoints
     */
    async getSourceVideos() {
        return this.get('/api/source-videos');
    }

    async getUploadReadyVideos() {
        return this.get('/api/upload-ready-videos');
    }

    async uploadSourceVideo(file, onProgress = null) {
        const formData = new FormData();
        formData.append('file', file);

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/upload-source-video', true);

            if (onProgress) {
                xhr.upload.onprogress = (e) => {
                    if (e.lengthComputable) {
                        const percentComplete = (e.loaded / e.total) * 100;
                        onProgress(percentComplete, e.loaded, e.total);
                    }
                };
            }

            xhr.onload = () => {
                try {
                    const response = JSON.parse(xhr.responseText);
                    if (xhr.status === 200 && response.success) {
                        resolve(response);
                    } else {
                        reject(new Error(response.error || 'Upload failed'));
                    }
                } catch (error) {
                    reject(error);
                }
            };

            xhr.onerror = () => reject(new Error('Network error during upload'));
            xhr.send(formData);
        });
    }

    async deleteSourceVideo(filePath) {
        return this.post('/api/delete-source-video', { file_path: filePath });
    }

    async undoDeleteVideo(filename) {
        return this.post('/api/undo-delete-video', { filename });
    }

    async getDeletedVideos() {
        return this.get('/api/get-deleted-videos');
    }

    /**
     * Rename API endpoints
     */
    async previewRename(boatNames, selectedDate, videosPerBoat) {
        return this.post('/api/preview-rename', {
            boat_names: boatNames,
            selected_date: selectedDate,
            videos_per_boat: videosPerBoat
        });
    }

    async renameVideos(payload) {
        return this.post('/api/rename-videos', payload);
    }

    async undoRename() {
        return this.post('/api/undo-rename');
    }

    /**
     * Upload API endpoints
     */
    async uploadVideos(dryRun = false) {
        return this.post('/api/upload-videos', { dry_run: dryRun });
    }

    async getUploadStatus() {
        return this.get('/api/upload-status');
    }

    async pauseUpload() {
        return this.post('/api/pause-upload');
    }

    async resumeUpload() {
        return this.post('/api/resume-upload');
    }

    async cancelUpload(videoId = null) {
        return this.post('/api/cancel-upload', { video_id: videoId });
    }

    async clearUploadStatus() {
        return this.post('/api/clear-upload-status');
    }

    /**
     * Settings API endpoints
     */
    async saveDirectorySettings(sourceDir, uploadDir, archiveDir) {
        return this.post('/api/save-directory-settings', {
            source_dir: sourceDir,
            upload_dir: uploadDir,
            archive_dir: archiveDir
        });
    }

    async saveYouTubeSettings(defaultPrivacy, autoCreatePlaylists) {
        return this.post('/api/save-youtube-settings', {
            default_privacy: defaultPrivacy,
            auto_create_playlists: autoCreatePlaylists
        });
    }

    async saveVideoSettings(minSizeMB, maxSizeMB) {
        return this.post('/api/save-video-settings', {
            min_size_mb: minSizeMB,
            max_size_mb: maxSizeMB
        });
    }

    async saveUploadSettings(throttlingEnabled, maxUploadRateMbps) {
        return this.post('/api/save-upload-settings', {
            throttling_enabled: throttlingEnabled,
            max_upload_rate_mbps: maxUploadRateMbps
        });
    }

    /**
     * YouTube Auth endpoints
     */
    async getYouTubeAuthStatus() {
        return this.get('/api/youtube-auth-status');
    }

    async getYouTubeAuthURL() {
        return this.get('/api/youtube-auth-url');
    }

    /**
     * Folder operations
     */
    async openFolder(folderPath) {
        return this.post('/api/open-folder', { folder_path: folderPath });
    }
}

// Export singleton instance
const apiClient = new APIClient();