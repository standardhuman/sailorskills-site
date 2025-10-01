/**
 * Alert Service
 * Unified notification system for user feedback
 * Consolidates: showAlert, showSettingsAlert, showYouTubeSettingsAlert,
 * showVideoSettingsAlert, showUploadSettingsAlert
 */

class AlertService {
    constructor() {
        this.defaultDismissTime = 10000; // 10 seconds for success/info
        this.contexts = {
            global: 'alert-container',
            step1: 'step1-alert-container',
            step2: 'step2-alert-container',
            step3: 'step3-alert-container',
            settings: 'settings-alert',
            youtubeSettings: 'youtube-settings-alert',
            videoSettings: 'video-settings-alert',
            uploadSettings: 'upload-settings-alert'
        };
    }

    /**
     * Show an alert message
     * @param {string} message - Alert message
     * @param {string} type - Alert type: success, danger, warning, info
     * @param {string} context - Alert context (global, step1, step2, etc.)
     * @param {boolean} autoDismiss - Auto dismiss for success/info alerts
     */
    show(message, type = 'info', context = 'global', autoDismiss = true) {
        const containerId = this.contexts[context] || this.contexts.global;
        const container = document.getElementById(containerId);

        if (!container) {
            // Fallback to browser alert if container not found
            console.warn(`Alert container '${containerId}' not found, using browser alert`);
            alert(message);
            return;
        }

        // Create alert element
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.role = 'alert';
        alert.innerHTML = `
            ${message}
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        `;

        container.appendChild(alert);
        container.style.display = 'block';

        // Auto-dismiss success and info alerts
        if (autoDismiss && (type === 'success' || type === 'info')) {
            setTimeout(() => {
                this.dismiss(alert);
            }, this.defaultDismissTime);
        }

        return alert;
    }

    /**
     * Dismiss an alert
     * @param {HTMLElement} alert - Alert element to dismiss
     */
    dismiss(alert) {
        if (alert && alert.parentNode) {
            if (typeof $ !== 'undefined' && $(alert).alert) {
                $(alert).alert('close');
            } else {
                alert.remove();
            }
        }
    }

    /**
     * Clear all alerts in a context
     * @param {string} context - Alert context to clear
     */
    clear(context = 'global') {
        const containerId = this.contexts[context] || this.contexts.global;
        const container = document.getElementById(containerId);

        if (container) {
            container.innerHTML = '';
            container.style.display = 'none';
        }
    }

    /**
     * Show success alert
     */
    success(message, context = 'global') {
        return this.show(message, 'success', context);
    }

    /**
     * Show error alert
     */
    error(message, context = 'global') {
        return this.show(message, 'danger', context, false);
    }

    /**
     * Show warning alert
     */
    warning(message, context = 'global') {
        return this.show(message, 'warning', context, false);
    }

    /**
     * Show info alert
     */
    info(message, context = 'global') {
        return this.show(message, 'info', context);
    }

    /**
     * Show alert with undo button
     * @param {string} message - Alert message
     * @param {Function} undoCallback - Callback when undo is clicked
     * @param {string} context - Alert context
     * @returns {HTMLElement} Alert element
     */
    showWithUndo(message, undoCallback, context = 'global') {
        const containerId = this.contexts[context] || this.contexts.global;
        const container = document.getElementById(containerId);

        if (!container) {
            console.warn(`Alert container '${containerId}' not found`);
            return null;
        }

        const alert = document.createElement('div');
        alert.className = 'alert alert-success alert-dismissible fade show';
        alert.role = 'alert';
        alert.innerHTML = `
            ${message}
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
            <button type="button" class="btn btn-sm btn-outline-success ml-2 undo-btn">
                <i class="fas fa-undo"></i> Undo
            </button>
        `;

        const undoBtn = alert.querySelector('.undo-btn');
        undoBtn.addEventListener('click', () => {
            undoCallback();
            this.dismiss(alert);
        });

        container.appendChild(alert);
        container.style.display = 'block';

        // Auto-dismiss after 30 seconds
        setTimeout(() => {
            this.dismiss(alert);
        }, 30000);

        return alert;
    }

    /**
     * Show loading alert
     * @param {string} message - Loading message
     * @param {string} context - Alert context
     * @returns {HTMLElement} Alert element
     */
    showLoading(message, context = 'global') {
        const containerId = this.contexts[context] || this.contexts.global;
        const container = document.getElementById(containerId);

        if (!container) {
            return null;
        }

        const alert = document.createElement('div');
        alert.className = 'alert alert-info';
        alert.role = 'alert';
        alert.innerHTML = `
            <span class="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
            ${message}
        `;

        container.appendChild(alert);
        container.style.display = 'block';

        return alert;
    }

    /**
     * Convenience methods for different contexts
     */

    // Step-specific methods
    showInStep1(message, type = 'info') {
        return this.show(message, type, 'step1');
    }

    showInStep2(message, type = 'info') {
        return this.show(message, type, 'step2');
    }

    showInStep3(message, type = 'info') {
        return this.show(message, type, 'step3');
    }

    // Settings-specific methods
    showInSettings(message, type = 'info') {
        return this.show(message, type, 'settings');
    }

    showInYouTubeSettings(message, type = 'info') {
        return this.show(message, type, 'youtubeSettings');
    }

    showInVideoSettings(message, type = 'info') {
        return this.show(message, type, 'videoSettings');
    }

    showInUploadSettings(message, type = 'info') {
        return this.show(message, type, 'uploadSettings');
    }
}

// Export singleton instance
const alertService = new AlertService();