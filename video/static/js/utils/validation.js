/**
 * Validation Utility
 * Input validation functions
 */

const validation = {
    /**
     * Validate boat name
     * @param {string} boatName - Boat name to validate
     * @returns {object} { valid: boolean, error: string }
     */
    validateBoatName(boatName) {
        if (!boatName || !boatName.trim()) {
            return { valid: false, error: 'Boat name is required' };
        }

        if (boatName.length > 100) {
            return { valid: false, error: 'Boat name must be less than 100 characters' };
        }

        return { valid: true, error: null };
    },

    /**
     * Validate date
     * @param {string} dateString - Date string in YYYY-MM-DD format
     * @returns {object} { valid: boolean, error: string }
     */
    validateDate(dateString) {
        if (!dateString) {
            return { valid: false, error: 'Date is required' };
        }

        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return { valid: false, error: 'Invalid date format' };
        }

        // Check if date is in the future
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (date > today) {
            return { valid: false, error: 'Date cannot be in the future' };
        }

        return { valid: true, error: null };
    },

    /**
     * Validate videos per boat count
     * @param {number} count - Number of videos per boat
     * @returns {object} { valid: boolean, error: string }
     */
    validateVideosPerBoat(count) {
        const num = parseInt(count);

        if (isNaN(num) || num < 1) {
            return { valid: false, error: 'Videos per boat must be at least 1' };
        }

        if (num > 20) {
            return { valid: false, error: 'Videos per boat cannot exceed 20' };
        }

        return { valid: true, error: null };
    },

    /**
     * Validate video file
     * @param {File} file - File object
     * @returns {object} { valid: boolean, error: string }
     */
    validateVideoFile(file) {
        if (!file) {
            return { valid: false, error: 'No file provided' };
        }

        // Check file type
        const validExtensions = ['.mp4', '.mov', '.avi', '.wmv'];
        const fileName = file.name.toLowerCase();
        const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));

        if (!hasValidExtension) {
            return {
                valid: false,
                error: `Invalid file type. Supported formats: ${validExtensions.join(', ')}`
            };
        }

        // Check file size (max 5GB)
        const maxSize = 5 * 1024 * 1024 * 1024; // 5GB in bytes
        if (file.size > maxSize) {
            return {
                valid: false,
                error: 'File size exceeds maximum limit of 5GB'
            };
        }

        return { valid: true, error: null };
    },

    /**
     * Validate directory path
     * @param {string} path - Directory path
     * @returns {object} { valid: boolean, error: string }
     */
    validateDirectoryPath(path) {
        if (!path || !path.trim()) {
            return { valid: false, error: 'Directory path is required' };
        }

        // Basic path validation (more thorough validation happens on backend)
        if (path.length > 500) {
            return { valid: false, error: 'Path is too long' };
        }

        return { valid: true, error: null };
    },

    /**
     * Validate multiple boat names (newline or comma separated)
     * @param {string} boatNamesText - Text with multiple boat names
     * @returns {object} { valid: boolean, error: string, boatNames: string[] }
     */
    validateBoatNamesList(boatNamesText) {
        if (!boatNamesText || !boatNamesText.trim()) {
            return { valid: false, error: 'At least one boat name is required', boatNames: [] };
        }

        // Split by newlines or commas
        const boatNames = boatNamesText
            .split(/[\n,]+/)
            .map(name => name.trim())
            .filter(name => name !== '');

        if (boatNames.length === 0) {
            return { valid: false, error: 'At least one boat name is required', boatNames: [] };
        }

        // Validate each boat name
        for (const name of boatNames) {
            const result = validation.validateBoatName(name);
            if (!result.valid) {
                return { valid: false, error: `Invalid boat name "${name}": ${result.error}`, boatNames: [] };
            }
        }

        return { valid: true, error: null, boatNames };
    },

    /**
     * Validate size range
     * @param {number} minSize - Minimum size in MB
     * @param {number} maxSize - Maximum size in MB
     * @returns {object} { valid: boolean, error: string }
     */
    validateSizeRange(minSize, maxSize) {
        const min = parseFloat(minSize);
        const max = parseFloat(maxSize);

        if (isNaN(min) || min < 0) {
            return { valid: false, error: 'Minimum size must be a positive number' };
        }

        if (isNaN(max) || max < 0) {
            return { valid: false, error: 'Maximum size must be a positive number' };
        }

        if (min >= max) {
            return { valid: false, error: 'Minimum size must be less than maximum size' };
        }

        return { valid: true, error: null };
    }
};