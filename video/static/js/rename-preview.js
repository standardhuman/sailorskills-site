// Rename Preview functionality
let currentAssignments = [];

// Setup rename preview handlers
function setupRenamePreviewHandlers() {
    // Preview rename button
    const previewRenameBtn = document.getElementById('preview-rename-btn');
    if (previewRenameBtn) {
        previewRenameBtn.addEventListener('click', previewRename);
    }
    
    // Cancel preview button
    const cancelPreviewBtn = document.getElementById('cancel-preview-btn');
    if (cancelPreviewBtn) {
        cancelPreviewBtn.addEventListener('click', cancelRenamePreview);
    }
    
    // Apply rename button
    const applyRenameBtn = document.getElementById('apply-rename-btn');
    if (applyRenameBtn) {
        applyRenameBtn.addEventListener('click', applyRename);
    }
    
    // Add boat for unassigned button
    const addBoatBtn = document.getElementById('add-boat-for-unassigned');
    if (addBoatBtn) {
        addBoatBtn.addEventListener('click', addBoatForUnassigned);
    }
}

// Preview rename function
async function previewRename() {
    const selectedDate = document.getElementById('selected-date').value;
    const videosPerBoat = document.getElementById('videos-per-boat').value;
    const boatNamesTextarea = document.getElementById('boat-names-textarea');
    
    if (!selectedDate) {
        showAlert('Please select a date.', 'warning', 'step2-alert-container');
        return;
    }
    
    let boatNames = [];
    if (boatNamesTextarea && boatNamesTextarea.value.trim() !== '') {
        boatNames = boatNamesTextarea.value.split(/[\n,]+/).map(name => name.trim()).filter(name => name);
    }
    
    if (boatNames.length === 0) {
        showAlert('Please enter at least one boat name.', 'warning', 'step2-alert-container');
        return;
    }
    
    try {
        const response = await fetch('/api/preview-rename', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                boat_names: boatNames,
                selected_date: selectedDate,
                videos_per_boat: parseInt(videosPerBoat)
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentAssignments = data.assignments;
            displayRenamePreview(data);
            document.getElementById('rename-preview-section').style.display = 'block';
            // Hide the form controls
            document.getElementById('rename-form').style.display = 'none';
        } else {
            showAlert(data.error || 'Failed to generate preview', 'danger', 'step2-alert-container');
        }
    } catch (error) {
        showAlert('Error generating preview: ' + error.message, 'danger', 'step2-alert-container');
    }
}

// Display rename preview
function displayRenamePreview(data) {
    const tbody = document.getElementById('rename-preview-tbody');
    tbody.innerHTML = '';
    
    // Video type options
    const typeOptions = ['Before', 'After', 'Inspection', 'Haul Out', 'Propeller Removal', 'Repair', 'Maintenance', 'Other'];
    
    data.assignments.forEach((assignment, index) => {
        const row = document.createElement('tr');
        row.dataset.index = assignment.index;
        row.draggable = true;
        
        row.innerHTML = `
            <td class="drag-handle">☰</td>
            <td>${assignment.source_name}</td>
            <td>
                <input type="text" class="form-control boat-name-input" 
                       value="${assignment.boat_name}" 
                       data-index="${index}">
            </td>
            <td>
                <input type="date" class="form-control date-input" 
                       value="${assignment.date}" 
                       data-index="${index}">
            </td>
            <td>
                <select class="form-control type-select" data-index="${index}">
                    ${typeOptions.map(type => 
                        `<option value="${type}" ${assignment.type === type ? 'selected' : ''}>${type}</option>`
                    ).join('')}
                </select>
            </td>
            <td class="preview-final-name">${assignment.preview_name}</td>
            <td>
                <button class="btn btn-sm btn-danger remove-btn" data-index="${index}">×</button>
            </td>
        `;
        
        tbody.appendChild(row);
        
        // Add event listeners
        row.querySelector('.boat-name-input').addEventListener('input', () => updatePreview(index));
        row.querySelector('.date-input').addEventListener('change', () => updatePreview(index));
        row.querySelector('.type-select').addEventListener('change', () => updatePreview(index));
        row.querySelector('.remove-btn').addEventListener('click', () => removeAssignment(index));
        
        // Drag and drop handlers
        row.addEventListener('dragstart', handleDragStart);
        row.addEventListener('dragover', handleDragOver);
        row.addEventListener('drop', handleDrop);
        row.addEventListener('dragend', handleDragEnd);
    });
    
    // Handle unassigned videos
    if (data.unassigned && data.unassigned.length > 0) {
        const unassignedSection = document.getElementById('unassigned-videos-section');
        const unassignedList = document.getElementById('unassigned-videos-list');
        
        unassignedSection.style.display = 'block';
        unassignedList.innerHTML = data.unassigned.map(video => 
            `<li>${video.source_name}</li>`
        ).join('');
    } else {
        document.getElementById('unassigned-videos-section').style.display = 'none';
    }
}

// Update preview for a specific row
function updatePreview(index) {
    const row = document.querySelector(`tr[data-index="${currentAssignments[index].index}"]`);
    const boatNameInput = row.querySelector('.boat-name-input');
    const boatName = boatNameInput.value;
    const date = row.querySelector('.date-input').value;
    const type = row.querySelector('.type-select').value;
    
    // Validate boat name
    if (!boatName.trim()) {
        boatNameInput.classList.add('is-invalid');
        row.querySelector('.preview-final-name').textContent = '⚠️ Boat name required';
        row.querySelector('.preview-final-name').classList.add('text-danger');
        return;
    } else {
        boatNameInput.classList.remove('is-invalid');
        row.querySelector('.preview-final-name').classList.remove('text-danger');
    }
    
    // Update assignment
    currentAssignments[index].boat_name = boatName;
    currentAssignments[index].date = date;
    currentAssignments[index].type = type;
    
    // Convert date format
    const dateObj = new Date(date);
    const dateStr = `${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}-${dateObj.getFullYear()}`;
    
    // Build preview name
    const ext = currentAssignments[index].source_name.split('.').pop();
    const suffix = type && type !== 'Other' ? ` (${type})` : '';
    const position = currentAssignments[index].position || 1;
    let previewName = `${boatName} ${dateStr} ${position}${suffix}.${ext}`;
    
    // Sanitize preview name (client-side approximation)
    previewName = sanitizeFilename(previewName);
    
    // Update preview
    row.querySelector('.preview-final-name').textContent = previewName;
    currentAssignments[index].preview_name = previewName;
}

// Client-side filename sanitization (matches server-side logic)
function sanitizeFilename(filename) {
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
}

// Remove assignment
function removeAssignment(index) {
    currentAssignments.splice(index, 1);
    // Redraw the table
    displayRenamePreview({
        assignments: currentAssignments,
        unassigned: []
    });
}

// Cancel rename preview
function cancelRenamePreview() {
    document.getElementById('rename-preview-section').style.display = 'none';
    document.getElementById('rename-form').style.display = 'block';
    currentAssignments = [];
}

// Apply rename with custom assignments
async function applyRename() {
    if (currentAssignments.length === 0) {
        showAlert('No videos to rename', 'warning', 'step2-alert-container');
        return;
    }
    
    // Validate all assignments have boat names
    const invalidAssignments = currentAssignments.filter(a => !a.boat_name || !a.boat_name.trim());
    if (invalidAssignments.length > 0) {
        showAlert(`Please provide boat names for all videos. ${invalidAssignments.length} video(s) are missing boat names.`, 'danger', 'step2-alert-container');
        // Highlight invalid rows
        invalidAssignments.forEach(assignment => {
            const row = document.querySelector(`tr[data-index="${assignment.index}"]`);
            if (row) {
                row.querySelector('.boat-name-input').classList.add('is-invalid');
            }
        });
        return;
    }
    
    // Show loading state
    const applyBtn = document.getElementById('apply-rename-btn');
    const originalText = applyBtn.textContent;
    applyBtn.disabled = true;
    applyBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Renaming...';
    
    try {
        const response = await fetch('/api/rename-videos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                assignments: currentAssignments
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert(`Successfully renamed ${data.renamed} videos`, 'success', 'step2-alert-container');
            // Hide preview and show form
            cancelRenamePreview();
            // Reload videos
            loadSourceVideos();
            loadUploadReadyVideos();
            // Show next step
            showStep(3);
        } else {
            showAlert(data.error || 'Rename operation failed', 'danger', 'step2-alert-container');
        }
    } catch (error) {
        showAlert('Error applying rename: ' + error.message, 'danger', 'step2-alert-container');
    } finally {
        applyBtn.disabled = false;
        applyBtn.textContent = originalText;
    }
}

// Add boat for unassigned videos
function addBoatForUnassigned() {
    const newBoatName = prompt('Enter boat name for unassigned videos:');
    if (newBoatName && newBoatName.trim()) {
        // Find unassigned videos
        const allIndexes = currentAssignments.map(a => a.index);
        const maxIndex = Math.max(...allIndexes, -1);
        
        // Add placeholder assignment
        const placeholderAssignment = {
            index: maxIndex + 1,
            source_name: 'New Boat Videos',
            source_path: '',
            boat_name: newBoatName.trim(),
            date: document.getElementById('selected-date').value,
            type: 'Before',
            position: 1,
            preview_name: ''
        };
        
        currentAssignments.push(placeholderAssignment);
        
        // Redraw table
        displayRenamePreview({
            assignments: currentAssignments,
            unassigned: []
        });
    }
}

// Drag and drop handlers
let draggedRow = null;

function handleDragStart(e) {
    draggedRow = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    
    const afterElement = getDragAfterElement(e.currentTarget.parentNode, e.clientY);
    if (afterElement == null) {
        e.currentTarget.parentNode.appendChild(draggedRow);
    } else {
        e.currentTarget.parentNode.insertBefore(draggedRow, afterElement);
    }
    
    return false;
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    // Update positions after drop
    updatePositionsAfterDrag();
    
    return false;
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    
    // Remove drag-over classes
    const rows = document.querySelectorAll('#rename-preview-tbody tr');
    rows.forEach(row => row.classList.remove('drag-over'));
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('tr:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function updatePositionsAfterDrag() {
    const rows = document.querySelectorAll('#rename-preview-tbody tr');
    const newOrder = [];
    
    rows.forEach((row, index) => {
        const originalIndex = parseInt(row.dataset.index);
        const assignment = currentAssignments.find(a => a.index === originalIndex);
        if (assignment) {
            assignment.position = index + 1;
            newOrder.push(assignment);
        }
    });
    
    currentAssignments = newOrder;
    
    // Update all previews
    currentAssignments.forEach((_, index) => updatePreview(index));
}