/**
 * Upload Service
 * Centralized upload state management and polling
 * Replaces global variables: upload_status, pollInterval, lastDryRunReport
 */

class UploadService {
    constructor() {
        this.state = {
            active: false,
            complete: true,
            paused: false,
            total: 0,
            completed: 0,
            failed: 0,
            in_progress: 0,
            current_upload: null,
            completed_uploads: [],
            failed_uploads: [],
            pending_uploads: [],
            recent_uploads: [],
            cancel_requested: false
        };

        this.lastDryRunReport = null;
        this.pollInterval = null;
        this.pollIntervalMs = 1000;
        this.subscribers = [];
        this.lastUploadOperation = null; // For retry after auth
    }

    /**
     * Subscribe to state changes
     * @param {Function} callback - Called when state changes
     * @returns {Function} Unsubscribe function
     */
    subscribe(callback) {
        this.subscribers.push(callback);
        // Return unsubscribe function
        return () => {
            this.subscribers = this.subscribers.filter(cb => cb !== callback);
        };
    }

    /**
     * Notify all subscribers of state change
     */
    notifySubscribers() {
        this.subscribers.forEach(callback => {
            try {
                callback(this.state);
            } catch (error) {
                console.error('Error in upload service subscriber:', error);
            }
        });
    }

    /**
     * Update state and notify subscribers
     * @param {object} newState - Partial state update
     */
    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.notifySubscribers();
    }

    /**
     * Get current state (read-only)
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Start polling upload status
     */
    startPolling() {
        if (this.pollInterval) {
            clearTimeout(this.pollInterval);
        }

        this.poll();
    }

    /**
     * Stop polling upload status
     */
    stopPolling() {
        if (this.pollInterval) {
            clearTimeout(this.pollInterval);
            this.pollInterval = null;
        }
    }

    /**
     * Poll upload status from server
     */
    async poll() {
        try {
            const data = await apiClient.getUploadStatus();
            this.setState(data);

            // Continue polling if upload is active and not complete
            if (data.active && !data.complete) {
                this.pollInterval = setTimeout(() => this.poll(), this.pollIntervalMs);
            } else {
                this.stopPolling();
            }
        } catch (error) {
            console.error('Error polling upload status:', error);
            // Retry polling after error
            this.pollInterval = setTimeout(() => this.poll(), this.pollIntervalMs * 2);
        }
    }

    /**
     * Initiate upload (dry run or real)
     * @param {boolean} isDryRun - Whether this is a preview
     * @returns {Promise<object>} Upload result
     */
    async initiateUpload(isDryRun = false) {
        // Store operation for potential retry after auth
        this.lastUploadOperation = { isDryRun };

        try {
            const data = await apiClient.uploadVideos(isDryRun);

            if (data.success) {
                if (isDryRun) {
                    this.lastDryRunReport = data.report;
                } else {
                    // Start polling for real upload
                    this.startPolling();
                }
            }

            return data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Pause current upload
     */
    async pauseUpload() {
        try {
            const result = await apiClient.pauseUpload();
            if (result.success) {
                await this.poll(); // Update state immediately
            }
            return result;
        } catch (error) {
            console.error('Error pausing upload:', error);
            throw error;
        }
    }

    /**
     * Resume paused upload
     */
    async resumeUpload() {
        try {
            const result = await apiClient.resumeUpload();
            if (result.success) {
                await this.poll(); // Update state immediately
            }
            return result;
        } catch (error) {
            console.error('Error resuming upload:', error);
            throw error;
        }
    }

    /**
     * Cancel upload
     * @param {string} videoId - Specific video ID to cancel, or null for all
     */
    async cancelUpload(videoId = null) {
        try {
            const result = await apiClient.cancelUpload(videoId);
            if (result.success) {
                await this.poll(); // Update state immediately
            }
            return result;
        } catch (error) {
            console.error('Error cancelling upload:', error);
            throw error;
        }
    }

    /**
     * Clear upload status (after completion)
     */
    async clearStatus() {
        try {
            const result = await apiClient.clearUploadStatus();
            if (result.success) {
                this.setState({
                    active: false,
                    total: 0,
                    completed: 0,
                    failed: 0,
                    in_progress: 0,
                    complete: true,
                    recent_uploads: [],
                    cancel_requested: false,
                    current_upload: null,
                    paused: false,
                    completed_uploads: [],
                    failed_uploads: [],
                    pending_uploads: []
                });
            }
            return result;
        } catch (error) {
            console.error('Error clearing upload status:', error);
            throw error;
        }
    }

    /**
     * Get last dry run report
     */
    getLastDryRunReport() {
        return this.lastDryRunReport;
    }

    /**
     * Get last upload operation (for retry after auth)
     */
    getLastUploadOperation() {
        return this.lastUploadOperation;
    }

    /**
     * Retry last upload operation
     */
    async retryLastOperation() {
        if (this.lastUploadOperation) {
            return this.initiateUpload(this.lastUploadOperation.isDryRun);
        }
        throw new Error('No operation to retry');
    }

    /**
     * Check if upload is in progress
     */
    isActive() {
        return this.state.active && !this.state.complete;
    }

    /**
     * Check if upload is paused
     */
    isPaused() {
        return this.state.paused;
    }

    /**
     * Check if upload is complete
     */
    isComplete() {
        return this.state.complete;
    }
}

// Export singleton instance
const uploadService = new UploadService();