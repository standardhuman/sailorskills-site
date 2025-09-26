// AI Assistant for Inventory Management

class AIAssistant {
    constructor() {
        this.geminiService = new GeminiService();
        this.supabase = null;
        this.selectedFiles = [];
        this.extractedData = [];
        this.currentExtractionMode = 'comprehensive';

        this.init();
    }

    async init() {
        // Initialize Supabase
        this.initSupabase();

        // Set up event listeners
        this.setupEventListeners();

        // Load settings
        this.loadSettings();

        // Update usage display
        this.updateUsageDisplay();
    }

    initSupabase() {
        const supabaseUrl = window.SUPABASE_URL;
        const supabaseKey = window.SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            this.showError('Supabase credentials not found');
            return;
        }

        this.supabase = supabase.createClient(supabaseUrl, supabaseKey);
    }

    setupEventListeners() {
        // File input and drag-drop
        const fileInput = document.getElementById('file-input');
        const dropZone = document.getElementById('drop-zone');
        const browseBtn = document.getElementById('browse-btn');

        browseBtn?.addEventListener('click', () => fileInput.click());
        fileInput?.addEventListener('change', (e) => this.handleFileSelect(e.target.files));

        // Drag and drop
        dropZone?.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone?.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });

        dropZone?.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            this.handleFileSelect(e.dataTransfer.files);
        });

        // Paste from clipboard
        document.addEventListener('paste', (e) => {
            const items = e.clipboardData.items;
            const files = [];

            for (let item of items) {
                if (item.type.indexOf('image') !== -1) {
                    const file = item.getAsFile();
                    files.push(file);
                }
            }

            if (files.length > 0) {
                this.handleFileSelect(files);
            }
        });

        // Process button
        document.getElementById('process-images')?.addEventListener('click', () => {
            this.processImages();
        });

        // Clear buttons
        document.getElementById('clear-images')?.addEventListener('click', () => {
            this.clearSelectedFiles();
        });

        document.getElementById('clear-chat')?.addEventListener('click', () => {
            this.clearChat();
        });

        // Quick action buttons
        document.querySelectorAll('.quick-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const prompt = e.target.dataset.prompt;
                this.setExtractionMode(prompt);
            });
        });

        // Settings
        document.getElementById('api-settings')?.addEventListener('click', () => {
            this.openSettingsModal();
        });

        document.getElementById('settings-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSettings();
        });

        // Data modal actions
        document.getElementById('confirm-import')?.addEventListener('click', () => {
            this.importSelectedItems();
        });

        document.getElementById('add-manual-row')?.addEventListener('click', () => {
            this.addManualDataRow();
        });

        document.getElementById('select-all-items')?.addEventListener('change', (e) => {
            this.toggleAllItems(e.target.checked);
        });

        // Close modals
        document.querySelectorAll('.modal .close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                closeBtn.closest('.modal').classList.remove('active');
            });
        });
    }

    handleFileSelect(files) {
        const validFiles = [];
        const maxSize = 20 * 1024 * 1024; // 20MB
        const validTypes = ['image/png', 'image/jpeg', 'image/webp'];

        for (let file of files) {
            if (!validTypes.includes(file.type)) {
                this.showError(`${file.name}: Invalid file type. Only PNG, JPEG, and WEBP are supported.`);
                continue;
            }

            if (file.size > maxSize) {
                this.showError(`${file.name}: File too large. Maximum size is 20MB.`);
                continue;
            }

            validFiles.push(file);
        }

        if (validFiles.length > 0) {
            this.selectedFiles = [...this.selectedFiles, ...validFiles];
            this.updateImagePreview();

            // Auto-process if enabled
            const autoProcess = document.getElementById('auto-process')?.checked;
            if (autoProcess && this.selectedFiles.length > 0) {
                this.processImages();
            }
        }
    }

    updateImagePreview() {
        const previewArea = document.getElementById('image-preview');
        const previewGrid = document.getElementById('preview-grid');

        if (this.selectedFiles.length === 0) {
            previewArea?.classList.add('hidden');
            return;
        }

        previewArea?.classList.remove('hidden');
        previewGrid.innerHTML = '';

        this.selectedFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const previewItem = document.createElement('div');
                previewItem.className = 'preview-item';
                previewItem.innerHTML = `
                    <img src="${e.target.result}" alt="${file.name}">
                    <div class="preview-name">${file.name}</div>
                    <button class="btn-remove-item" data-index="${index}">×</button>
                `;

                previewItem.querySelector('.btn-remove-item').addEventListener('click', (e) => {
                    this.removeFile(parseInt(e.target.dataset.index));
                });

                previewGrid.appendChild(previewItem);
            };
            reader.readAsDataURL(file);
        });
    }

    removeFile(index) {
        this.selectedFiles.splice(index, 1);
        this.updateImagePreview();
    }

    clearSelectedFiles() {
        this.selectedFiles = [];
        this.updateImagePreview();
        document.getElementById('file-input').value = '';
    }

    async processImages() {
        if (!this.geminiService.isConfigured()) {
            this.showError('Please configure your Gemini API key in settings');
            this.openSettingsModal();
            return;
        }

        if (this.selectedFiles.length === 0) {
            this.showError('Please select at least one image');
            return;
        }

        // Show processing overlay
        this.showProcessing(true);

        try {
            // Process all selected images
            const results = await this.geminiService.processMultipleImages(
                this.selectedFiles,
                this.currentExtractionMode,
                (current, total, status) => {
                    this.updateProcessingStatus(current, total, status);
                }
            );

            // Combine all extracted items
            this.extractedData = [];
            for (const result of results) {
                if (result.success && result.data.items) {
                    this.extractedData.push(...result.data.items);
                }
            }

            // Add to chat
            this.addToChat('user', `Processed ${this.selectedFiles.length} image(s)`);
            this.addToChat('assistant', `Found ${this.extractedData.length} items. Review the extracted data to import them to your inventory.`);

            // Show data review modal
            this.showDataModal();

            // Clear selected files
            this.clearSelectedFiles();

        } catch (error) {
            this.showError(`Processing failed: ${error.message}`);
        } finally {
            this.showProcessing(false);
            this.updateUsageDisplay();
        }
    }

    showDataModal() {
        const modal = document.getElementById('data-modal');
        const tbody = document.getElementById('extracted-data-rows');
        const itemsCount = document.getElementById('items-count');

        // Clear existing rows
        tbody.innerHTML = '';

        // Add extracted data rows
        this.extractedData.forEach((item, index) => {
            const row = this.createDataRow(item, index);
            tbody.appendChild(row);
        });

        // Update count
        itemsCount.textContent = `${this.extractedData.length} items found`;
        this.updateImportCount();

        // Show modal
        modal.classList.add('active');
    }

    createDataRow(item, index) {
        const row = document.createElement('tr');
        row.dataset.index = index;
        row.innerHTML = `
            <td><input type="checkbox" class="item-select" checked></td>
            <td><input type="text" class="item-name" value="${item.name || ''}" required></td>
            <td><input type="text" class="item-sku" value="${item.sku || ''}"></td>
            <td><input type="number" class="item-quantity" value="${item.quantity || 1}" min="0"></td>
            <td><input type="number" class="item-price" value="${item.price || ''}" step="0.01" min="0"></td>
            <td>
                <select class="item-category">
                    <option value="anodes" ${item.category === 'anodes' ? 'selected' : ''}>Anodes</option>
                    <option value="tools" ${item.category === 'tools' ? 'selected' : ''}>Tools</option>
                    <option value="equipment" ${item.category === 'equipment' ? 'selected' : ''}>Equipment</option>
                    <option value="supplies" ${item.category === 'supplies' ? 'selected' : ''}>Supplies</option>
                    <option value="consumables" ${item.category === 'consumables' ? 'selected' : ''}>Consumables</option>
                    <option value="other" ${item.category === 'other' ? 'selected' : ''}>Other</option>
                </select>
            </td>
            <td><input type="text" class="item-supplier" value="${item.supplier || ''}"></td>
            <td><input type="text" class="item-description" value="${item.description || ''}"></td>
            <td>
                <button class="btn-remove" onclick="aiAssistant.removeDataRow(${index})">Remove</button>
            </td>
        `;

        // Add change listener to update count
        row.querySelector('.item-select').addEventListener('change', () => {
            this.updateImportCount();
        });

        return row;
    }

    addManualDataRow() {
        const tbody = document.getElementById('extracted-data-rows');
        const newItem = {
            name: '',
            sku: '',
            quantity: 1,
            price: 0,
            category: 'other',
            supplier: '',
            description: ''
        };

        this.extractedData.push(newItem);
        const row = this.createDataRow(newItem, this.extractedData.length - 1);
        tbody.appendChild(row);
        this.updateImportCount();
    }

    removeDataRow(index) {
        this.extractedData.splice(index, 1);
        this.showDataModal(); // Refresh the modal
    }

    toggleAllItems(checked) {
        document.querySelectorAll('.item-select').forEach(checkbox => {
            checkbox.checked = checked;
        });
        this.updateImportCount();
    }

    updateImportCount() {
        const selected = document.querySelectorAll('.item-select:checked').length;
        document.getElementById('import-count').textContent = `(${selected})`;
    }

    async importSelectedItems() {
        const rows = document.querySelectorAll('#extracted-data-rows tr');
        const itemsToImport = [];

        rows.forEach((row) => {
            if (row.querySelector('.item-select').checked) {
                const item = {
                    name: row.querySelector('.item-name').value,
                    sku: row.querySelector('.item-sku').value,
                    quantity: parseInt(row.querySelector('.item-quantity').value) || 0,
                    price: parseFloat(row.querySelector('.item-price').value) || 0,
                    category: row.querySelector('.item-category').value,
                    supplier: row.querySelector('.item-supplier').value,
                    description: row.querySelector('.item-description').value
                };

                if (item.name) {
                    itemsToImport.push(item);
                }
            }
        });

        if (itemsToImport.length === 0) {
            this.showError('No items selected for import');
            return;
        }

        try {
            // Auto-match with catalog if enabled
            const autoMatch = document.getElementById('auto-match-catalog')?.checked;
            let processedItems = itemsToImport;

            if (autoMatch) {
                processedItems = await this.geminiService.matchWithCatalog(itemsToImport, this.supabase);
            }

            // Import items to inventory
            let successCount = 0;
            for (const item of processedItems) {
                try {
                    if (item.isAnode && item.catalogMatch) {
                        // Add to anode inventory
                        await this.addAnodeToInventory(item);
                    } else {
                        // Add to general inventory
                        await this.addGeneralItemToInventory(item);
                    }
                    successCount++;
                } catch (error) {
                    console.error(`Failed to import ${item.name}:`, error);
                }
            }

            // Add to replenishment if needed
            const addToReplenishment = document.getElementById('add-to-replenishment')?.checked;
            if (addToReplenishment) {
                await this.checkAndAddToReplenishment(processedItems);
            }

            // Success message
            this.addToChat('assistant', `✅ Successfully imported ${successCount} of ${itemsToImport.length} items to inventory!`);

            // Close modal
            document.getElementById('data-modal').classList.remove('active');

        } catch (error) {
            this.showError(`Import failed: ${error.message}`);
        }
    }

    async addAnodeToInventory(item) {
        // Check if inventory record exists
        const { data: existing } = await this.supabase
            .from('anode_inventory')
            .select('*')
            .eq('anode_id', item.catalogMatch.id)
            .single();

        if (existing) {
            // Update existing
            await this.supabase
                .from('anode_inventory')
                .update({
                    quantity_on_hand: existing.quantity_on_hand + item.quantity,
                    last_purchase_price: item.price || item.catalogMatch.list_price
                })
                .eq('anode_id', item.catalogMatch.id);
        } else {
            // Create new
            await this.supabase
                .from('anode_inventory')
                .insert({
                    anode_id: item.catalogMatch.id,
                    quantity_on_hand: item.quantity,
                    last_purchase_price: item.price || item.catalogMatch.list_price,
                    reorder_point: 5,
                    reorder_quantity: 10
                });
        }

        // Record transaction
        await this.supabase
            .from('inventory_transactions')
            .insert({
                anode_id: item.catalogMatch.id,
                transaction_type: 'purchase',
                quantity: item.quantity,
                unit_cost: item.price || item.catalogMatch.list_price,
                reference_notes: `AI Assistant import from ${item.supplier || 'screenshot'}`
            });
    }

    async addGeneralItemToInventory(item) {
        // Get category ID
        const { data: category } = await this.supabase
            .from('item_categories')
            .select('id')
            .ilike('name', item.category)
            .single();

        const categoryId = category?.id;

        // Check if item exists
        const { data: existing } = await this.supabase
            .from('inventory_items')
            .select('*')
            .eq('sku', item.sku)
            .single();

        if (existing) {
            // Update existing
            await this.supabase
                .from('inventory_items')
                .update({
                    quantity_on_hand: existing.quantity_on_hand + item.quantity,
                    last_purchase_price: item.price
                })
                .eq('id', existing.id);

            // Record transaction
            await this.supabase
                .from('inventory_transactions')
                .insert({
                    item_id: existing.id,
                    transaction_type: 'purchase',
                    quantity: item.quantity,
                    unit_cost: item.price,
                    reference_notes: `AI Assistant import from ${item.supplier || 'screenshot'}`
                });
        } else {
            // Create new item
            const { data: newItem } = await this.supabase
                .from('inventory_items')
                .insert({
                    sku: item.sku || `AI-${Date.now()}`,
                    name: item.name,
                    description: item.description,
                    category_id: categoryId,
                    quantity_on_hand: item.quantity,
                    unit_cost: item.price,
                    last_purchase_price: item.price,
                    reorder_point: 5,
                    reorder_quantity: 10
                })
                .select()
                .single();

            // Record transaction
            if (newItem) {
                await this.supabase
                    .from('inventory_transactions')
                    .insert({
                        item_id: newItem.id,
                        transaction_type: 'purchase',
                        quantity: item.quantity,
                        unit_cost: item.price,
                        reference_notes: `AI Assistant import from ${item.supplier || 'screenshot'}`
                    });
            }
        }
    }

    async checkAndAddToReplenishment(items) {
        // Check inventory levels and add to replenishment if needed
        for (const item of items) {
            // Implementation would check current stock levels
            // and add to replenishment_list table if below reorder point
        }
    }

    setExtractionMode(mode) {
        const modeMap = {
            'extract-all': 'comprehensive',
            'extract-anodes': 'comprehensive',
            'extract-prices': 'essential',
            'extract-quantities': 'quick'
        };

        this.currentExtractionMode = modeMap[mode] || 'comprehensive';

        // Update button states
        document.querySelectorAll('.quick-action').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.prompt === mode);
        });
    }

    addToChat(sender, message) {
        const chatMessages = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;

        const avatar = sender === 'user' ? '👤' : '🤖';

        messageDiv.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <p>${message}</p>
            </div>
        `;

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    clearChat() {
        const chatMessages = document.getElementById('chat-messages');
        // Keep the welcome message
        const welcomeMessage = chatMessages.querySelector('.message');
        chatMessages.innerHTML = '';
        if (welcomeMessage) {
            chatMessages.appendChild(welcomeMessage);
        }
    }

    showProcessing(show) {
        const overlay = document.getElementById('processing-overlay');
        if (show) {
            overlay?.classList.remove('hidden');
        } else {
            overlay?.classList.add('hidden');
        }
    }

    updateProcessingStatus(current, total, status) {
        document.getElementById('processing-status').textContent = status;
        document.getElementById('progress-text').textContent = `${current + 1} / ${total}`;
        const percentage = ((current + 1) / total) * 100;
        document.getElementById('progress-fill').style.width = `${percentage}%`;
    }

    openSettingsModal() {
        const modal = document.getElementById('settings-modal');

        // Load current settings
        document.getElementById('gemini-api-key').value = this.geminiService.apiKey;
        document.getElementById('gemini-model').value = this.geminiService.model;
        document.getElementById('extraction-mode').value = this.currentExtractionMode;

        // Update usage stats
        this.updateUsageDisplay();

        modal.classList.add('active');
    }

    async saveSettings() {
        const apiKey = document.getElementById('gemini-api-key').value.trim();
        const model = document.getElementById('gemini-model').value;
        const extractionMode = document.getElementById('extraction-mode').value;

        // Validate API key if changed
        if (apiKey && apiKey !== this.geminiService.apiKey) {
            this.addToChat('assistant', '🔄 Validating API key...');

            const valid = await this.geminiService.validateApiKey(apiKey);
            if (!valid) {
                // Check console for more details
                this.showError('Invalid API key. Please check: 1) No extra spaces, 2) Correct API key from Google AI Studio, 3) Check browser console for details');
                return;
            }
        }

        // Save settings even without validation for testing
        if (apiKey) {
            this.geminiService.setApiKey(apiKey);
        }

        this.geminiService.setModel(model);
        this.currentExtractionMode = extractionMode;

        // Save other preferences
        localStorage.setItem('auto_process', document.getElementById('auto-process').checked);
        localStorage.setItem('save_history', document.getElementById('save-history').checked);

        // Close modal
        document.getElementById('settings-modal').classList.remove('active');

        this.addToChat('assistant', '✅ Settings saved successfully!');
    }

    loadSettings() {
        // Load preferences
        const autoProcess = localStorage.getItem('auto_process');
        const saveHistory = localStorage.getItem('save_history');

        if (autoProcess !== null) {
            document.getElementById('auto-process').checked = autoProcess === 'true';
        }
        if (saveHistory !== null) {
            document.getElementById('save-history').checked = saveHistory === 'true';
        }

        // Check if API key is configured
        if (!this.geminiService.isConfigured()) {
            setTimeout(() => {
                this.addToChat('assistant', '⚠️ Please configure your Gemini API key in settings to start using the AI assistant.');
            }, 1000);
        }
    }

    updateUsageDisplay() {
        const stats = this.geminiService.getUsageStats();

        document.getElementById('requests-used').textContent = stats.used;
        document.getElementById('usage-bar').style.width = `${stats.percentage}%`;

        // Update bar color based on usage
        const bar = document.getElementById('usage-bar');
        if (stats.percentage >= 90) {
            bar.style.backgroundColor = '#dc3545';
        } else if (stats.percentage >= 70) {
            bar.style.backgroundColor = '#ffc107';
        } else {
            bar.style.backgroundColor = '#28a745';
        }
    }

    closeModal() {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    showError(message) {
        this.addToChat('assistant', `❌ ${message}`);
    }

    // Test API key directly
    async testApiKey() {
        const apiKey = document.getElementById('gemini-api-key').value.trim();

        if (!apiKey) {
            this.showError('Please enter an API key first');
            return;
        }

        this.addToChat('assistant', '🔄 Testing API key...');

        try {
            // Direct test without validation wrapper
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: "Say hello"
                            }]
                        }]
                    })
                }
            );

            const data = await response.json();

            if (response.ok) {
                this.addToChat('assistant', '✅ API key is valid and working!');
                // Auto-save the key
                this.geminiService.setApiKey(apiKey);
            } else {
                console.error('API test response:', data);
                if (data.error?.message) {
                    this.showError(`API Error: ${data.error.message}`);
                } else {
                    this.showError('API key test failed. Check browser console for details.');
                }
            }
        } catch (error) {
            console.error('Test error:', error);
            this.showError(`Connection error: ${error.message}`);
        }
    }
}

// Initialize the AI Assistant
const aiAssistant = new AIAssistant();