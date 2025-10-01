/**
 * Formatters Utility
 * Common formatting functions for dates, file sizes, time, etc.
 */

const formatters = {
    /**
     * Format date as YYYY-MM-DD for input
     * @param {Date} date - Date object
     * @returns {string} Formatted date string
     */
    formatDateForInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    /**
     * Format bytes into human readable format
     * @param {number} bytes - Number of bytes
     * @returns {string} Formatted size string
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * Format time ago from timestamp
     * @param {Date|number} date - Date object or timestamp
     * @returns {string} Formatted time ago string
     */
    formatTimeAgo(date) {
        const dateObj = date instanceof Date ? date : new Date(date * 1000);
        const now = new Date();
        const diffMs = now - dateObj;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);

        if (diffSec < 60) {
            return `${diffSec} second${diffSec === 1 ? '' : 's'} ago`;
        } else if (diffMin < 60) {
            return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
        } else if (diffHour < 24) {
            return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`;
        } else {
            return dateObj.toLocaleString();
        }
    },

    /**
     * Format seconds to MM:SS
     * @param {number} seconds - Number of seconds
     * @returns {string} Formatted time string
     */
    formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${String(secs).padStart(2, '0')}`;
    },

    /**
     * Sanitize filename (client-side approximation of server logic)
     * @param {string} filename - Original filename
     * @returns {string} Sanitized filename
     */
    sanitizeFilename(filename) {
        // Split name and extension
        const lastDot = filename.lastIndexOf('.');
        let name = lastDot > -1 ? filename.substring(0, lastDot) : filename;
        const ext = lastDot > -1 ? filename.substring(lastDot + 1) : '';

        // Replace invalid characters
        const replacements = {
            '/': '-',
            '\\': '-',
            ':': '-',
            '*': '-',
            '?': '-',
            '"': '',
            '<': '-',
            '>': '-',
            '|': '-'
        };

        for (const [char, replacement] of Object.entries(replacements)) {
            name = name.split(char).join(replacement);
        }

        // Remove multiple spaces/dashes
        name = name.replace(/\s+/g, ' ').replace(/-+/g, '-');

        // Trim
        name = name.trim().replace(/^-+|-+$/g, '');

        // Ensure not empty
        if (!name) name = 'unnamed';

        return ext ? `${name}.${ext}` : name;
    },

    /**
     * Format upload speed (MB/s or Mbps)
     * @param {number} bytesPerSecond - Bytes per second
     * @param {boolean} useBits - Use bits instead of bytes (Mbps)
     * @returns {string} Formatted speed string
     */
    formatSpeed(bytesPerSecond, useBits = false) {
        if (useBits) {
            const mbps = (bytesPerSecond * 8) / (1024 * 1024);
            return `${mbps.toFixed(2)} Mbps`;
        } else {
            const mbps = bytesPerSecond / (1024 * 1024);
            return `${mbps.toFixed(2)} MB/s`;
        }
    },

    /**
     * Truncate string with ellipsis
     * @param {string} str - String to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string} Truncated string
     */
    truncate(str, maxLength = 50) {
        if (str.length <= maxLength) return str;
        return str.substring(0, maxLength - 3) + '...';
    }
};