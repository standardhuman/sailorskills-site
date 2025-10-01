/**
 * Drag and Drop Utility
 * Reusable drag & drop functionality for file uploads and list reordering
 */

const dragDrop = {
    /**
     * Initialize file drop zone
     * @param {HTMLElement} dropzone - Drop zone element
     * @param {Function} onFilesDropped - Callback when files are dropped
     */
    initializeFileDropzone(dropzone, onFilesDropped) {
        if (!dropzone) return;

        // Handle drag over
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.add('dragover');
        });

        // Handle drag leave
        dropzone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.remove('dragover');
        });

        // Handle drop
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.remove('dragover');

            const files = e.dataTransfer.files;
            if (files.length > 0 && onFilesDropped) {
                onFilesDropped(Array.from(files));
            }
        });
    },

    /**
     * Prevent default drag/drop on page (except in specified zones)
     * @param {HTMLElement[]} allowedZones - Array of elements where drag/drop is allowed
     */
    preventDefaultDragDrop(allowedZones = []) {
        document.addEventListener('dragover', (e) => {
            const isInAllowedZone = allowedZones.some(zone => zone && zone.contains(e.target));
            if (!isInAllowedZone) {
                e.preventDefault();
                e.stopPropagation();
            }
        });

        document.addEventListener('drop', (e) => {
            const isInAllowedZone = allowedZones.some(zone => zone && zone.contains(e.target));
            if (!isInAllowedZone) {
                e.preventDefault();
                e.stopPropagation();
            }
        });
    },

    /**
     * Make table rows draggable for reordering
     * @param {HTMLTableElement} table - Table element
     * @param {Function} onReorder - Callback when rows are reordered
     */
    makeTableRowsDraggable(table, onReorder) {
        if (!table) return;

        const tbody = table.querySelector('tbody');
        if (!tbody) return;

        let draggedRow = null;

        // Add drag start handler to all rows
        tbody.querySelectorAll('tr[draggable="true"]').forEach(row => {
            row.addEventListener('dragstart', function(e) {
                draggedRow = this;
                this.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', this.innerHTML);
            });

            row.addEventListener('dragend', function() {
                this.classList.remove('dragging');
                tbody.querySelectorAll('tr').forEach(r => r.classList.remove('drag-over'));

                // Call reorder callback if provided
                if (onReorder) {
                    const newOrder = Array.from(tbody.querySelectorAll('tr')).map((r, index) => ({
                        element: r,
                        index
                    }));
                    onReorder(newOrder);
                }
            });

            row.addEventListener('dragover', function(e) {
                if (e.preventDefault) {
                    e.preventDefault();
                }
                e.dataTransfer.dropEffect = 'move';

                const afterElement = dragDrop.getDragAfterElement(tbody, e.clientY);
                if (afterElement == null) {
                    tbody.appendChild(draggedRow);
                } else {
                    tbody.insertBefore(draggedRow, afterElement);
                }

                return false;
            });

            row.addEventListener('drop', function(e) {
                if (e.stopPropagation) {
                    e.stopPropagation();
                }
                return false;
            });
        });
    },

    /**
     * Get element to insert dragged item after
     * @param {HTMLElement} container - Container element
     * @param {number} y - Y coordinate
     * @returns {HTMLElement|null} Element to insert after
     */
    getDragAfterElement(container, y) {
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
};