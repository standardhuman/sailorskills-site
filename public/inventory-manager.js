// Enhanced Inventory Management System
// Extension of AnodeManager with full inventory capabilities

class InventoryManager extends AnodeManager {
    constructor() {
        super();
        this.inventoryItems = [];
        this.generalItems = [];
        this.replenishmentList = [];
        this.suppliers = [];
        this.currentInventoryTab = 'all-items';
        this.inventoryFilters = {
            search: '',
            category: '',
            lowStock: false,
            outOfStock: false,
            critical: false
        };
    }

    setupInventoryListeners() {
        // Inventory buttons
        document.getElementById('add-item')?.addEventListener('click', () => {
            this.showAddItemModal();
        });

        document.getElementById('add-stock')?.addEventListener('click', () => {
            this.showStockTransactionModal('purchase');
        });

        document.getElementById('inventory-count')?.addEventListener('click', () => {
            this.showStockTransactionModal('count');
        });

        document.getElementById('replenishment-list')?.addEventListener('click', () => {
            this.showReplenishmentModal();
        });

        // Quick filter buttons
        document.querySelectorAll('.quick-filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.applyQuickFilter(e.target.dataset.filter);
                // Update button states
                document.querySelectorAll('.quick-filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // Inventory tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchInventoryTab(e.target.dataset.tab);
            });
        });

        // Inventory search and filters
        document.getElementById('inventory-search')?.addEventListener('input', (e) => {
            this.inventoryFilters.search = e.target.value;
            this.filterInventory();
        });

        document.getElementById('show-low-stock')?.addEventListener('change', (e) => {
            this.inventoryFilters.lowStock = e.target.checked;
            this.filterInventory();
        });

        document.getElementById('show-out-of-stock')?.addEventListener('change', (e) => {
            this.inventoryFilters.outOfStock = e.target.checked;
            this.filterInventory();
        });

        document.getElementById('show-critical')?.addEventListener('change', (e) => {
            this.inventoryFilters.critical = e.target.checked;
            this.filterInventory();
        });

        // Form submissions
        document.getElementById('add-item-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitNewItem();
        });

        document.getElementById('stock-transaction-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitStockTransaction();
        });

        document.getElementById('charge-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitCustomerCharge();
        });
    }

    async loadInventory() {
        try {
            // Load anodes with inventory data
            const { data: anodeData, error: anodeError } = await this.supabase
                .from('anodes_catalog')
                .select(`
                    *,
                    anode_inventory!inner(*)
                `)
                .eq('is_active', true);

            if (anodeError) throw anodeError;

            // Load general inventory items
            const { data: itemData, error: itemError } = await this.supabase
                .from('inventory_items')
                .select(`
                    *,
                    item_categories(name)
                `)
                .eq('is_active', true);

            if (itemError) throw itemError;

            this.inventoryItems = [
                ...anodeData.map(a => ({
                    type: 'anode',
                    id: a.id,
                    sku: a.sku || a.boatzincs_id,
                    name: a.name,
                    category: a.category || 'Anodes',
                    onHand: a.anode_inventory.quantity_on_hand,
                    allocated: a.anode_inventory.quantity_allocated,
                    available: a.anode_inventory.quantity_available,
                    minStock: a.anode_inventory.reorder_point,
                    reorderPoint: a.anode_inventory.reorder_point,
                    reorderQty: a.anode_inventory.reorder_quantity,
                    location: a.anode_inventory.primary_location,
                    unitCost: a.list_price,
                    lastCounted: a.anode_inventory.last_counted
                })),
                ...itemData.map(i => ({
                    type: 'item',
                    id: i.id,
                    sku: i.sku,
                    name: i.name,
                    description: i.description,
                    amazonUrl: i.amazon_url,
                    category: i.item_categories?.name || i.category_id,
                    onHand: i.quantity_on_hand,
                    allocated: i.quantity_allocated,
                    available: i.quantity_available,
                    minStock: i.minimum_stock_level,
                    reorderPoint: i.reorder_point,
                    reorderQty: i.reorder_quantity,
                    location: i.primary_location,
                    unitCost: i.unit_cost,
                    lastCounted: i.last_counted_date
                }))
            ];

            this.renderInventory();
            this.checkStockAlerts();

        } catch (error) {
            console.error('Error loading inventory:', error);
            alert('Failed to load inventory: ' + error.message);
        }
    }

    renderInventory() {
        const tbody = document.querySelector('#inventory-table tbody');
        if (!tbody) return;

        // Apply filters
        let filtered = this.filterInventoryItems();

        // Clear existing rows
        tbody.innerHTML = '';

        // Render each item
        filtered.forEach(item => {
            const row = document.createElement('tr');
            const stockLevel = this.getStockLevel(item);

            row.innerHTML = `
                <td><span class="badge badge-${item.type === 'anode' ? 'info' : 'secondary'}">${item.type}</span></td>
                <td>${item.sku || '-'}</td>
                <td>${item.name}</td>
                <td>${item.category}</td>
                <td class="${item.onHand === 0 ? 'text-danger' : ''}">${item.onHand}</td>
                <td>${item.allocated}</td>
                <td><strong>${item.available}</strong></td>
                <td>${item.minStock}</td>
                <td>${item.reorderPoint}</td>
                <td>${item.location || '-'}</td>
                <td>$${item.unitCost ? item.unitCost.toFixed(2) : '0.00'}</td>
                <td>
                    <div class="action-btns">
                        <button class="action-btn adjust" onclick="inventoryManager.showAdjustStock('${item.id}', '${item.type}')">Adjust</button>
                        ${item.type === 'anode' ?
                            `<button class="action-btn charge" onclick="inventoryManager.showChargeCustomer('${item.id}')">Charge</button>` :
                            item.amazonUrl ?
                                `<button class="action-btn order" onclick="inventoryManager.orderFromAmazon('${item.id}')">🛒 Order</button>` :
                                ''}
                        <button class="action-btn edit" onclick="inventoryManager.editItem('${item.id}', '${item.type}')">Edit</button>
                    </div>
                </td>
            `;

            // Add stock level indicator
            if (stockLevel === 'critical') {
                row.classList.add('table-danger');
            } else if (stockLevel === 'low') {
                row.classList.add('table-warning');
            }

            tbody.appendChild(row);
        });
    }

    filterInventoryItems() {
        let filtered = [...this.inventoryItems];

        // Tab filter
        if (this.currentInventoryTab !== 'all-items') {
            const categoryMap = {
                'anodes': 'anode',
                'tools': 'Tools',
                'equipment': 'Equipment',
                'consumables': 'Consumables'
            };

            if (this.currentInventoryTab === 'anodes') {
                filtered = filtered.filter(item => item.type === 'anode');
            } else {
                filtered = filtered.filter(item =>
                    item.type === 'item' &&
                    item.category === categoryMap[this.currentInventoryTab]
                );
            }
        }

        // Search filter
        if (this.inventoryFilters.search) {
            const search = this.inventoryFilters.search.toLowerCase();
            filtered = filtered.filter(item =>
                item.name.toLowerCase().includes(search) ||
                (item.sku && item.sku.toLowerCase().includes(search)) ||
                (item.location && item.location.toLowerCase().includes(search))
            );
        }

        // Stock filters
        if (this.inventoryFilters.inStockOnly) {
            filtered = filtered.filter(item => item.available > 0);
            delete this.inventoryFilters.inStockOnly;
        }

        if (this.inventoryFilters.lowStock) {
            filtered = filtered.filter(item => item.available <= item.reorderPoint && item.available > 0);
        }

        if (this.inventoryFilters.outOfStock) {
            filtered = filtered.filter(item => item.available === 0);
        }

        if (this.inventoryFilters.critical) {
            filtered = filtered.filter(item => item.available < item.minStock);
        }

        if (this.inventoryFilters.needsReorder) {
            filtered = filtered.filter(item => item.available <= item.reorderPoint);
            delete this.inventoryFilters.needsReorder;
        }

        return filtered;
    }

    getStockLevel(item) {
        if (item.available === 0) return 'out';
        if (item.available < item.minStock) return 'critical';
        if (item.available <= item.reorderPoint) return 'low';
        if (item.available > item.reorderPoint * 3) return 'excess';
        return 'adequate';
    }

    checkStockAlerts() {
        const criticalItems = this.inventoryItems.filter(item =>
            item.available < item.minStock && item.available > 0
        );
        const lowStockItems = this.inventoryItems.filter(item =>
            item.available <= item.reorderPoint && item.available > item.minStock
        );

        const alertsDiv = document.getElementById('stock-alerts');
        if (criticalItems.length > 0 || lowStockItems.length > 0) {
            alertsDiv?.classList.remove('hidden');
            document.getElementById('critical-count').textContent = criticalItems.length;
            document.getElementById('low-stock-count').textContent = lowStockItems.length;
        } else {
            alertsDiv?.classList.add('hidden');
        }
    }

    switchInventoryTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`)?.classList.add('active');

        this.currentInventoryTab = tab;
        this.renderInventory();
    }

    filterInventory() {
        this.renderInventory();
    }

    applyQuickFilter(filterType) {
        // Reset all checkboxes
        document.getElementById('show-low-stock').checked = false;
        document.getElementById('show-out-of-stock').checked = false;
        document.getElementById('show-critical').checked = false;

        // Reset filters
        this.inventoryFilters.lowStock = false;
        this.inventoryFilters.outOfStock = false;
        this.inventoryFilters.critical = false;

        switch(filterType) {
            case 'all':
                // Show all items - filters already reset
                break;
            case 'in-stock':
                // Will be handled in filterInventoryItems
                this.inventoryFilters.inStockOnly = true;
                break;
            case 'low-stock':
                this.inventoryFilters.lowStock = true;
                document.getElementById('show-low-stock').checked = true;
                break;
            case 'out-of-stock':
                this.inventoryFilters.outOfStock = true;
                document.getElementById('show-out-of-stock').checked = true;
                break;
            case 'critical':
                this.inventoryFilters.critical = true;
                document.getElementById('show-critical').checked = true;
                break;
            case 'needs-reorder':
                this.inventoryFilters.needsReorder = true;
                break;
        }

        this.filterInventory();
    }

    // Modal Management
    showAddItemModal() {
        this.loadAnodeOptions();
        this.loadCategoryOptions();
        document.getElementById('add-item-modal').classList.add('active');
    }

    async showStockTransactionModal(type = 'adjustment') {
        document.getElementById('transaction-type').value = type;
        await this.loadItemOptions();
        this.updateTransactionForm(type);
        document.getElementById('stock-transaction-modal').classList.add('active');
    }

    showReplenishmentModal() {
        this.loadReplenishmentList();
        document.getElementById('replenishment-modal').classList.add('active');
    }

    showChargeCustomer(anodeId = null) {
        this.loadAnodeOptionsForCharge();
        if (anodeId) {
            // Pre-select the anode if provided
            setTimeout(() => {
                document.querySelector('.charge-anode-select').value = anodeId;
            }, 100);
        }
        document.getElementById('charge-modal').classList.add('active');
    }

    showAdjustStock(itemId, itemType) {
        this.showStockTransactionModal('adjustment');
        setTimeout(() => {
            document.getElementById('transaction-item').value = `${itemType}:${itemId}`;
            this.updateCurrentStock(itemId, itemType);
        }, 100);
    }

    editItem(itemId, itemType) {
        // Load item details and show edit modal
        // This would be similar to add item modal but with pre-filled values
        alert(`Edit functionality for ${itemType} ${itemId} - Coming soon!`);
    }

    toggleItemType(type) {
        if (type === 'general') {
            document.getElementById('general-item-fields').classList.remove('hidden');
            document.getElementById('anode-item-fields').classList.add('hidden');
        } else {
            document.getElementById('general-item-fields').classList.add('hidden');
            document.getElementById('anode-item-fields').classList.remove('hidden');
        }
    }

    updateTransactionForm(type) {
        const quantityGroup = document.getElementById('quantity-group');
        const newCountGroup = document.getElementById('new-count-group');
        const referenceGroup = document.getElementById('reference-group');

        if (type === 'count') {
            quantityGroup?.classList.add('hidden');
            newCountGroup?.classList.remove('hidden');
        } else {
            quantityGroup?.classList.remove('hidden');
            newCountGroup?.classList.add('hidden');
        }

        // Update reference label based on type
        const refLabel = referenceGroup?.querySelector('label');
        if (refLabel) {
            const labels = {
                'purchase': 'PO Number:',
                'customer_charge': 'Customer Name:',
                'damage': 'Incident Report:',
                'return': 'Return Authorization:'
            };
            refLabel.textContent = labels[type] || 'Reference:';
        }
    }

    async updateCurrentStock(itemId, itemType) {
        const item = this.inventoryItems.find(i =>
            i.id === itemId && i.type === itemType
        );
        if (item) {
            document.getElementById('current-stock').value = item.onHand;
        }
    }

    // Data Loading
    async loadAnodeOptions() {
        try {
            const { data, error } = await this.supabase
                .from('anodes_catalog')
                .select('id, name, boatzincs_id')
                .eq('is_active', true)
                .order('name');

            if (error) throw error;

            const select = document.getElementById('anode-select');
            select.innerHTML = '<option value="">Search or select an anode...</option>';
            data.forEach(anode => {
                select.innerHTML += `<option value="${anode.id}">${anode.name} (${anode.boatzincs_id})</option>`;
            });
        } catch (error) {
            console.error('Error loading anode options:', error);
        }
    }

    async loadCategoryOptions() {
        try {
            const { data, error } = await this.supabase
                .from('item_categories')
                .select('id, name')
                .eq('is_active', true)
                .order('sort_order');

            if (error) throw error;

            const select = document.getElementById('item-category');
            select.innerHTML = '<option value="">Select Category</option>';
            data.forEach(cat => {
                select.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
            });
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    async loadItemOptions() {
        const select = document.getElementById('transaction-item');
        select.innerHTML = '<option value="">Select an item...</option>';

        // Add all inventory items
        this.inventoryItems.forEach(item => {
            select.innerHTML += `<option value="${item.type}:${item.id}">${item.name} (${item.sku || 'No SKU'})</option>`;
        });
    }

    async loadAnodeOptionsForCharge() {
        const selects = document.querySelectorAll('.charge-anode-select');
        const anodes = this.inventoryItems.filter(i => i.type === 'anode' && i.available > 0);

        selects.forEach(select => {
            select.innerHTML = '<option value="">Select anode...</option>';
            anodes.forEach(anode => {
                select.innerHTML += `<option value="${anode.id}">${anode.name} (Available: ${anode.available})</option>`;
            });
        });
    }

    async loadReplenishmentList() {
        try {
            const { data, error } = await this.supabase
                .from('replenishment_list')
                .select(`
                    *,
                    anodes_catalog(name, sku, list_price),
                    inventory_items(name, sku, unit_cost),
                    anode_inventory(quantity_on_hand, reorder_point),
                    inventory_items!inner(quantity_on_hand, reorder_point)
                `)
                .eq('status', 'pending')
                .order('priority', { ascending: false });

            if (error) throw error;

            this.replenishmentList = data;
            this.renderReplenishmentList();

        } catch (error) {
            console.error('Error loading replenishment list:', error);
        }
    }

    renderReplenishmentList() {
        const tbody = document.getElementById('replenishment-items');
        if (!tbody) return;

        tbody.innerHTML = '';
        let total = 0;

        this.replenishmentList.forEach(item => {
            const isAnode = item.anode_id !== null;
            const product = isAnode ? item.anodes_catalog : item.inventory_items;
            const inventory = isAnode ? item.anode_inventory : item.inventory_items;
            const unitCost = isAnode ? product.list_price : product.unit_cost;
            const lineTotal = (item.quantity_to_order || item.quantity_needed) * unitCost;
            total += lineTotal;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" class="replenish-select" data-id="${item.id}"></td>
                <td>${product.name}</td>
                <td>${product.sku || '-'}</td>
                <td>${inventory.quantity_on_hand}</td>
                <td>${inventory.reorder_point}</td>
                <td>${item.quantity_needed}</td>
                <td><input type="number" class="qty-to-order" value="${item.quantity_to_order || item.quantity_needed}" min="1" data-id="${item.id}"></td>
                <td>$${unitCost.toFixed(2)}</td>
                <td>$${lineTotal.toFixed(2)}</td>
                <td><span class="badge badge-${this.getPriorityClass(item.priority)}">${item.priority}</span></td>
                <td>
                    <button class="action-btn delete" onclick="inventoryManager.removeFromReplenishment('${item.id}')">Remove</button>
                </td>
            `;
            tbody.appendChild(row);
        });

        document.getElementById('replenishment-total').textContent = `$${total.toFixed(2)}`;
    }

    getPriorityClass(priority) {
        const classes = {
            'critical': 'danger',
            'high': 'warning',
            'medium': 'info',
            'low': 'secondary'
        };
        return classes[priority] || 'secondary';
    }

    // Form Submissions
    async submitNewItem() {
        const itemType = document.getElementById('item-type').value;

        try {
            if (itemType === 'general') {
                // Add general inventory item
                const { data, error } = await this.supabase
                    .from('inventory_items')
                    .insert({
                        sku: document.getElementById('item-sku').value || null,
                        name: document.getElementById('item-name').value,
                        category_id: document.getElementById('item-category').value,
                        description: document.getElementById('item-description').value,
                        amazon_url: document.getElementById('item-amazon-url').value || null,
                        quantity_on_hand: parseInt(document.getElementById('initial-quantity').value) || 0,
                        unit_cost: parseFloat(document.getElementById('unit-cost').value) || 0,
                        minimum_stock_level: parseInt(document.getElementById('min-stock').value) || 0,
                        reorder_point: parseInt(document.getElementById('reorder-point').value) || 5,
                        reorder_quantity: parseInt(document.getElementById('reorder-qty').value) || 10,
                        primary_location: document.getElementById('primary-location').value,
                        bin_number: document.getElementById('bin-number').value,
                        notes: document.getElementById('item-notes').value
                    });

                if (error) throw error;
            } else {
                // Add anode to inventory
                const anodeId = document.getElementById('anode-select').value;
                if (!anodeId) {
                    alert('Please select an anode');
                    return;
                }

                const { data, error } = await this.supabase
                    .from('anode_inventory')
                    .upsert({
                        anode_id: anodeId,
                        quantity_on_hand: parseInt(document.getElementById('initial-quantity').value) || 0,
                        reorder_point: parseInt(document.getElementById('reorder-point').value) || 5,
                        reorder_quantity: parseInt(document.getElementById('reorder-qty').value) || 10,
                        primary_location: document.getElementById('primary-location').value,
                        bin_number: document.getElementById('bin-number').value,
                        average_cost: parseFloat(document.getElementById('unit-cost').value) || null
                    });

                if (error) throw error;
            }

            alert('Item added successfully!');
            this.closeModal();
            this.loadInventory();

        } catch (error) {
            console.error('Error adding item:', error);
            alert('Failed to add item: ' + error.message);
        }
    }

    async submitStockTransaction() {
        const type = document.getElementById('transaction-type').value;
        const [itemType, itemId] = document.getElementById('transaction-item').value.split(':');

        try {
            let quantity;
            if (type === 'count') {
                const newCount = parseInt(document.getElementById('new-count').value);
                const currentStock = parseInt(document.getElementById('current-stock').value);
                quantity = newCount - currentStock;
            } else {
                quantity = parseInt(document.getElementById('transaction-quantity').value);
            }

            // Record transaction
            const { data, error } = await this.supabase
                .from('inventory_transactions')
                .insert({
                    transaction_type: type,
                    [itemType === 'anode' ? 'anode_id' : 'item_id']: itemId,
                    quantity: quantity,
                    reference_type: type,
                    reference_id: document.getElementById('transaction-reference').value,
                    notes: document.getElementById('transaction-notes').value,
                    performed_by: 'current_user' // Would get from auth
                });

            if (error) throw error;

            // Update inventory quantity
            const table = itemType === 'anode' ? 'anode_inventory' : 'inventory_items';
            const idField = itemType === 'anode' ? 'anode_id' : 'id';

            const { error: updateError } = await this.supabase
                .from(table)
                .update({
                    quantity_on_hand: this.supabase.sql`quantity_on_hand + ${quantity}`
                })
                .eq(idField, itemId);

            if (updateError) throw updateError;

            alert('Stock transaction completed successfully!');
            this.closeModal();
            this.loadInventory();

        } catch (error) {
            console.error('Error processing transaction:', error);
            alert('Failed to process transaction: ' + error.message);
        }
    }

    async submitCustomerCharge() {
        const customer = document.getElementById('charge-customer').value;
        const addToReplenishment = document.getElementById('add-to-replenishment').checked;
        const items = [];

        // Collect all charge items
        document.querySelectorAll('.charge-item').forEach(item => {
            const anodeId = item.querySelector('.charge-anode-select').value;
            const quantity = parseInt(item.querySelector('.charge-quantity').value);
            if (anodeId && quantity > 0) {
                items.push({ anodeId, quantity });
            }
        });

        if (items.length === 0) {
            alert('Please select at least one anode');
            return;
        }

        try {
            // Process each charged item
            for (const item of items) {
                // Use the stored procedure to handle the charge
                const { error } = await this.supabase
                    .rpc('process_customer_charge', {
                        p_anode_id: item.anodeId,
                        p_quantity: item.quantity,
                        p_customer_ref: customer,
                        p_performed_by: 'current_user'
                    });

                if (error) throw error;
            }

            alert(`Successfully charged ${items.length} item(s) to ${customer}`);
            this.closeModal();
            this.loadInventory();

        } catch (error) {
            console.error('Error processing customer charge:', error);
            alert('Failed to process charge: ' + error.message);
        }
    }

    // Helper Methods
    addChargeItem() {
        const container = document.getElementById('charge-items-list');
        const newItem = document.createElement('div');
        newItem.className = 'charge-item';
        newItem.innerHTML = `
            <select class="charge-anode-select">
                <option value="">Select anode...</option>
            </select>
            <input type="number" class="charge-quantity" placeholder="Qty" min="1" value="1">
            <button type="button" class="btn-remove" onclick="inventoryManager.removeChargeItem(this)">×</button>
        `;
        container.appendChild(newItem);

        // Load options for the new select
        this.loadAnodeOptionsForCharge();
    }

    removeChargeItem(button) {
        const items = document.querySelectorAll('.charge-item');
        if (items.length > 1) {
            button.parentElement.remove();
        }
    }

    async removeFromReplenishment(id) {
        if (!confirm('Remove this item from replenishment list?')) return;

        try {
            const { error } = await this.supabase
                .from('replenishment_list')
                .update({ status: 'cancelled' })
                .eq('id', id);

            if (error) throw error;

            this.loadReplenishmentList();
        } catch (error) {
            console.error('Error removing from replenishment:', error);
            alert('Failed to remove item: ' + error.message);
        }
    }

    async generatePO() {
        const selected = [];
        document.querySelectorAll('.replenish-select:checked').forEach(cb => {
            const id = cb.dataset.id;
            const qtyInput = document.querySelector(`.qty-to-order[data-id="${id}"]`);
            selected.push({
                id: id,
                quantity: parseInt(qtyInput.value)
            });
        });

        if (selected.length === 0) {
            alert('Please select items to include in the purchase order');
            return;
        }

        // Here you would create a purchase order with the selected items
        alert(`Creating PO with ${selected.length} items - Feature coming soon!`);
    }

    exportReplenishment() {
        // Export replenishment list to CSV
        alert('Export feature coming soon!');
    }

    async autoAddLowStock() {
        try {
            // Get all items below reorder point
            const lowStock = this.inventoryItems.filter(item =>
                item.available <= item.reorderPoint
            );

            for (const item of lowStock) {
                // Add to replenishment list
                const { error } = await this.supabase
                    .rpc('add_to_replenishment', {
                        p_item_type: item.type,
                        p_item_id: item.id,
                        p_quantity: item.reorderQty,
                        p_source: 'auto_reorder',
                        p_requested_by: 'system'
                    });

                if (error) console.error('Error adding item to replenishment:', error);
            }

            alert(`Added ${lowStock.length} low stock items to replenishment list`);
            this.loadReplenishmentList();

        } catch (error) {
            console.error('Error auto-adding low stock:', error);
            alert('Failed to add low stock items: ' + error.message);
        }
    }

    orderFromAmazon(itemId) {
        const item = this.inventoryItems.find(i => i.id === itemId && i.type === 'item');
        if (!item || !item.amazonUrl) return;

        const quantity = prompt(`How many ${item.name} do you want to order?\n\nCurrent stock: ${item.available}\nReorder quantity: ${item.reorderQty}`, item.reorderQty);

        if (quantity && parseInt(quantity) > 0) {
            // Open Amazon URL in new tab
            window.open(item.amazonUrl, '_blank');

            // Record the order in the system
            this.recordAmazonOrder(itemId, parseInt(quantity));

            alert(`Opening Amazon to order ${quantity} x ${item.name}.\n\nPlease complete the order on Amazon, then the stock will be automatically updated when received.`);
        }
    }

    async recordAmazonOrder(itemId, quantity) {
        try {
            // Record the pending order
            const { error } = await this.supabase
                .from('inventory_transactions')
                .insert({
                    transaction_type: 'pending_order',
                    item_id: itemId,
                    quantity: quantity,
                    reference_type: 'amazon_order',
                    reference_id: `AMAZON-${Date.now()}`,
                    notes: 'Order placed via Amazon',
                    performed_by: 'current_user'
                });

            if (error) throw error;

            // Add to replenishment tracking
            const { error: repError } = await this.supabase
                .from('replenishment_list')
                .insert({
                    item_id: itemId,
                    quantity_needed: quantity,
                    quantity_to_order: quantity,
                    status: 'ordered',
                    source: 'amazon',
                    requested_by: 'current_user',
                    priority: 'medium'
                });

            if (repError) console.error('Error tracking replenishment:', repError);

        } catch (error) {
            console.error('Error recording Amazon order:', error);
        }
    }

    closeModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }
}

// Initialize the inventory manager
const inventoryManager = new InventoryManager();

// Override the original anodeManager variable
window.anodeManager = inventoryManager;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    inventoryManager.setupInventoryListeners();
});