// Anode Management System JavaScript

class AnodeManager {
    constructor() {
        this.supabase = null;
        this.currentView = 'catalog';
        this.catalogData = [];
        this.inventoryData = [];
        this.ordersData = [];
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.filters = {
            search: '',
            material: '',
            category: '',
            inStock: false,
            lowStock: false
        };
        this.selectedProduct = null;

        this.init();
    }

    async init() {
        // Initialize Supabase
        this.initSupabase();

        // Set up event listeners
        this.setupEventListeners();

        // Load initial data
        await this.loadCatalog();

        // Check for sync status
        await this.checkSyncStatus();
    }

    initSupabase() {
        // Get credentials from environment or config
        const supabaseUrl = window.SUPABASE_URL || prompt('Enter Supabase URL:');
        const supabaseKey = window.SUPABASE_ANON_KEY || prompt('Enter Supabase Anon Key:');

        if (!supabaseUrl || !supabaseKey) {
            alert('Supabase credentials are required');
            return;
        }

        this.supabase = supabase.createClient(supabaseUrl, supabaseKey);
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchView(e.target.dataset.view);
            });
        });

        // Catalog filters
        document.getElementById('catalog-search')?.addEventListener('input', (e) => {
            this.filters.search = e.target.value;
            this.filterCatalog();
        });

        document.getElementById('material-filter')?.addEventListener('change', (e) => {
            this.filters.material = e.target.value;
            this.filterCatalog();
        });

        document.getElementById('category-filter')?.addEventListener('change', (e) => {
            this.filters.category = e.target.value;
            this.filterCatalog();
        });

        document.getElementById('refresh-catalog')?.addEventListener('click', () => {
            this.loadCatalog(true);
        });

        // Inventory filters
        document.getElementById('show-low-stock')?.addEventListener('change', (e) => {
            this.filters.lowStock = e.target.checked;
            this.loadInventory();
        });

        document.getElementById('show-out-of-stock')?.addEventListener('change', (e) => {
            this.filters.outOfStock = e.target.checked;
            this.loadInventory();
        });

        // Sync buttons
        document.getElementById('sync-full')?.addEventListener('click', () => {
            this.startSync('full_catalog');
        });

        document.getElementById('sync-prices')?.addEventListener('click', () => {
            this.startSync('price_update');
        });

        document.getElementById('sync-stock')?.addEventListener('click', () => {
            this.startSync('stock_check');
        });

        // Order management
        document.getElementById('create-order')?.addEventListener('click', () => {
            this.showOrderModal();
        });

        document.getElementById('auto-reorder')?.addEventListener('click', () => {
            this.createAutoReorder();
        });

        document.getElementById('order-status-filter')?.addEventListener('change', (e) => {
            this.loadOrders(e.target.value);
        });

        // Modal close buttons
        document.querySelectorAll('.close').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeModal();
            });
        });

        // Order form
        document.getElementById('order-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitOrder();
        });
    }

    switchView(view) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');

        // Update view
        document.querySelectorAll('.view').forEach(v => {
            v.classList.remove('active');
        });
        document.getElementById(`${view}-view`).classList.add('active');

        this.currentView = view;

        // Load view-specific data
        switch(view) {
            case 'catalog':
                this.loadCatalog();
                break;
            case 'inventory':
                this.loadInventory();
                break;
            case 'orders':
                this.loadOrders();
                break;
            case 'sync':
                this.loadSyncLogs();
                break;
            case 'reports':
                // Reports are loaded on demand
                break;
        }
    }

    async loadCatalog(refresh = false) {
        try {
            const { data, error } = await this.supabase
                .from('anodes_catalog')
                .select('*')
                .eq('is_active', true)
                .order('name');

            if (error) throw error;

            this.catalogData = data;
            this.renderCatalog();
            this.updateCatalogStats();

        } catch (error) {
            console.error('Error loading catalog:', error);
            alert('Failed to load catalog: ' + error.message);
        }
    }

    renderCatalog() {
        const grid = document.getElementById('catalog-grid');
        if (!grid) return;

        // Apply filters
        let filtered = this.catalogData;

        if (this.filters.search) {
            const search = this.filters.search.toLowerCase();
            filtered = filtered.filter(item =>
                item.name.toLowerCase().includes(search) ||
                item.boatzincs_id.toLowerCase().includes(search) ||
                (item.sku && item.sku.toLowerCase().includes(search))
            );
        }

        if (this.filters.material) {
            filtered = filtered.filter(item => item.material === this.filters.material);
        }

        if (this.filters.category) {
            filtered = filtered.filter(item => item.category === this.filters.category);
        }

        // Pagination
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const paginated = filtered.slice(start, end);

        // Render products
        grid.innerHTML = paginated.map(product => `
            <div class="product-card" data-id="${product.id}" onclick="anodeManager.showProductDetails('${product.id}')">
                ${product.image_url ?
                    `<img src="${product.image_url}" alt="${product.name}" class="product-image">` :
                    `<div class="product-image" style="display: flex; align-items: center; justify-content: center; background: #f5f5f5;">
                        <span style="font-size: 48px; color: #ddd;">⚓</span>
                    </div>`
                }
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-meta">
                        <span class="product-sku">${product.boatzincs_id}</span>
                        <span class="product-material badge badge-info">${product.material || 'N/A'}</span>
                    </div>
                    <div class="product-price">
                        ${product.is_on_sale && product.sale_price ?
                            `<span class="price-current">$${product.sale_price.toFixed(2)}</span>
                             <span class="price-original">$${product.list_price.toFixed(2)}</span>` :
                            `<span class="price-current">$${product.list_price.toFixed(2)}</span>`
                        }
                    </div>
                    <div class="product-stock ${this.getStockClass(product.stock_status)}">
                        ${this.getStockLabel(product.stock_status)}
                    </div>
                </div>
            </div>
        `).join('');

        // Render pagination
        this.renderPagination(filtered.length);
    }

    renderPagination(totalItems) {
        const pagination = document.getElementById('catalog-pagination');
        if (!pagination) return;

        const totalPages = Math.ceil(totalItems / this.itemsPerPage);

        let html = '';
        for (let i = 1; i <= totalPages; i++) {
            html += `<button class="page-btn ${i === this.currentPage ? 'active' : ''}"
                     onclick="anodeManager.goToPage(${i})">${i}</button>`;
        }

        pagination.innerHTML = html;
    }

    goToPage(page) {
        this.currentPage = page;
        this.renderCatalog();
    }

    filterCatalog() {
        this.currentPage = 1;
        this.renderCatalog();
    }

    updateCatalogStats() {
        const total = this.catalogData.length;
        const inStock = this.catalogData.filter(p => p.stock_status === 'in_stock').length;
        const onSale = this.catalogData.filter(p => p.is_on_sale).length;

        document.getElementById('total-products').textContent = total;
        document.getElementById('in-stock').textContent = inStock;
        document.getElementById('on-sale').textContent = onSale;
    }

    async showProductDetails(productId) {
        const product = this.catalogData.find(p => p.id === productId);
        if (!product) return;

        this.selectedProduct = product;

        // Populate modal
        document.getElementById('modal-product-name').textContent = product.name;
        document.getElementById('modal-sku').textContent = product.sku || 'N/A';
        document.getElementById('modal-boatzincs-id').textContent = product.boatzincs_id;
        document.getElementById('modal-category').textContent = product.category || 'N/A';
        document.getElementById('modal-material').textContent = product.material || 'N/A';
        document.getElementById('modal-list-price').textContent = product.list_price.toFixed(2);
        document.getElementById('modal-sale-price').textContent = product.sale_price ? product.sale_price.toFixed(2) : 'N/A';
        document.getElementById('modal-stock-status').textContent = this.getStockLabel(product.stock_status);
        document.getElementById('modal-description').textContent = product.description || 'No description available';
        document.getElementById('modal-last-updated').textContent = product.last_scraped ?
            new Date(product.last_scraped).toLocaleString() : 'Never';

        if (product.image_url) {
            document.getElementById('modal-product-image').src = product.image_url;
            document.getElementById('modal-product-image').style.display = 'block';
        } else {
            document.getElementById('modal-product-image').style.display = 'none';
        }

        // Show modal
        document.getElementById('product-modal').classList.add('active');
    }

    closeModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    viewOnBoatzincs() {
        if (this.selectedProduct && this.selectedProduct.product_url) {
            window.open(this.selectedProduct.product_url, '_blank');
        }
    }

    async addToInventory() {
        if (!this.selectedProduct) return;

        const quantity = prompt('Enter initial quantity:');
        if (!quantity) return;

        const location = prompt('Enter storage location (optional):');

        try {
            const { error } = await this.supabase
                .from('anode_inventory')
                .upsert({
                    anode_id: this.selectedProduct.id,
                    quantity_on_hand: parseInt(quantity),
                    primary_location: location || null,
                    last_counted: new Date().toISOString()
                });

            if (error) throw error;

            alert('Added to inventory successfully!');
            this.closeModal();

            if (this.currentView === 'inventory') {
                this.loadInventory();
            }
        } catch (error) {
            console.error('Error adding to inventory:', error);
            alert('Failed to add to inventory: ' + error.message);
        }
    }

    async loadInventory() {
        try {
            let query = this.supabase
                .from('anode_inventory')
                .select(`
                    *,
                    anode:anode_id (
                        boatzincs_id,
                        name,
                        list_price
                    )
                `)
                .order('quantity_available');

            if (this.filters.lowStock) {
                query = query.lte('quantity_available', 'reorder_point');
            }

            const { data, error } = await query;

            if (error) throw error;

            this.inventoryData = data;
            this.renderInventory();

        } catch (error) {
            console.error('Error loading inventory:', error);
            alert('Failed to load inventory: ' + error.message);
        }
    }

    renderInventory() {
        const tbody = document.querySelector('#inventory-table tbody');
        if (!tbody) return;

        if (this.inventoryData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">No inventory items found</td></tr>';
            return;
        }

        tbody.innerHTML = this.inventoryData.map(item => `
            <tr>
                <td>${item.anode.boatzincs_id}</td>
                <td>${item.anode.name}</td>
                <td>${item.quantity_on_hand}</td>
                <td>${item.quantity_allocated}</td>
                <td class="${item.quantity_available <= item.reorder_point ? 'text-danger' : ''}">
                    ${item.quantity_available}
                </td>
                <td>${item.reorder_point}</td>
                <td>${item.primary_location || 'N/A'}</td>
                <td>
                    <button class="btn btn-sm" onclick="anodeManager.updateInventory('${item.id}')">Edit</button>
                </td>
            </tr>
        `).join('');
    }

    async loadOrders(statusFilter = '') {
        try {
            let query = this.supabase
                .from('anode_orders')
                .select(`
                    *,
                    items:anode_order_items(count)
                `)
                .order('created_at', { ascending: false });

            if (statusFilter) {
                query = query.eq('status', statusFilter);
            }

            const { data, error } = await query;

            if (error) throw error;

            this.ordersData = data;
            this.renderOrders();

        } catch (error) {
            console.error('Error loading orders:', error);
            alert('Failed to load orders: ' + error.message);
        }
    }

    renderOrders() {
        const tbody = document.querySelector('#orders-table tbody');
        if (!tbody) return;

        if (this.ordersData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No orders found</td></tr>';
            return;
        }

        tbody.innerHTML = this.ordersData.map(order => `
            <tr>
                <td>${order.order_number || order.id.substring(0, 8)}</td>
                <td>${new Date(order.created_at).toLocaleDateString()}</td>
                <td>${order.order_type}</td>
                <td><span class="badge badge-${this.getStatusBadge(order.status)}">${order.status}</span></td>
                <td>${order.items[0].count} items</td>
                <td>$${(order.total_amount || 0).toFixed(2)}</td>
                <td>
                    <button class="btn btn-sm" onclick="anodeManager.viewOrder('${order.id}')">View</button>
                    ${order.status === 'draft' ?
                        `<button class="btn btn-sm btn-primary" onclick="anodeManager.submitOrder('${order.id}')">Submit</button>` :
                        ''
                    }
                </td>
            </tr>
        `).join('');
    }

    async startSync(syncType) {
        if (!confirm(`Start ${syncType} sync? This may take several minutes.`)) return;

        try {
            // Call API endpoint to trigger Python scraper
            const response = await fetch('/api/anodes/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: syncType,
                    triggered_by: 'web_interface'
                })
            });

            if (!response.ok) throw new Error('Failed to start sync');

            const result = await response.json();

            // Show progress
            document.getElementById('sync-progress').classList.remove('hidden');

            // Poll for updates
            this.pollSyncStatus(result.sync_id);

        } catch (error) {
            console.error('Error starting sync:', error);
            alert('Failed to start sync: ' + error.message);
        }
    }

    async pollSyncStatus(syncId) {
        const interval = setInterval(async () => {
            try {
                const { data, error } = await this.supabase
                    .from('anode_sync_logs')
                    .select('*')
                    .eq('id', syncId)
                    .single();

                if (error) throw error;

                // Update progress
                const progressText = document.querySelector('.progress-text');
                progressText.textContent = `Status: ${data.status} - Processed: ${data.items_processed}`;

                if (data.status === 'completed' || data.status === 'failed') {
                    clearInterval(interval);
                    document.getElementById('sync-progress').classList.add('hidden');

                    if (data.status === 'completed') {
                        alert(`Sync completed! Processed: ${data.items_processed}, Added: ${data.items_added}, Updated: ${data.items_updated}`);
                        this.loadCatalog(true);
                    } else {
                        alert(`Sync failed: ${data.error_message}`);
                    }

                    this.loadSyncLogs();
                }
            } catch (error) {
                console.error('Error polling sync status:', error);
                clearInterval(interval);
            }
        }, 5000); // Poll every 5 seconds
    }

    async loadSyncLogs() {
        try {
            const { data, error } = await this.supabase
                .from('anode_sync_logs')
                .select('*')
                .order('started_at', { ascending: false })
                .limit(20);

            if (error) throw error;

            this.renderSyncLogs(data);
            this.updateLastSyncTimes(data);

        } catch (error) {
            console.error('Error loading sync logs:', error);
        }
    }

    renderSyncLogs(logs) {
        const tbody = document.querySelector('#sync-logs-table tbody');
        if (!tbody) return;

        if (logs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">No sync logs found</td></tr>';
            return;
        }

        tbody.innerHTML = logs.map(log => `
            <tr>
                <td>${new Date(log.started_at).toLocaleString()}</td>
                <td>${log.sync_type}</td>
                <td><span class="badge badge-${this.getStatusBadge(log.status)}">${log.status}</span></td>
                <td>${log.items_processed || 0}</td>
                <td>${log.items_added || 0}</td>
                <td>${log.items_updated || 0}</td>
                <td>${log.items_failed || 0}</td>
                <td>${log.duration_seconds ? `${log.duration_seconds}s` : 'N/A'}</td>
            </tr>
        `).join('');
    }

    updateLastSyncTimes(logs) {
        const fullSync = logs.find(l => l.sync_type === 'full_catalog' && l.status === 'completed');
        const priceSync = logs.find(l => l.sync_type === 'price_update' && l.status === 'completed');
        const stockSync = logs.find(l => l.sync_type === 'stock_check' && l.status === 'completed');

        if (fullSync) {
            document.getElementById('last-full-sync').textContent = new Date(fullSync.started_at).toLocaleString();
        }
        if (priceSync) {
            document.getElementById('last-price-sync').textContent = new Date(priceSync.started_at).toLocaleString();
        }
        if (stockSync) {
            document.getElementById('last-stock-sync').textContent = new Date(stockSync.started_at).toLocaleString();
        }
    }

    async checkSyncStatus() {
        try {
            const { data } = await this.supabase
                .from('anode_sync_logs')
                .select('started_at')
                .eq('sync_type', 'full_catalog')
                .eq('status', 'completed')
                .order('started_at', { ascending: false })
                .limit(1)
                .single();

            if (data) {
                document.getElementById('last-sync').textContent = new Date(data.started_at).toLocaleDateString();
            }
        } catch (error) {
            console.error('Error checking sync status:', error);
        }
    }

    // Report functions
    async loadPriceChanges() {
        try {
            const { data, error } = await this.supabase
                .from('recent_price_changes')
                .select('*')
                .order('recorded_at', { ascending: false });

            if (error) throw error;

            const content = document.getElementById('report-content');
            content.innerHTML = `
                <h3>Recent Price Changes</h3>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>SKU</th>
                            <th>New Price</th>
                            <th>Change</th>
                            <th>% Change</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(item => `
                            <tr>
                                <td>${item.name}</td>
                                <td>${item.boatzincs_id}</td>
                                <td>$${item.new_price.toFixed(2)}</td>
                                <td class="${item.price_change > 0 ? 'text-danger' : 'text-success'}">
                                    ${item.price_change > 0 ? '+' : ''}$${item.price_change.toFixed(2)}
                                </td>
                                <td class="${item.percent_change > 0 ? 'text-danger' : 'text-success'}">
                                    ${item.percent_change > 0 ? '+' : ''}${item.percent_change.toFixed(1)}%
                                </td>
                                <td>${new Date(item.recorded_at).toLocaleDateString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } catch (error) {
            console.error('Error loading price changes:', error);
            alert('Failed to load price changes report');
        }
    }

    async loadLowStock() {
        try {
            const { data, error } = await this.supabase
                .from('anodes_needing_reorder')
                .select('*');

            if (error) throw error;

            const content = document.getElementById('report-content');
            const totalCost = data.reduce((sum, item) => sum + item.estimated_cost, 0);

            content.innerHTML = `
                <h3>Low Stock Alert</h3>
                <p>Total items needing reorder: <strong>${data.length}</strong></p>
                <p>Estimated reorder cost: <strong>$${totalCost.toFixed(2)}</strong></p>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>SKU</th>
                            <th>Product</th>
                            <th>Available</th>
                            <th>Reorder Point</th>
                            <th>Reorder Qty</th>
                            <th>Unit Price</th>
                            <th>Est. Cost</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(item => `
                            <tr>
                                <td>${item.boatzincs_id}</td>
                                <td>${item.name}</td>
                                <td class="text-danger">${item.quantity_available}</td>
                                <td>${item.reorder_point}</td>
                                <td>${item.reorder_quantity}</td>
                                <td>$${item.list_price.toFixed(2)}</td>
                                <td>$${item.estimated_cost.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div style="margin-top: 20px;">
                    <button class="btn btn-primary" onclick="anodeManager.createReorderFromReport()">
                        Create Reorder
                    </button>
                </div>
            `;
        } catch (error) {
            console.error('Error loading low stock report:', error);
            alert('Failed to load low stock report');
        }
    }

    // Helper functions
    getStockClass(status) {
        switch(status) {
            case 'in_stock': return 'stock-in';
            case 'out_of_stock': return 'stock-out';
            case 'limited': return 'stock-limited';
            default: return '';
        }
    }

    getStockLabel(status) {
        switch(status) {
            case 'in_stock': return '✓ In Stock';
            case 'out_of_stock': return '✗ Out of Stock';
            case 'limited': return '⚠ Limited Stock';
            case 'discontinued': return '⛔ Discontinued';
            default: return 'Unknown';
        }
    }

    getStatusBadge(status) {
        switch(status) {
            case 'completed': return 'success';
            case 'in_progress':
            case 'submitted':
            case 'confirmed': return 'info';
            case 'failed': return 'danger';
            case 'draft': return 'warning';
            default: return 'secondary';
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.anodeManager = new AnodeManager();
});