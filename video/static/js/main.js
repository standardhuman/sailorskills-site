/* BOATY - Main JavaScript */

// Global variables for step navigation
let workflowSections = [];
let breadcrumbItems = [];
let pollInterval = null; // Declare pollInterval globally

// Function to toggle section visibility (collapse/expand)
function toggleSection(sectionId, forceCollapse = null) {
    const section = document.getElementById(sectionId);
    if (!section) return;

    const body = section.querySelector('.card-body');
    const icon = section.querySelector('.card-header .fas');

    let isCollapsed;

    if (forceCollapse === true) {
        isCollapsed = false; // We want to make it collapsed, so act as if it's currently expanded
    } else if (forceCollapse === false) {
        isCollapsed = true; // We want to make it expanded, so act as if it's currently collapsed
    } else {
        isCollapsed = section.classList.contains('collapsed');
    }

    if (isCollapsed) {
        // Expand
        section.classList.remove('collapsed');
        if (body) body.style.height = body.scrollHeight + 'px'; // Animate to full height
        if (icon) icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
        // After animation, remove explicit height to allow dynamic content
        setTimeout(() => {
            if (body && !section.classList.contains('collapsed')) { // Check if still expanded
                body.style.height = '';
            }
        }, 300); // Match CSS transition duration
    } else {
        // Collapse
        if (body) body.style.height = body.scrollHeight + 'px'; // Set initial height for animation
        section.classList.add('collapsed');
        if (body) body.style.height = '0px'; // Animate to 0
        if (icon) icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize UI elements
    initializeDatePicker();
    setupVideoCountHandler();
    setupFormSubmitHandlers();
    // Load content directly instead of using tabs
    loadInitialContent();
    setupDirectorySettingsHandler();
    setupYouTubeSettingsHandler();
    setupDragAndDrop();
    setupVideoFilterControls();
    loadSourceVideos();
    loadUploadReadyVideos();
    
    // Setup rename preview handlers
    if (typeof setupRenamePreviewHandlers === 'function') {
        setupRenamePreviewHandlers();
    }
    
    // Assign global variables after DOM is loaded
    breadcrumbItems = document.querySelectorAll('.workflow-breadcrumb .breadcrumb-item');
    workflowSections = [
        document.getElementById('source-videos-section'),
        document.getElementById('rename-section'),
        document.getElementById('upload-section')
    ];
    
    // Initial state: show first step only
    showStep(1);
    
    // Breadcrumb click handlers (use the globally defined showStep)
    breadcrumbItems.forEach((item, idx) => {
        item.addEventListener('click', function() {
            showStep(idx + 1);
        });
    });

    // --- Folder Access Button Handlers ---
    document.getElementById('open-source-folder').addEventListener('click', function() {
        openFolder(document.getElementById('source-dir').value);
    });
    document.getElementById('open-upload-folder').addEventListener('click', function() {
        openFolder(document.getElementById('upload-dir').value);
    });
    document.getElementById('open-archive-folder').addEventListener('click', function() {
        openFolder(document.getElementById('archive-dir').value);
    });
    // Add handler for Downloads Folder
    const downloadsBtn = document.getElementById('open-downloads-folder');
    if (downloadsBtn) {
        downloadsBtn.addEventListener('click', function() {
            // Use a placeholder path; ideally, fetch from backend or config for cross-platform
            openFolder('~/Downloads');
        });
    }
    // Add handler for Next: Rename Videos button (uses the globally defined showStep)
    const nextToRenameBtn = document.getElementById('next-to-rename-btn');
    if (nextToRenameBtn) {
        nextToRenameBtn.addEventListener('click', function() {
            showStep(2); // Directly call global showStep
        });
    }

    // Add style for collapsed sections
    const style = document.createElement('style');
    style.textContent = `
        .collapsed .card-body {
            display: block;
            overflow: hidden;
            height: 0;
        }
        .card-header .fas {
            transition: transform 0.3s ease;
        }
        .collapsed .card-header .fas {
            transform: rotate(180deg);
        }
    `;
    document.head.appendChild(style);
    
    // Initialize collapsible sections
    const sections = ['source-videos-section', 'rename-section', 'upload-section'];
    sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
            const header = section.querySelector('.card-header');
            if (header) {
                // Add expand/collapse icon
                const icon = document.createElement('i');
                icon.className = 'fas fa-chevron-up float-right mt-1';
                header.appendChild(icon);
                
                // Add click handler
                header.style.cursor = 'pointer';
                header.addEventListener('click', () => toggleSection(sectionId));
            }
        }
    });

    // --- FIX: Prevent default drag/drop on page except dropzone and its children ---
    document.addEventListener('dragover', function(e) {
        const dropzone = document.getElementById('dropzone');
        if (!dropzone || !dropzone.contains(e.target)) {
            e.preventDefault();
            e.stopPropagation();
        }
    });
    document.addEventListener('drop', function(e) {
        const dropzone = document.getElementById('dropzone');
        if (!dropzone || !dropzone.contains(e.target)) {
            e.preventDefault();
            e.stopPropagation();
        }
    });
    // --- END FIX ---
});

// Initialize date picker with default to today
function initializeDatePicker() {
    const today = new Date();
    const dateInput = document.getElementById('selected-date');
    if (dateInput) {
        const formattedDate = formatDate(today);
        dateInput.value = formattedDate;
    }
}

// Format date as YYYY-MM-DD for input
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Handle videos per boat count changes
function setupVideoCountHandler() {
    const videosPerBoatInput = document.getElementById('videos-per-boat');
    const customSuffixContainer = document.getElementById('custom-suffix-container');
    const videoPurposeContainer = document.getElementById('video-purpose-container');
    
    if (videosPerBoatInput && customSuffixContainer) {
        videosPerBoatInput.addEventListener('change', function() {
            const count = parseInt(this.value);
            updateCustomSuffixInputs(count);
            updateVideoPurposeSelector(count);
        });
        
        // Initial setup
        const initialCount = parseInt(videosPerBoatInput.value) || 2;
        updateCustomSuffixInputs(initialCount);
        updateVideoPurposeSelector(initialCount);
    }
    
    // Setup purpose template selector
    const purposeTemplate = document.getElementById('purpose-template');
    const purposeVideoNumber = document.getElementById('purpose-video-number');
    const applyPurposeBtn = document.getElementById('apply-purpose-btn');
    
    if (purposeTemplate && purposeVideoNumber && applyPurposeBtn) {
        applyPurposeBtn.addEventListener('click', function() {
            applyVideoPurpose();
        });
    }
}

// Update custom suffix inputs based on videos per boat
function updateCustomSuffixInputs(count) {
    const container = document.getElementById('custom-suffix-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (count <= 2) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    
    // Create header
    const header = document.createElement('h5');
    header.textContent = 'Custom Suffixes';
    container.appendChild(header);
    
    // Create suffix inputs
    for (let i = 1; i <= count; i++) {
        const defaultSuffix = i === 1 ? 'Before' : (i === count ? 'After' : `Item of note ${i-1}`);
        
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group suffix-input-group';
        
        const label = document.createElement('label');
        label.textContent = `Video ${i} Suffix:`;
        label.htmlFor = `suffix-${i}`;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'form-control';
        input.id = `suffix-${i}`;
        input.name = `suffix-${i}`;
        input.placeholder = defaultSuffix;
        input.value = defaultSuffix;
        
        formGroup.appendChild(label);
        formGroup.appendChild(input);
        container.appendChild(formGroup);
    }
}

// Update video purpose selector based on videos per boat count
function updateVideoPurposeSelector(count) {
    const container = document.getElementById('video-purpose-container');
    const purposeVideoNumber = document.getElementById('purpose-video-number');
    
    if (!container || !purposeVideoNumber) return;
    
    // Clear existing options
    purposeVideoNumber.innerHTML = '';
    
    if (count <= 2) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    
    // Add options for each video number
    for (let i = 1; i <= count; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `Video ${i}`;
        purposeVideoNumber.appendChild(option);
    }
}

// Apply selected purpose to the chosen video number
function applyVideoPurpose() {
    const purposeTemplate = document.getElementById('purpose-template');
    const purposeVideoNumber = document.getElementById('purpose-video-number');
    
    if (!purposeTemplate || !purposeVideoNumber) return;
    
    const purpose = purposeTemplate.value;
    const videoNumber = purposeVideoNumber.value;
    
    if (!purpose || !videoNumber) {
        showAlert('warning', 'Please select both a purpose and a video number', 'step2');
        return;
    }
    
    // Find the corresponding suffix input
    const suffixInput = document.getElementById(`suffix-${videoNumber}`);
    if (suffixInput) {
        suffixInput.value = purpose;
        showAlert('success', `Applied "${purpose}" to Video ${videoNumber}`, 'step2');
    } else {
        showAlert('danger', `Could not find input for Video ${videoNumber}`, 'step2');
    }
}

// Setup form submit handlers
function setupFormSubmitHandlers() {
    // Rename form
    const renameForm = document.getElementById('rename-form');
    if (renameForm) {
        renameForm.addEventListener('submit', function(e) {
            e.preventDefault();
            renameVideos();
        });
    }
    
    // Undo rename button
    const undoBtn = document.getElementById('undo-rename-button');
    if (undoBtn) {
        undoBtn.addEventListener('click', function() {
            performUndoRename();
        });
    }
    
    // Directory settings form
    const directorySettingsForm = document.getElementById('directory-settings-form');
    if (directorySettingsForm) {
        directorySettingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveDirectorySettings();
        });
    }
    
    // YouTube settings form
    const youtubeSettingsForm = document.getElementById('youtube-settings-form');
    if (youtubeSettingsForm) {
        youtubeSettingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveYouTubeSettings();
        });
    }
    
    // Video settings form
    const videoSettingsForm = document.getElementById('video-settings-form');
    if (videoSettingsForm) {
        videoSettingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveVideoSettings();
        });
    }
    
    // Upload throttling settings form
    const uploadSettingsForm = document.getElementById('upload-settings-form');
    if (uploadSettingsForm) {
        uploadSettingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveUploadSettings();
        });
    }
}

// Setup directory settings handler
function setupDirectorySettingsHandler() {
    // Browse buttons are just for show in this web app
    // In a desktop app, these would open file dialogs
    const browseButtons = [
        document.getElementById('browse-source-btn'),
        document.getElementById('browse-upload-btn'),
        document.getElementById('browse-archive-btn')
    ];
    
    browseButtons.forEach(button => {
        if (button) {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                showSettingsAlert('warning', 'Browse functionality is not available in the web app. Please enter the path manually.');
            });
        }
    });
}

// Save directory settings
function saveDirectorySettings() {
    const sourceDir = document.getElementById('source-dir').value;
    const uploadDir = document.getElementById('upload-dir').value;
    const archiveDir = document.getElementById('archive-dir').value;
    
    if (!sourceDir || !uploadDir || !archiveDir) {
        showSettingsAlert('danger', 'All directory paths are required.');
        return;
    }
    
    // Show loading indicator
    const submitBtn = document.querySelector('#directory-settings-form button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
    submitBtn.disabled = true;
    
    // Send save request
    fetch('/api/save-directory-settings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            source_dir: sourceDir,
            upload_dir: uploadDir,
            archive_dir: archiveDir
        })
    })
    .then(response => response.json())
    .then(data => {
        // Reset button
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
        
        if (data.success) {
            showSettingsAlert('success', 'Directory settings saved successfully. The page will refresh in 2 seconds.');
            // Refresh the page after 2 seconds
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } else {
            showSettingsAlert('danger', `Error saving directory settings: ${data.error}`);
        }
    })
    .catch(error => {
        console.error('Error saving directory settings:', error);
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
        showSettingsAlert('danger', 'Error saving directory settings. Please check the console for details.');
    });
}

// Setup YouTube settings handler
function setupYouTubeSettingsHandler() {
    // Nothing special to setup here, just making it consistent with directory settings
}

// Save YouTube settings
function saveYouTubeSettings() {
    const privacySetting = document.getElementById('privacy-setting').value;
    const autoCreatePlaylists = document.getElementById('auto-create-playlists').checked;
    
    // Show loading indicator
    const submitBtn = document.querySelector('#youtube-settings-form button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
    submitBtn.disabled = true;
    
    // Send save request
    fetch('/api/save-youtube-settings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            default_privacy: privacySetting,
            auto_create_playlists: autoCreatePlaylists
        })
    })
    .then(response => response.json())
    .then(data => {
        // Reset button
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
        
        if (data.success) {
            showYouTubeSettingsAlert('success', 'YouTube settings saved successfully. The page will refresh in 2 seconds.');
            // Refresh the page after 2 seconds
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } else {
            showYouTubeSettingsAlert('danger', `Error saving YouTube settings: ${data.error}`);
        }
    })
    .catch(error => {
        console.error('Error saving YouTube settings:', error);
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
        showYouTubeSettingsAlert('danger', 'Error saving YouTube settings. Please check the console for details.');
    });
}

// Show settings alert for directory settings
function showSettingsAlert(type, message) {
    const alertContainer = document.getElementById('settings-alert');
    if (!alertContainer) return;
    
    // Create alert
    alertContainer.innerHTML = '';
    alertContainer.style.display = 'block';
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.role = 'alert';
    
    alert.innerHTML = `
        ${message}
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
    `;
    
    alertContainer.appendChild(alert);
}

// Show settings alert for YouTube settings
function showYouTubeSettingsAlert(type, message) {
    const alertContainer = document.getElementById('youtube-settings-alert');
    if (!alertContainer) return;
    
    // Create alert
    alertContainer.innerHTML = '';
    alertContainer.style.display = 'block';
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.role = 'alert';
    
    alert.innerHTML = `
        ${message}
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
    `;
    
    alertContainer.appendChild(alert);
}

// Load initial content (replacing tab handlers)
function loadInitialContent() {
    // Load videos when the page loads
                loadSourceVideos();
                loadUploadReadyVideos();
}

// Setup drag and drop functionality
function setupDragAndDrop() {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('file-input');
    const selectFilesBtn = document.getElementById('select-files-btn');
    
    if (!dropzone || !fileInput || !selectFilesBtn) return;
    
    // Handle drag over
    dropzone.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('dragover');
    });
    
    // Handle drag leave
    dropzone.addEventListener('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
    });
    
    // Handle drop
    dropzone.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
        
        // Get the files
        const files = e.dataTransfer.files;
        if (files.length === 0) return;
        
        // Process each file
        processFiles(files);
    });
    
    // Handle manual file input
    fileInput.addEventListener('change', function() {
        if (this.files.length === 0) return;
        processFiles(this.files);
    });
    
    // Only the button triggers the file input
    selectFilesBtn.addEventListener('click', function() {
        fileInput.click();
    });
}

// Process the uploaded files
function processFiles(files) {
    // Show alert that upload is starting
    showAlert('info', `Adding ${files.length} file(s)...`, 'step1');
    
    // Process each file
    Array.from(files).forEach(file => {
        uploadFile(file);
    });
}

// Upload a single file
function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    // Create or get progress container
    let progressContainer = document.getElementById('upload-progress-container');
    if (!progressContainer) {
        progressContainer = document.createElement('div');
        progressContainer.id = 'upload-progress-container';
        progressContainer.className = 'mt-3';
        const alertContainer = document.getElementById('step1-alert');
        if (alertContainer) {
            alertContainer.parentNode.insertBefore(progressContainer, alertContainer.nextSibling);
        }
    }
    
    // Create progress element for this file
    const progressElement = document.createElement('div');
    progressElement.className = 'card mb-2';
    progressElement.innerHTML = `
        <div class="card-body">
            <h6 class="card-title mb-2">${file.name}</h6>
            <div class="progress mb-2">
                <div class="progress-bar progress-bar-striped progress-bar-animated" 
                     role="progressbar" style="width: 0%" 
                     aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">0%</div>
            </div>
            <small class="text-muted transfer-stats"></small>
        </div>
    `;
    progressContainer.appendChild(progressElement);
    
    const progressBar = progressElement.querySelector('.progress-bar');
    const statsElement = progressElement.querySelector('.transfer-stats');
    
    // Track upload progress
    let startTime = Date.now();
    let uploadedBytes = 0;
    const totalBytes = file.size;
    
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload-source-video', true);
    
    xhr.upload.onprogress = function(e) {
        if (e.lengthComputable) {
            uploadedBytes = e.loaded;
            const progress = Math.round((e.loaded * 100) / e.total);
            progressBar.style.width = progress + '%';
            progressBar.setAttribute('aria-valuenow', progress);
            progressBar.textContent = progress + '%';
            
            // Calculate and display transfer rate
            const currentTime = Date.now();
            const elapsedSeconds = (currentTime - startTime) / 1000;
            const bytesPerSecond = uploadedBytes / elapsedSeconds;
            const mbps = (bytesPerSecond / (1024 * 1024)).toFixed(2);
            
            statsElement.textContent = `Transferred: ${formatBytes(uploadedBytes)} of ${formatBytes(totalBytes)} (${mbps} MB/s)`;
        }
    };
    
    xhr.onload = function() {
        try {
            const response = JSON.parse(xhr.responseText);
            if (response.success) {
                progressBar.classList.remove('progress-bar-animated');
                progressBar.classList.add('bg-success');
                
                // Display final transfer statistics
                const stats = response.file.transfer_stats;
                statsElement.innerHTML = `
                    Complete - ${formatBytes(totalBytes)} transferred in ${stats.time_seconds}s 
                    (avg. ${stats.speed_mbps} MB/s)
                `;
                
                showAlert('success', `Successfully added ${response.file.name}`, 'step1');
            loadSourceVideos();  // Reload the source videos list
        } else {
                progressBar.classList.remove('progress-bar-animated');
                progressBar.classList.add('bg-danger');
                statsElement.textContent = `Error: ${response.error}`;
                showAlert('danger', `Error adding ${file.name}: ${response.error}`, 'step1');
            }
        } catch (error) {
            progressBar.classList.remove('progress-bar-animated');
            progressBar.classList.add('bg-danger');
            statsElement.textContent = 'Error processing server response';
            showAlert('danger', `Error adding ${file.name}. Please check the console for details.`, 'step1');
        }
    };
    
    xhr.onerror = function() {
        progressBar.classList.remove('progress-bar-animated');
        progressBar.classList.add('bg-danger');
        statsElement.textContent = 'Network error occurred';
        showAlert('danger', `Error adding ${file.name}. Network error occurred.`, 'step1');
    };
    
    xhr.send(formData);
}

// Helper function to format bytes into human readable format
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Setup video size filter controls
function setupVideoFilterControls() {
    const applyFilterBtn = document.getElementById('apply-filter-btn');
    const clearFilterBtn = document.getElementById('clear-filter-btn');
    const sizeFilterMinInput = document.getElementById('size-filter-min');
    const sizeFilterMaxInput = document.getElementById('size-filter-max');
    
    if (!applyFilterBtn || !clearFilterBtn || !sizeFilterMinInput || !sizeFilterMaxInput) return;
    
    // Apply filter button
    applyFilterBtn.addEventListener('click', function() {
        const minSize = parseFloat(sizeFilterMinInput.value) || 0;
        const maxSize = parseFloat(sizeFilterMaxInput.value) || Infinity;
        filterVideosBySize(minSize, maxSize);
    });
    
    // Clear filter button
    clearFilterBtn.addEventListener('click', function() {
        sizeFilterMinInput.value = "1";
        sizeFilterMaxInput.value = "500";
        loadSourceVideos();
    });
}

// Filter videos by size
function filterVideosBySize(minSizeMB, maxSizeMB) {
    const container = document.getElementById('source-video-list');
    if (!container) return;
    
    // Find all video items
    const videoItems = container.querySelectorAll('.video-item');
    let smallCount = 0;
    let largeCount = 0;
    let totalCount = videoItems.length;
    
    // If no items, return
    if (totalCount === 0) return;
    
    videoItems.forEach(item => {
        // Get size from data attribute
        const size = parseFloat(item.getAttribute('data-size')) || 0;
        
        // Remove existing size classes
        item.classList.remove('small-video', 'large-video');
        
        // Check if too small
        if (size < minSizeMB) {
            item.classList.add('small-video');
            smallCount++;
        }
        // Check if too large
        else if (size > maxSizeMB) {
            item.classList.add('large-video');
            largeCount++;
        }
    });
    
    // Show alert with summary
    let message = '';
    if (smallCount > 0 && largeCount > 0) {
        message = `Found ${smallCount} video(s) smaller than ${minSizeMB} MB and ${largeCount} video(s) larger than ${maxSizeMB} MB out of ${totalCount} total video(s).`;
        showAlert('warning', message, 'step1');
    } else if (smallCount > 0) {
        message = `Found ${smallCount} video(s) smaller than ${minSizeMB} MB out of ${totalCount} total video(s).`;
        showAlert('warning', message, 'step1');
    } else if (largeCount > 0) {
        message = `Found ${largeCount} video(s) larger than ${maxSizeMB} MB out of ${totalCount} total video(s).`;
        showAlert('warning', message, 'step1');
    } else {
        message = `All ${totalCount} video(s) are between ${minSizeMB} MB and ${maxSizeMB} MB.`;
        showAlert('success', message, 'step1');
    }
}

// Save video settings
function saveVideoSettings() {
    const minSizeInput = document.getElementById('min-video-size');
    const maxSizeInput = document.getElementById('max-video-size');
    
    if (!minSizeInput || !maxSizeInput) {
        showVideoSettingsAlert('danger', 'Form elements not found.');
        return;
    }
    
    const minSizeMB = parseFloat(minSizeInput.value) || 0;
    const maxSizeMB = parseFloat(maxSizeInput.value) || 500;
    
    // Validate that min is less than max
    if (minSizeMB >= maxSizeMB) {
        showVideoSettingsAlert('danger', 'Minimum size must be less than maximum size.');
        return;
    }
    
    // Show loading indicator
    const submitBtn = document.querySelector('#video-settings-form button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
    submitBtn.disabled = true;
    
    // Send save request
    fetch('/api/save-video-settings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            min_size_mb: minSizeMB,
            max_size_mb: maxSizeMB
        })
    })
    .then(response => response.json())
    .then(data => {
        // Reset button
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
        
        if (data.success) {
            showVideoSettingsAlert('success', 'Video settings saved successfully.');
            // Update size filter inputs to match settings
            const sizeFilterMinInput = document.getElementById('size-filter-min');
            const sizeFilterMaxInput = document.getElementById('size-filter-max');
            if (sizeFilterMinInput) {
                sizeFilterMinInput.value = minSizeMB;
            }
            if (sizeFilterMaxInput) {
                sizeFilterMaxInput.value = maxSizeMB;
            }
        } else {
            showVideoSettingsAlert('danger', `Error saving video settings: ${data.error}`);
        }
    })
    .catch(error => {
        console.error('Error saving video settings:', error);
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
        showVideoSettingsAlert('danger', 'Error saving video settings. Please check the console for details.');
    });
}

// Show settings alert for video settings
function showVideoSettingsAlert(type, message) {
    const alertContainer = document.getElementById('video-settings-alert');
    if (!alertContainer) return;
    
    // Create alert
    alertContainer.innerHTML = '';
    alertContainer.style.display = 'block';
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.role = 'alert';
    
    alert.innerHTML = `
        ${message}
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
    `;
    
    alertContainer.appendChild(alert);
}

// Show settings alert for upload throttling settings
function showUploadSettingsAlert(type, message) {
    const alertContainer = document.getElementById('upload-settings-alert');
    if (!alertContainer) return;
    
    // Create alert
    alertContainer.innerHTML = '';
    alertContainer.style.display = 'block';
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.role = 'alert';
    
    alert.innerHTML = `
        ${message}
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
    `;
    
    alertContainer.appendChild(alert);
}

// Save upload throttling settings
function saveUploadSettings() {
    const throttlingEnabledCheckbox = document.getElementById('throttling-enabled');
    const maxUploadRateInput = document.getElementById('max-upload-rate');
    
    if (!throttlingEnabledCheckbox || !maxUploadRateInput) {
        showUploadSettingsAlert('danger', 'Form elements not found.');
        return;
    }
    
    const throttlingEnabled = throttlingEnabledCheckbox.checked;
    const maxUploadRateMbps = parseFloat(maxUploadRateInput.value) || 10.0;
    
    // Validate upload rate
    if (maxUploadRateMbps <= 0) {
        showUploadSettingsAlert('danger', 'Maximum upload rate must be greater than 0 Mbps.');
        return;
    }
    
    // Show loading indicator
    const submitBtn = document.querySelector('#upload-settings-form button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
    submitBtn.disabled = true;
    
    // Send save request
    fetch('/api/save-upload-settings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            throttling_enabled: throttlingEnabled,
            max_upload_rate_mbps: maxUploadRateMbps
        })
    })
    .then(response => response.json())
    .then(data => {
        // Reset button
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
        
        if (data.success) {
            showUploadSettingsAlert('success', 'Upload throttling settings saved successfully.');
        } else {
            showUploadSettingsAlert('danger', `Error saving upload settings: ${data.error}`);
        }
    })
    .catch(error => {
        console.error('Error saving upload settings:', error);
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
        showUploadSettingsAlert('danger', 'Error saving upload settings. Please check the console for details.');
    });
}

// Delete a source video
function deleteSourceVideo(filePath) {
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this video?')) {
        return;
    }
    
    fetch('/api/delete-source-video', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            file_path: filePath
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Show success message with undo option
            const filename = data.file;
            const alertContainer = document.getElementById('step1-alert-container');
            
            if (alertContainer) {
                const alert = document.createElement('div');
                alert.className = 'alert alert-success alert-dismissible fade show';
                alert.role = 'alert';
                
                alert.innerHTML = `
                    Successfully deleted ${filename}
                    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-success ml-2 undo-delete-btn" 
                            data-filename="${filename}">
                        <i class="fas fa-undo"></i> Undo
                    </button>
                `;
                
                alertContainer.appendChild(alert);
                
                // Add click handler for undo button
                const undoBtn = alert.querySelector('.undo-delete-btn');
                if (undoBtn) {
                    undoBtn.addEventListener('click', function() {
                        const filename = this.getAttribute('data-filename');
                        undoDeleteVideo(filename);
                        // Remove the alert
                        alert.remove();
                    });
                }
                
                // Auto-dismiss after 30 seconds
                setTimeout(() => {
                    if (alert.parentNode) {
                        $(alert).alert('close');
                    }
                }, 30000);
            }
            
            loadSourceVideos();  // Reload the source videos list
        } else {
            showAlert('danger', `Error deleting video: ${data.error}`, 'step1');
        }
    })
    .catch(error => {
        console.error('Error deleting video:', error);
        showAlert('danger', 'Error deleting video. Please check the console for details.', 'step1');
    });
}

// Undo delete video
function undoDeleteVideo(filename) {
    fetch('/api/undo-delete-video', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            filename: filename
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert('success', `Successfully restored ${data.file}`, 'step1');
            loadSourceVideos();  // Reload the source videos list
        } else {
            showAlert('danger', `Error restoring video: ${data.error}`, 'step1');
        }
    })
    .catch(error => {
        console.error('Error restoring video:', error);
        showAlert('danger', 'Error restoring video. Please check the console for details.', 'step1');
    });
}

// Get list of recently deleted videos
function getDeletedVideos() {
    fetch('/api/get-deleted-videos')
    .then(response => response.json())
    .then(data => {
        if (data.success && data.videos.length > 0) {
            // Show a dropdown of recently deleted videos
            const container = document.getElementById('source-video-list');
            if (!container) return;
            
            const deletedSection = document.createElement('div');
            deletedSection.className = 'deleted-videos-section mt-4';
            
            const header = document.createElement('h5');
            header.innerHTML = '<i class="fas fa-trash-alt"></i> Recently Deleted Videos';
            
            const list = document.createElement('ul');
            list.className = 'list-group';
            
            data.videos.forEach(video => {
                const item = document.createElement('li');
                item.className = 'list-group-item d-flex justify-content-between align-items-center';
                
                // Format the date
                const date = new Date(video.deleted_time * 1000);
                const timeAgo = formatTimeAgo(date);
                
                item.innerHTML = `
                    <div>
                        <span class="video-title">${video.filename}</span>
                        <small class="text-muted d-block">Deleted ${timeAgo}</small>
                    </div>
                    <button class="btn btn-sm btn-outline-success restore-btn" data-filename="${video.filename}">
                        <i class="fas fa-undo"></i> Restore
                    </button>
                `;
                
                list.appendChild(item);
            });
            
            deletedSection.appendChild(header);
            deletedSection.appendChild(list);
            
            // Check if deleted section already exists
            const existingSection = container.querySelector('.deleted-videos-section');
            if (existingSection) {
                container.replaceChild(deletedSection, existingSection);
            } else {
                container.appendChild(deletedSection);
            }
            
            // Add click handlers for restore buttons
            const restoreButtons = deletedSection.querySelectorAll('.restore-btn');
            restoreButtons.forEach(btn => {
                btn.addEventListener('click', function() {
                    const filename = this.getAttribute('data-filename');
                    undoDeleteVideo(filename);
                });
            });
        }
    })
    .catch(error => {
        console.error('Error getting deleted videos:', error);
    });
}

// Format time ago
function formatTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    
    if (diffSec < 60) {
        return `${diffSec} seconds ago`;
    } else if (diffMin < 60) {
        return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
    } else if (diffHour < 24) {
        return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`;
    } else {
        return date.toLocaleString();
    }
}

// --- Add global state for sorting and selection ---
let sourceVideoSort = { column: 'name', direction: 'asc' };
let selectedSourceVideos = new Set();

// --- Utility: Sort videos array ---
function sortVideos(videos, sort) {
    return videos.slice().sort((a, b) => {
        let valA, valB;
        switch (sort.column) {
            case 'name':
                valA = a.name.toLowerCase();
                valB = b.name.toLowerCase();
                break;
            case 'size':
                valA = a.size_mb;
                valB = b.size_mb;
                break;
            case 'date':
                valA = a.created;
                valB = b.created;
                break;
            default:
                valA = a.name.toLowerCase();
                valB = b.name.toLowerCase();
        }
        if (valA < valB) return sort.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sort.direction === 'asc' ? 1 : -1;
        return 0;
    });
}

// --- Utility: Render bulk actions toolbar ---
function renderBulkActionsToolbar(container, selectedCount) {
    let toolbar = document.getElementById('bulk-actions-toolbar');
    if (!toolbar) {
        toolbar = document.createElement('div');
        toolbar.id = 'bulk-actions-toolbar';
        toolbar.className = 'mb-2 d-flex align-items-center';
        container.prepend(toolbar);
    }
    toolbar.innerHTML = '';
    if (selectedCount > 0) {
        const countSpan = document.createElement('span');
        countSpan.className = 'mr-3 font-weight-bold';
        countSpan.textContent = `${selectedCount} selected`;
        toolbar.appendChild(countSpan);
        // Delete button
        const delBtn = document.createElement('button');
        delBtn.className = 'btn btn-danger btn-sm mr-2';
        delBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Delete Selected';
        delBtn.onclick = function() {
            if (confirm(`Delete ${selectedCount} selected file(s)? This cannot be undone.`)) {
                bulkDeleteSourceVideos(Array.from(selectedSourceVideos));
            }
        };
        toolbar.appendChild(delBtn);
        // Exclude/hide button
        const hideBtn = document.createElement('button');
        hideBtn.className = 'btn btn-secondary btn-sm mr-2';
        hideBtn.innerHTML = '<i class="fas fa-eye-slash"></i> Hide Selected';
        hideBtn.onclick = function() {
            bulkHideSourceVideos(Array.from(selectedSourceVideos));
        };
        toolbar.appendChild(hideBtn);
        // Download button (optional)
        const dlBtn = document.createElement('button');
        dlBtn.className = 'btn btn-info btn-sm';
        dlBtn.innerHTML = '<i class="fas fa-download"></i> Download Selected';
        dlBtn.onclick = function() {
            bulkDownloadSourceVideos(Array.from(selectedSourceVideos));
        };
        toolbar.appendChild(dlBtn);
    } else {
        toolbar.innerHTML = '';
    }
}

// --- Bulk action handlers ---
function bulkDeleteSourceVideos(paths) {
    let completed = 0;
    paths.forEach(path => {
        deleteSourceVideo(path);
        completed++;
        selectedSourceVideos.delete(path);
    });
    loadSourceVideos();
}
function bulkHideSourceVideos(paths) {
    // For now, just remove from view (not persistent)
    paths.forEach(path => {
        selectedSourceVideos.delete(path);
        const row = document.querySelector(`tr[data-path="${path}"]`);
        if (row) row.style.display = 'none';
    });
    renderBulkActionsToolbar(document.getElementById('source-video-list'), selectedSourceVideos.size);
}
function bulkDownloadSourceVideos(paths) {
    // For each, trigger download (assumes backend route exists)
    paths.forEach(path => {
        const a = document.createElement('a');
        a.href = `/download?path=${encodeURIComponent(path)}`;
        a.download = '';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });
}

// Load source videos
function loadSourceVideos() {
    const container = document.getElementById('source-video-list');
    if (!container) return;
    fetch('/api/source-videos')
        .then(response => response.json())
        .then(data => {
            container.innerHTML = '';
            selectedSourceVideos = new Set(selectedSourceVideos); // preserve selection
            if (data.videos.length === 0) {
                container.innerHTML = '<div class="alert alert-info">No source videos found. Drag and drop videos or use the "Select Files" button to add videos.</div>';
                renderBulkActionsToolbar(container, 0);
                return;
            }
            // Sort videos
            const videos = sortVideos(data.videos, sourceVideoSort);
            // Bulk actions toolbar
            renderBulkActionsToolbar(container, selectedSourceVideos.size);
            // Create table
            const table = document.createElement('table');
            table.className = 'table table-sm table-hover table-bordered source-videos-table';
            table.setAttribute('aria-label', 'Available Source Videos');
            // Table head
            const thead = document.createElement('thead');
            thead.innerHTML = `
                <tr>
                    <th scope="col"><input type="checkbox" id="select-all-source-videos"></th>
                    <th scope="col" class="sortable" data-sort="name">Filename <span class="sort-indicator">${sourceVideoSort.column==='name'?(sourceVideoSort.direction==='asc'?'▲':'▼'):''}</span></th>
                    <th scope="col" class="sortable" data-sort="size">Size (MB) <span class="sort-indicator">${sourceVideoSort.column==='size'?(sourceVideoSort.direction==='asc'?'▲':'▼'):''}</span></th>
                    <th scope="col" class="sortable" data-sort="date">Date Added <span class="sort-indicator">${sourceVideoSort.column==='date'?(sourceVideoSort.direction==='asc'?'▲':'▼'):''}</span></th>
                    <th scope="col">Actions</th>
                </tr>
            `;
            table.appendChild(thead);
            // Table body
            const tbody = document.createElement('tbody');
            // Get the size filters from settings fields
            const sizeFilterMinInput = document.getElementById('size-filter-min');
            const sizeFilterMaxInput = document.getElementById('size-filter-max');
            const minSizeMB = sizeFilterMinInput ? parseFloat(sizeFilterMinInput.value) || 0 : 0;
            const maxSizeMB = sizeFilterMaxInput ? parseFloat(sizeFilterMaxInput.value) || Infinity : Infinity;
            videos.forEach(video => {
                const tr = document.createElement('tr');
                tr.className = 'video-item';
                tr.setAttribute('data-path', video.path);
                tr.setAttribute('data-size', video.size_mb);
                // Mark videos based on size thresholds
                if (video.size_mb < minSizeMB) {
                    tr.classList.add('small-video');
                } else if (video.size_mb > maxSizeMB) {
                    tr.classList.add('large-video');
                }
                // Checkbox
                const tdCheckbox = document.createElement('td');
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'select-source-video';
                checkbox.checked = selectedSourceVideos.has(video.path);
                checkbox.addEventListener('change', function() {
                    if (this.checked) selectedSourceVideos.add(video.path);
                    else selectedSourceVideos.delete(video.path);
                    renderBulkActionsToolbar(container, selectedSourceVideos.size);
                    // Update master checkbox
                    const allCheckboxes = tbody.querySelectorAll('.select-source-video');
                    const allChecked = Array.from(allCheckboxes).every(cb => cb.checked);
                    document.getElementById('select-all-source-videos').checked = allChecked;
                });
                tdCheckbox.appendChild(checkbox);
                tr.appendChild(tdCheckbox);
                // Filename
                const tdName = document.createElement('td');
                tdName.className = 'video-title align-middle';
                tdName.textContent = video.name;
                tr.appendChild(tdName);
                // Size
                const tdSize = document.createElement('td');
                tdSize.className = 'video-size align-middle';
                tdSize.textContent = video.size_mb;
                if (video.size_mb < minSizeMB) {
                    const warning = document.createElement('span');
                    warning.className = 'badge badge-warning ml-2';
                    warning.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Below min';
                    tdSize.appendChild(warning);
                } else if (video.size_mb > maxSizeMB) {
                    const warning = document.createElement('span');
                    warning.className = 'badge badge-danger ml-2';
                    warning.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Above max';
                    tdSize.appendChild(warning);
                }
                tr.appendChild(tdSize);
                // Date Added
                const tdDate = document.createElement('td');
                tdDate.className = 'video-date align-middle';
                const date = new Date(video.created * 1000);
                tdDate.textContent = date.toLocaleString();
                tr.appendChild(tdDate);
                // Actions
                const tdActions = document.createElement('td');
                tdActions.className = 'video-actions align-middle';
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'btn btn-sm btn-danger';
                deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
                deleteBtn.addEventListener('click', function() {
                    deleteSourceVideo(video.path);
                });
                tdActions.appendChild(deleteBtn);
                tr.appendChild(tdActions);
                tbody.appendChild(tr);
            });
            table.appendChild(tbody);
            container.appendChild(table);
            // --- Sorting handlers ---
            thead.querySelectorAll('.sortable').forEach(th => {
                th.style.cursor = 'pointer';
                th.onclick = function() {
                    const sortCol = th.getAttribute('data-sort');
                    if (sourceVideoSort.column === sortCol) {
                        sourceVideoSort.direction = sourceVideoSort.direction === 'asc' ? 'desc' : 'asc';
                    } else {
                        sourceVideoSort.column = sortCol;
                        sourceVideoSort.direction = 'asc';
                    }
                    loadSourceVideos();
                };
            });
            // --- Master checkbox handler ---
            const masterCheckbox = document.getElementById('select-all-source-videos');
            if (masterCheckbox) {
                masterCheckbox.checked = videos.length > 0 && videos.every(v => selectedSourceVideos.has(v.path));
                masterCheckbox.addEventListener('change', function() {
                    if (this.checked) {
                        videos.forEach(v => selectedSourceVideos.add(v.path));
                    } else {
                        videos.forEach(v => selectedSourceVideos.delete(v.path));
                    }
                    // Update all checkboxes
                    tbody.querySelectorAll('.select-source-video').forEach(cb => {
                        cb.checked = masterCheckbox.checked;
                    });
                    renderBulkActionsToolbar(container, selectedSourceVideos.size);
                });
            }
        })
        .catch(error => {
            console.error('Error fetching source videos:', error);
            container.innerHTML = '<div class="alert alert-danger">Error loading source videos. Please check the console for details.</div>';
            renderBulkActionsToolbar(container, 0);
        });
}

// --- BEGIN ADDED: Integrate upload preview into video cards and boat sections ---
let lastDryRunReport = null;

function showDryRunPreview(report) {
    lastDryRunReport = report; // Still store it in case it's needed elsewhere, but primary display changes
    const previewSection = document.getElementById('upload-preview-report-section');
    const previewContent = document.getElementById('upload-preview-report-content');

    if (!previewSection || !previewContent) {
        console.error('Preview report section or content element not found.');
        return;
    }

    previewContent.innerHTML = ''; // Clear previous report

    if (!report || !report.details) {
        previewContent.innerHTML = '<p class="text-danger">Error: Dry run report is missing details.</p>';
        previewSection.style.display = 'block';
        $('#collapsePreviewReport').collapse('show');
        return;
    }

    // Build the report HTML
    let html = '<div class="row">';
    
    // Summary Column - takes up half width now
    html += '<div class="col-md-6">';
    html += '<h5><i class="fas fa-clipboard-list"></i> Summary</h5>';
    html += '<ul class="list-group list-group-flush">';
    html += `<li class="list-group-item">Total Videos: <strong>${report.summary.total_videos}</strong></li>`;
    html += `<li class="list-group-item">Total Boats: <strong>${report.summary.total_boats}</strong></li>`;
    html += `<li class="list-group-item">Playlists to Create: <strong>${report.summary.new_playlists}</strong></li>`;
    html += `<li class="list-group-item">Existing Playlists to Use: <strong>${report.summary.existing_playlists}</strong></li>`;
    html += `<li class="list-group-item">Default Privacy: <strong>${report.summary.privacy}</strong></li>`;
    html += '</ul>';
    html += '</div>';

    // Playlists Column - takes up other half width
    html += '<div class="col-md-6">';
    html += '<h5><i class="fas fa-list-ol"></i> Playlists</h5>';
    // Playlists to Create
    if (report.details.playlists && report.details.playlists.to_create && report.details.playlists.to_create.length > 0) {
        html += '<p class="mb-1"><strong>To Create:</strong></p>';
        html += '<ul class="list-group list-group-flush upload-preview-list mb-2">';
        report.details.playlists.to_create.forEach(playlistName => {
            html += `<li class="list-group-item text-success"><i class="fas fa-plus-circle mr-1"></i> ${playlistName}</li>`;
        });
        html += '</ul>';
    }
    // Existing Playlists to Use
    if (report.details.playlists && report.details.playlists.existing && report.details.playlists.existing.length > 0) {
        html += '<p class="mb-1"><strong>To Use (Existing):</strong></p>';
        html += '<ul class="list-group list-group-flush upload-preview-list">';
        report.details.playlists.existing.forEach(playlist => {
            html += `<li class="list-group-item text-info"><i class="fas fa-check-circle mr-1"></i> ${playlist.name} <small class="text-muted">(${playlist.video_count} videos)</small></li>`;
        });
        html += '</ul>';
    }
    if ((!report.details.playlists || (!report.details.playlists.to_create || report.details.playlists.to_create.length === 0)) && 
        (!report.details.playlists || (!report.details.playlists.existing || report.details.playlists.existing.length === 0))) {
        html += '<p class="text-muted">No playlists will be created or used.</p>';
    }
    html += '</div>';

    html += '</div>'; // End row

    previewContent.innerHTML = html;
    previewSection.style.display = 'block';
    $('#collapsePreviewReport').collapse('show');
}

function loadUploadReadyVideos() {
    const container = document.getElementById('upload-ready-list');
    if (!container) return;

    // Clear and hide the preview report section when reloading video list
    const previewSection = document.getElementById('upload-preview-report-section');
    if (previewSection) {
        previewSection.style.display = 'none';
        const previewContent = document.getElementById('upload-preview-report-content');
        if (previewContent) previewContent.innerHTML = '<p class="text-muted">Click "Preview Upload" to generate the report.</p>';
        $('#collapsePreviewReport').collapse('hide');
    }

    fetch('/api/upload-ready-videos')
        .then(response => response.json())
        .then(data => {
            container.innerHTML = '';
            if (Object.keys(data.videos).length === 0) {
                container.innerHTML = '<div class="alert alert-info">No upload-ready videos found. Use the rename feature to prepare videos for upload.</div>';
                return;
            }
            // --- REMOVED: Dry run report marking logic from here ---
            // No longer need to check lastDryRunReport here or add badges to individual videos
            
            // Use Bootstrap's accordion structure
            container.classList.add('accordion');
            container.id = 'uploadReadyAccordion'; // Add an ID for the accordion parent

            let firstBoat = true; // To expand the first boat's section by default

            for (const boatName in data.videos) {
                const boatVideos = data.videos[boatName];
                const boatId = boatName.replace(/\s+/g, '-'); // Create a safe ID for the boat

                const boatCard = document.createElement('div');
                boatCard.className = 'card upload-boat-accordion-card';

                const boatHeader = document.createElement('div');
                boatHeader.className = 'card-header';
                boatHeader.id = `header-${boatId}`;
                boatHeader.innerHTML = `
                    <h5 class="mb-0">
                        <button class="btn btn-link btn-block text-left" type="button" data-toggle="collapse" data-target="#collapse-${boatId}" aria-expanded="${firstBoat}" aria-controls="collapse-${boatId}">
                            ${boatName} <span class="badge badge-secondary ml-2">${boatVideos.length} videos</span>
                            <i class="fas fa-chevron-down float-right"></i>
                        </button>
                    </h5>
                `;
                boatCard.appendChild(boatHeader);

                const collapseDiv = document.createElement('div');
                collapseDiv.id = `collapse-${boatId}`;
                collapseDiv.className = `collapse ${firstBoat ? 'show' : ''}`;
                collapseDiv.setAttribute('aria-labelledby', `header-${boatId}`);
                collapseDiv.setAttribute('data-parent', '#uploadReadyAccordion');

                const boatCardBody = document.createElement('div');
                boatCardBody.className = 'card-body';
                
                const row = document.createElement('div');
                row.className = 'row'; // This row will contain the video thumbnails

                boatVideos.forEach(video => {
                    const col = document.createElement('div');
                    col.className = 'col-12 col-sm-6 col-md-4 col-lg-3 mb-4'; 
                    const videoItem = document.createElement('div');
                    videoItem.className = 'video-item video-preview-item p-1'; 
                    videoItem.setAttribute('data-path', video.path);
                    
                    const card = document.createElement('div');
                    card.className = 'card h-100'; 
                    card.setAttribute('data-video-id', video.id || video.name);
                    
                    const filename = video.path.split('/').pop();
                    const videoUrl = `/video/${encodeURIComponent(filename)}`;
                    
                    const videoEl = document.createElement('video');
                    videoEl.className = 'card-img-top video-thumbnail small-thumbnail';
                    videoEl.src = videoUrl;
                    videoEl.controls = false;
                    videoEl.preload = 'metadata';
                    videoEl.muted = true;

                    const playButton = document.createElement('div');
                    playButton.className = 'play-button';
                    playButton.innerHTML = '<i class="fas fa-play"></i>';

                    const videoOverlay = document.createElement('div');
                    videoOverlay.className = 'video-overlay';
                    const controlsDiv = document.createElement('div');
                    controlsDiv.className = 'video-controls';
                    const playBtn = document.createElement('button');
                    playBtn.className = 'btn btn-light btn-sm mr-2';
                    playBtn.innerHTML = '<i class="fas fa-play"></i> Play';
                    playBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        openVideoPreview(videoUrl, video.name);
                    });
                    controlsDiv.appendChild(playBtn);
                    videoOverlay.appendChild(controlsDiv);

                    const cardBody = document.createElement('div');
                    cardBody.className = 'card-body p-2'; // Reduced padding for card body
                    
                    const title = document.createElement('h6'); // Changed to h6 for smaller title
                    title.className = 'card-title video-title mb-1'; // Reduced margin
                    title.textContent = video.name;
                    
                    const typeBadge = document.createElement('span');
                    if (video.name.includes('(Before)')) {
                        typeBadge.className = 'badge badge-primary ml-1';
                        typeBadge.textContent = 'Before';
                    } else if (video.name.includes('(After)')) {
                        typeBadge.className = 'badge badge-success ml-1';
                        typeBadge.textContent = 'After';
                    } else {
                        typeBadge.className = 'badge badge-secondary ml-1';
                        typeBadge.textContent = 'Other';
                    }
                    title.appendChild(typeBadge);
                    cardBody.appendChild(title);

                    // Upload Status elements (progress bar, text)
                    const uploadStatusDiv = document.createElement('div');
                    uploadStatusDiv.className = 'upload-status mt-2'; // Added margin-top
                    uploadStatusDiv.innerHTML = `
                        <div class="upload-progress progress d-none">
                            <div class="progress-bar" role="progressbar" style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">0%</div>
                        </div>
                        <div class="upload-status-text"></div>
                    `;
                    cardBody.appendChild(uploadStatusDiv);

                    card.appendChild(videoEl);
                    card.appendChild(playButton);
                    card.appendChild(videoOverlay);
                    card.appendChild(cardBody);
                    videoItem.appendChild(card);
                    col.appendChild(videoItem);
                    row.appendChild(col);

                    videoEl.addEventListener('loadedmetadata', function() {
                        videoEl.currentTime = 1;
                    });
                    videoEl.addEventListener('seeked', function() {
                        videoEl.removeEventListener('seeked', arguments.callee);
                    });
                });
                boatCardBody.appendChild(row);
                collapseDiv.appendChild(boatCardBody);
                boatCard.appendChild(collapseDiv);
                container.appendChild(boatCard);

                firstBoat = false; // Only expand the first boat
            }
            
            // Upload buttons container
            const uploadButtonContainer = document.getElementById('upload-button-container');
            if (uploadButtonContainer) {
                uploadButtonContainer.innerHTML = '';
                if (Object.keys(data.videos).length > 0) {
                    const uploadButton = document.createElement('button');
                    uploadButton.type = 'button';
                    uploadButton.className = 'btn btn-success btn-lg main-cta-btn'; // Added btn-lg and main-cta-btn
                    uploadButton.innerHTML = '<i class="fab fa-youtube"></i> Upload to YouTube';
                    uploadButton.addEventListener('click', function() {
                        initiateUpload(false);
                    });
                    uploadButtonContainer.appendChild(uploadButton);
                }
            }
        })
        .catch(error => {
            console.error('Error fetching upload-ready videos:', error);
            container.innerHTML = '<div class="alert alert-danger">Error loading upload-ready videos. Please check the console for details.</div>';
        });
}
// --- END ADDED ---

// --- BEGIN ADDED: Polling for upload status ---
function pollUploadStatus() {
    if (pollInterval) clearTimeout(pollInterval);
    fetch('/api/upload-status')
        .then(res => res.json())
        .then(data => {
            updateUploadStatusUI(data);
            if (data.active && !data.complete) {
                pollInterval = setTimeout(pollUploadStatus, 1000);
            } else {
                clearTimeout(pollInterval);
                pollInterval = null;
            }
        })
        .catch(() => {
            pollInterval = setTimeout(pollUploadStatus, 2000);
        });
}
// --- END ADDED ---

// Update upload status UI elements
function updateUploadStatusUI(data) {
    const overallSummaryDiv = document.getElementById('overall-upload-status-summary');

    // Handle overall status display first
    if (data.active) {
        if (overallSummaryDiv) {
            let currentTitle = data.current_upload ? data.current_upload.title : (data.pending_uploads && data.pending_uploads.length > 0 ? 'Next video in queue...' : 'No videos currently processing.');
            if (data.paused && data.current_upload) {
                currentTitle = `PAUSED - ${data.current_upload.title}`;
            } else if (data.paused) {
                currentTitle = 'PAUSED - Waiting for resume.';
            }

            overallSummaryDiv.innerHTML = `
                <p class=\"mb-1\">
                    <strong>Queue Status:</strong> Processed ${data.completed + data.failed} of ${data.total} videos.
                    (${data.completed} completed, ${data.failed} failed).
                </p>
                <p class=\"mb-0\">
                    <strong>Current:</strong> ${currentTitle}
                </p>
            `;
            overallSummaryDiv.style.display = 'block';
        }
    } else { // Not active
        if (overallSummaryDiv) {
            if (data.complete && (data.completed > 0 || data.failed > 0)) {
                overallSummaryDiv.innerHTML = `<p class=\"text-info\">Upload queue processed. Final summary appears below if applicable.</p>`;
                overallSummaryDiv.style.display = 'block';
            } else {
                // If not active and not complete with results (e.g., initial state or cleared)
                overallSummaryDiv.style.display = 'none';
                overallSummaryDiv.innerHTML = ''; 
            }
        }
    }
    
    // NEW LOGIC FOR INDIVIDUAL VIDEO CARD UPDATES STARTS HERE
    const videoCards = document.querySelectorAll('.card[data-video-id]');
    videoCards.forEach(card => {
        const videoId = card.getAttribute('data-video-id');
        const uploadStatusDiv = card.querySelector('.upload-status'); 
        if (!uploadStatusDiv) return; 

        const progressDiv = uploadStatusDiv.querySelector('.upload-progress');
        const progressBar = progressDiv.querySelector('.progress-bar');
        const statusText = uploadStatusDiv.querySelector('.upload-status-text');
        
        let isHandled = false;

        // Current upload
        if (data.current_upload && data.current_upload.id === videoId && data.active) {
            isHandled = true;
            progressDiv.classList.remove('d-none');
            progressBar.className = 'progress-bar progress-bar-striped progress-bar-animated';
            const progress = data.current_upload.progress || 0;
            progressBar.style.width = `${progress}%`;
            progressBar.setAttribute('aria-valuenow', progress);
            progressBar.textContent = `${progress}%`;
            let statusParts = [`Uploading... ${progress}%`];
            if (data.current_upload.speed_mbps !== undefined) statusParts.push(`${data.current_upload.speed_mbps.toFixed(2)} MB/s`);
            if (data.current_upload.eta_seconds !== undefined && Number.isFinite(data.current_upload.eta_seconds)) statusParts.push(`ETA: ${Math.round(data.current_upload.eta_seconds)}s`);
            statusText.innerHTML = statusParts.join(' &bull; ');
            card.className = 'card h-100 video-item video-preview-item p-1 uploading'; // Base classes + uploading
            card.style.animation = 'pulse 2s infinite';
            card.style.borderColor = '#007bff'; // Bootstrap primary color for active
            card.style.boxShadow = '0 0 8px rgba(0,123,255,0.5)';
            card.style.opacity = '1';
            const existingIcon = card.querySelector('.upload-status-icon-overlay');
            if (existingIcon) existingIcon.remove();
        }
        // Completed
        else if (data.completed_uploads && data.completed_uploads.includes(videoId)) {
            isHandled = true;
            progressDiv.classList.remove('d-none');
            progressBar.style.width = '100%';
            progressBar.setAttribute('aria-valuenow', 100);
            progressBar.textContent = '100%';
            progressBar.className = 'progress-bar bg-success';
            statusText.innerHTML = '<i class=\"fas fa-check-circle\"></i> Upload Complete';
            card.className = 'card h-100 video-item video-preview-item p-1 upload-completed';
            card.style.animation = '';
            card.style.borderColor = '#28a745';
            card.style.boxShadow = '0 0 8px rgba(40,167,69,0.3)';
            card.style.opacity = '0.7'; 
        }
        // Failed
        else if (data.failed_uploads && data.failed_uploads.includes(videoId)) {
            isHandled = true;
            progressDiv.classList.remove('d-none');
            progressBar.style.width = '100%'; 
            progressBar.setAttribute('aria-valuenow', 100); 
            progressBar.textContent = 'Failed';
            progressBar.className = 'progress-bar bg-danger';
            statusText.innerHTML = '<i class=\"fas fa-exclamation-triangle\"></i> Upload Failed';
            card.className = 'card h-100 video-item video-preview-item p-1 upload-failed';
            card.style.animation = '';
            card.style.borderColor = '#dc3545';
            card.style.boxShadow = '0 0 8px rgba(220,53,69,0.3)';
            card.style.opacity = '1';
        }
        // Pending (and uploads are active)
        else if (data.active && data.pending_uploads && data.pending_uploads.includes(videoId)) {
            isHandled = true;
            progressDiv.classList.add('d-none'); 
            progressBar.style.width = '0%';
            progressBar.setAttribute('aria-valuenow', 0);
            progressBar.textContent = '0%';
            progressBar.className = 'progress-bar';
            statusText.innerHTML = '<i class=\"far fa-clock\"></i> In Queue';
            card.className = 'card h-100 video-item video-preview-item p-1 upload-pending';
            card.style.animation = '';
            card.style.borderColor = ''; 
            card.style.boxShadow = '';
            card.style.opacity = '0.8'; 
        }
        
        // Default state if not handled above (e.g., before uploads start)
        if (!isHandled) {
            progressDiv.classList.add('d-none');
            progressBar.style.width = '0%';
            progressBar.setAttribute('aria-valuenow', 0);
            progressBar.textContent = '0%';
            progressBar.className = 'progress-bar';
            statusText.innerHTML = 'Pending'; // Or an empty string
            card.className = 'card h-100 video-item video-preview-item p-1'; // Base classes
            card.style.animation = '';
            card.style.borderColor = ''; 
            card.style.boxShadow = '';
            card.style.opacity = '1';
            const existingIcon = card.querySelector('.upload-status-icon-overlay');
            if (existingIcon) existingIcon.remove();
        }
    });
    // END OF NEW LOGIC FOR INDIVIDUAL VIDEO CARD UPDATES
    
    // If upload is complete, show a summary message
    if (data.complete && (data.completed > 0 || data.failed > 0)) {
        // Clear the "Preparing upload preview..." message
        const uploadButtonContainer = document.getElementById('upload-button-container');
        if (uploadButtonContainer) {
            uploadButtonContainer.innerHTML = '';
        }
        
        const container = document.getElementById('upload-ready-list');
        if (container) {
            // Check if summary already exists
            let summaryEl = container.querySelector('.upload-summary');
            if (!summaryEl) {
                summaryEl = document.createElement('div');
                summaryEl.className = 'upload-summary alert alert-info mt-4';
                container.appendChild(summaryEl);
            }
            
            summaryEl.innerHTML = `
                <h4>Upload Summary</h4>
                <p>
                    <strong>Total:</strong> ${data.total} videos<br>
                    <strong>Completed:</strong> ${data.completed} videos<br>
                    <strong>Failed:</strong> ${data.failed} videos
                </p>
                <button class="btn btn-primary refresh-btn">Refresh Video List</button>
            `;
            
            // Add click handler to refresh button
            const refreshBtn = summaryEl.querySelector('.refresh-btn');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', function() {
                    loadUploadReadyVideos();
                    // Clear the upload status
                    fetch('/api/clear-upload-status', {
                        method: 'POST'
                    });
                });
            }
        }
    }
    
    // --- ADDED: Pause/Resume Controls ---
    const uploadButtonContainer = document.getElementById('upload-button-container');
    if (uploadButtonContainer && !data.complete) {
        uploadButtonContainer.innerHTML = '';
        if (data.paused) {
            const resumeBtn = document.createElement('button');
            resumeBtn.className = 'btn btn-warning mr-2';
            resumeBtn.innerHTML = '<i class="fas fa-play"></i> Resume Upload';
            resumeBtn.onclick = function() {
                fetch('/api/resume-upload', { method: 'POST' })
                    .then(res => res.json())
                    .then(() => setTimeout(() => pollUploadStatus(), 500));
            };
            uploadButtonContainer.appendChild(resumeBtn);
        } else {
            const pauseBtn = document.createElement('button');
            pauseBtn.className = 'btn btn-warning mr-2';
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause Upload';
            pauseBtn.onclick = function() {
                fetch('/api/pause-upload', { method: 'POST' })
                    .then(res => res.json())
                    .then(() => setTimeout(() => pollUploadStatus(), 500));
            };
            uploadButtonContainer.appendChild(pauseBtn);
        }
    }
    // --- END ADDED ---
}

// Open a folder using the backend API
function openFolder(folderPath) {
    fetch('/api/open-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder_path: folderPath })
    })
    .then(response => response.json())
    .then(data => {
        if (!data.success) {
            showAlert('danger', `Error opening folder: ${data.error}`, 'step1');
        }
    })
    .catch(error => {
        console.error('Error opening folder:', error);
        showAlert('danger', 'Error opening folder. Please check the console for details.', 'step1');
    });
}

// Add showAlert function for UI feedback and error handling
function showAlert(type, message, step) {
    // Try to find a step-specific alert container
    let alertContainer = null;
    if (step) {
        alertContainer = document.getElementById(`${step}-alert-container`);
    }
    // Fallback to global alert container
    if (!alertContainer) {
        alertContainer = document.getElementById('alert-container');
    }
    // If no container, fallback to browser alert
    if (!alertContainer) {
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
    alertContainer.appendChild(alert);
    // Auto-dismiss after 10 seconds for success/info
    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            if (alert.parentNode) {
                if (typeof $ !== 'undefined' && $(alert).alert) {
                    $(alert).alert('close');
                } else {
                    alert.remove();
                }
            }
        }, 10000);
    }
}

// Function to handle the API call for undoing rename
function performUndoRename() {
    const undoBtn = document.getElementById('undo-rename-button');
    if (undoBtn) {
        undoBtn.disabled = true;
        undoBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Undoing...';
    }

    fetch('/api/undo-rename', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert('success', `Successfully undid rename for ${data.undone} videos. Moved ${data.restored_to_source || 0} restored to source.`, 'step2');
            loadSourceVideos();       // Reload source videos as they should be back
            loadUploadReadyVideos();  // Reload upload-ready videos as they might have changed
            showStep(3); // Navigate to Step 3
        } else {
            showAlert('danger', `Error undoing rename: ${data.error}`, 'step2');
        }
    })
    .catch(error => {
        showAlert('danger', `Network or server error during undo: ${error}`, 'step2');
        console.error('Undo Rename Error:', error);
    })
    .finally(() => {
        if (undoBtn) {
            undoBtn.disabled = false;
            undoBtn.textContent = 'Undo Rename';
        }
    });
}

// Function to show a specific step
function showStep(step) {
    // step is 1-based
    workflowSections.forEach((section, idx) => {
        if (section) section.style.display = (idx === step - 1) ? 'block' : 'none';
    });
    breadcrumbItems.forEach((item, idx) => {
        if (idx === step - 1) item.classList.add('active');
        else item.classList.remove('active');
    });

    // If navigating to Step 3 (Upload to YouTube) and no upload is active,
    // and the preview hasn't been generated or is stale, generate it.
    if (step === 3) {
        const previewContent = document.getElementById('upload-preview-report-content');
        const isPreviewEmptyOrDefault = !previewContent || 
                                      previewContent.innerHTML.includes('Click "Preview Upload" to generate the report.') || 
                                      previewContent.innerHTML.trim() === '';
        
        // Check if an upload is active by seeing if pollInterval is set
        // Also ensure that the preview section isn't already populated from a very recent action.
        if (!pollInterval && isPreviewEmptyOrDefault) {
            // The initiateUpload function (and backend) will handle cases where no videos are ready.
            initiateUpload(true); 
        }
    }
}

// --- BEGIN: YouTube Authentication Functions ---
let authCheckInterval = null;

function checkYouTubeAuth() {
    return fetch('/api/youtube-auth-status')
        .then(response => response.json())
        .then(data => data.authenticated)
        .catch(() => false);
}

function openYouTubeAuthPopup() {
    // Get the auth URL from the server
    fetch('/api/youtube-auth-url')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.auth_url) {
                // Open the auth URL in a pop-up window
                const width = 600;
                const height = 700;
                const left = (screen.width - width) / 2;
                const top = (screen.height - height) / 2;
                
                const authWindow = window.open(
                    data.auth_url,
                    'YouTubeAuth',
                    `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,location=yes,resizable=yes,scrollbars=yes,status=yes`
                );
                
                // Check if pop-up was blocked
                if (!authWindow || authWindow.closed || typeof authWindow.closed == 'undefined') {
                    showAlert('warning', 'Pop-up was blocked. Please allow pop-ups for this site and try again.', 'step3');
                    return;
                }
                
                // Show a message to the user
                showAlert('info', 'Please complete the authorization in the pop-up window.', 'step3');
                
                // Listen for message from the auth window
                window.addEventListener('message', function authMessageHandler(event) {
                    if (event.data === 'youtube-auth-success') {
                        window.removeEventListener('message', authMessageHandler);
                        showAlert('success', 'YouTube authorization successful!', 'step3');
                        // Retry the upload operation that was interrupted
                        setTimeout(() => {
                            const lastOperation = window.lastUploadOperation;
                            if (lastOperation) {
                                initiateUpload(lastOperation.isDryRun);
                            }
                        }, 1000);
                    }
                });
                
                // Also poll to check if auth was completed
                authCheckInterval = setInterval(() => {
                    if (authWindow.closed) {
                        clearInterval(authCheckInterval);
                        // Check if auth was successful
                        checkYouTubeAuth().then(authenticated => {
                            if (authenticated) {
                                showAlert('success', 'YouTube authorization successful!', 'step3');
                                // Retry the upload operation
                                const lastOperation = window.lastUploadOperation;
                                if (lastOperation) {
                                    setTimeout(() => initiateUpload(lastOperation.isDryRun), 1000);
                                }
                            }
                        });
                    }
                }, 1000);
            } else {
                showAlert('danger', 'Failed to get authorization URL: ' + (data.error || 'Unknown error'), 'step3');
            }
        })
        .catch(error => {
            console.error('Error getting auth URL:', error);
            showAlert('danger', 'Error getting authorization URL. Check console for details.', 'step3');
        });
}
// --- END: YouTube Authentication Functions ---

// --- BEGIN: Global function for upload initiation ---
function initiateUpload(isDryRun) {
    // Store the operation for retry after auth
    window.lastUploadOperation = { isDryRun };
    
    const step3AlertContainer = document.getElementById('step3-alert-container');
    step3AlertContainer.innerHTML = ''; 
    const previewSection = document.getElementById('upload-preview-report-section');
    const previewContent = document.getElementById('upload-preview-report-content');
    const uploadButtonContainer = document.getElementById('upload-button-container');
    const overallStatusDiv = document.getElementById('overall-upload-status-summary');

    if (isDryRun) {
        if (previewContent) previewContent.innerHTML = '<div class="text-center p-3"><div class="spinner-border spinner-border-sm mr-2" role="status"></div>Generating preview...</div>';
        if (previewSection) previewSection.style.display = 'block';
        $('#collapsePreviewReport').collapse('show');
    } else {
        // If starting a real upload, hide the preview section
        if (previewSection) previewSection.style.display = 'none';
        $('#collapsePreviewReport').collapse('hide');
        
        // Immediately update UI for real upload initiation
        if (uploadButtonContainer) {
            uploadButtonContainer.innerHTML = '<p class=\"text-info\"><span class=\"spinner-border spinner-border-sm\" role=\"status\" aria-hidden=\"true\"></span> Starting upload process... Waiting for first status update.</p>';
        }
        if (overallStatusDiv) {
            overallStatusDiv.innerHTML = '<p class=\"text-info\">Contacting server to start uploads...</p>';
            overallStatusDiv.style.display = 'block';
        }
    }

    const actionText = isDryRun ? 'Previewing upload...' : 'Initiating upload to YouTube...';
    // showAlert('info', actionText, 3); // This alert might be redundant with the direct UI updates above

    fetch('/api/upload-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dry_run: isDryRun })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (isDryRun) {
                showAlert('success', 'Dry run complete. See details below.', 'step3');
                showDryRunPreview(data.report);
            } else {
                showAlert('success', 'Upload process started by server! Monitoring progress...', 'step3');
                // UI for buttons (like Pause/Resume) will be handled by the first pollUploadStatus -> updateUploadStatusUI call.
                // loadUploadReadyVideos(); // No need to reload videos here, they are already displayed.
                pollUploadStatus(); // This will trigger updateUploadStatusUI which handles buttons and detailed status.
            }
        } else {
            // Check if the error is about YouTube authentication
            if (data.error && data.error.includes('YouTube authentication required')) {
                showAlert('warning', 'YouTube authentication is required. Opening authorization window...', 'step3');
                // Open the YouTube auth pop-up
                openYouTubeAuthPopup();
                // Restore UI state
                if (!isDryRun && uploadButtonContainer) {
                    loadUploadReadyVideos();
                }
                if (overallStatusDiv) overallStatusDiv.style.display = 'none';
            } else {
                showAlert('danger', 'Failed to ' + (isDryRun ? 'preview' : 'start') + ' upload: ' + (data.error || 'Unknown error'), 3);
                // Restore upload button if start failed
                if (!isDryRun && uploadButtonContainer) {
                    loadUploadReadyVideos(); // This function also adds back the main upload button if videos exist.
                }
                if (overallStatusDiv) overallStatusDiv.style.display = 'none'; // Hide if failed to start
            }
        }
    })
    .catch(error => {
        console.error('Error during upload operation:', error);
        showAlert('danger', 'Error during ' + (isDryRun ? 'preview' : 'upload') + ' operation. Check console for details.', 3);
        // Restore upload button if start failed due to network/other error
        if (!isDryRun && uploadButtonContainer) {
            loadUploadReadyVideos(); 
        }
        if (overallStatusDiv) overallStatusDiv.style.display = 'none';
    });
}
// --- END: Global function for upload initiation ---

// --- BEGIN: Global function for renaming videos ---
async function renameVideos() {
    console.log("renameVideos function called");
    const selectedDate = document.getElementById('selected-date').value;
    const videosPerBoat = document.getElementById('videos-per-boat').value;
    
    const boatNamesTextarea = document.getElementById('boat-names-textarea');
    let boatNames = [];
    if (boatNamesTextarea && boatNamesTextarea.value.trim() !== '') {
        boatNames = boatNamesTextarea.value.split(/[\n,]+/)
                                         .map(name => name.trim())
                                         .filter(name => name !== '');
    }

    if (!selectedDate) {
        showFeedback('Please select a date.', 'warning', 'rename-feedback');
        return;
    }

    if (boatNames.length === 0) {
        showFeedback('Please enter at least one boat name.', 'warning', 'rename-feedback');
        return;
    }

    console.log("Calling API to rename videos with:", { boat_names: boatNames, selected_date: selectedDate, videos_per_boat: videosPerBoat });

    // Show loading state
    const renameButton = document.getElementById('rename-button');
    const renameSpinner = document.getElementById('rename-spinner');
    renameButton.disabled = true;
    renameSpinner.classList.remove('d-none');

    // Prepare data for API call
    const payload = {
        selected_date: selectedDate,
        videos_per_boat: parseInt(videosPerBoat, 10),
        boat_names: boatNames,
        // Add custom_suffixes if implemented later
        // custom_suffixes: {}
    };

    fetch('/api/rename-videos', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert(`Successfully renamed ${data.renamed} videos. Moved ${data.moved} files to the upload folder.`, 'success', 'step2');
            // Reload video lists
            loadSourceVideos();
            loadUploadReadyVideos(); 
            document.getElementById('undo-rename-button').disabled = !data.success || data.renamed === 0;
            showStep(3); // Navigate to Step 3
            // REMOVED: initiateUpload(true); // Automatically generate preview after navigating
        } else {
            showAlert(`Error renaming videos: ${data.error || 'Unknown error'}`, 'danger', 'step2');
            document.getElementById('undo-rename-button').disabled = true; // Disable undo if rename failed
        }
    })
    .catch(error => {
        console.error('Error calling rename API:', error);
        showAlert('An error occurred while trying to rename videos. Check console for details.', 'danger', 'step2');
        document.getElementById('undo-rename-button').disabled = true; // Disable undo on network/fetch error
    })
    .finally(() => {
        // Hide loading state
        renameButton.disabled = false;
        renameSpinner.classList.add('d-none');
    });
}
// --- END: Global function for renaming videos ---
