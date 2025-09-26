/**
 * Anode Management System API
 * RESTful endpoints for catalog, inventory, and ordering
 */

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { spawn } = require('child_process');
const path = require('path');
const cors = require('cors');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const router = express.Router();

// Initialize Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Middleware
router.use(cors());
router.use(express.json());

/**
 * Catalog Endpoints
 */

// Get all anodes with filters
router.get('/catalog', async (req, res) => {
    try {
        const {
            material,
            category,
            in_stock,
            on_sale,
            search,
            limit = 100,
            offset = 0
        } = req.query;

        let query = supabase
            .from('anodes_catalog')
            .select('*', { count: 'exact' })
            .eq('is_active', true);

        if (material) query = query.eq('material', material);
        if (category) query = query.eq('category', category);
        if (in_stock === 'true') query = query.eq('stock_status', 'in_stock');
        if (on_sale === 'true') query = query.eq('is_on_sale', true);
        if (search) {
            query = query.or(`name.ilike.%${search}%,boatzincs_id.ilike.%${search}%,sku.ilike.%${search}%`);
        }

        query = query
            .range(offset, offset + limit - 1)
            .order('name');

        const { data, error, count } = await query;

        if (error) throw error;

        res.json({
            success: true,
            data,
            total: count,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Catalog API error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get single anode details
router.get('/catalog/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('anodes_catalog')
            .select(`
                *,
                price_history:anode_price_history(
                    list_price,
                    sale_price,
                    recorded_at
                ),
                inventory:anode_inventory(
                    quantity_on_hand,
                    quantity_available,
                    primary_location
                )
            `)
            .eq('id', req.params.id)
            .single();

        if (error) throw error;

        res.json({
            success: true,
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Search anodes
router.get('/catalog/search/:query', async (req, res) => {
    try {
        const searchQuery = req.params.query;

        const { data, error } = await supabase
            .from('anodes_catalog')
            .select('*')
            .or(`name.ilike.%${searchQuery}%,boatzincs_id.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%`)
            .eq('is_active', true)
            .limit(20);

        if (error) throw error;

        res.json({
            success: true,
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Inventory Endpoints
 */

// Get inventory levels
router.get('/inventory', async (req, res) => {
    try {
        const { low_stock, location } = req.query;

        let query = supabase
            .from('anode_inventory')
            .select(`
                *,
                anode:anode_id(
                    boatzincs_id,
                    name,
                    list_price,
                    category,
                    material
                )
            `);

        if (low_stock === 'true') {
            query = query.lte('quantity_available', 'reorder_point');
        }

        if (location) {
            query = query.eq('primary_location', location);
        }

        const { data, error } = await query;

        if (error) throw error;

        res.json({
            success: true,
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Update inventory
router.put('/inventory/:id', async (req, res) => {
    try {
        const { quantity_on_hand, quantity_allocated, primary_location, reorder_point } = req.body;

        const updateData = {};
        if (quantity_on_hand !== undefined) updateData.quantity_on_hand = quantity_on_hand;
        if (quantity_allocated !== undefined) updateData.quantity_allocated = quantity_allocated;
        if (primary_location !== undefined) updateData.primary_location = primary_location;
        if (reorder_point !== undefined) updateData.reorder_point = reorder_point;

        updateData.last_counted = new Date().toISOString();

        const { data, error } = await supabase
            .from('anode_inventory')
            .update(updateData)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Add new inventory item
router.post('/inventory', async (req, res) => {
    try {
        const {
            anode_id,
            quantity_on_hand = 0,
            reorder_point = 5,
            reorder_quantity = 10,
            primary_location
        } = req.body;

        const { data, error } = await supabase
            .from('anode_inventory')
            .insert({
                anode_id,
                quantity_on_hand,
                reorder_point,
                reorder_quantity,
                primary_location,
                last_counted: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get reorder report
router.get('/inventory/reorder', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('anodes_needing_reorder')
            .select('*');

        if (error) throw error;

        const totalItems = data.length;
        const totalCost = data.reduce((sum, item) => sum + item.estimated_cost, 0);

        res.json({
            success: true,
            data,
            summary: {
                total_items: totalItems,
                estimated_cost: totalCost
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Order Endpoints
 */

// Get orders
router.get('/orders', async (req, res) => {
    try {
        const { status, limit = 50, offset = 0 } = req.query;

        let query = supabase
            .from('anode_orders')
            .select(`
                *,
                items:anode_order_items(count)
            `, { count: 'exact' });

        if (status) query = query.eq('status', status);

        query = query
            .range(offset, offset + limit - 1)
            .order('created_at', { ascending: false });

        const { data, error, count } = await query;

        if (error) throw error;

        res.json({
            success: true,
            data,
            total: count
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get order details
router.get('/orders/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('anode_orders')
            .select(`
                *,
                items:anode_order_items(
                    *,
                    anode:anode_id(
                        boatzincs_id,
                        name,
                        category,
                        material
                    )
                )
            `)
            .eq('id', req.params.id)
            .single();

        if (error) throw error;

        res.json({
            success: true,
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Create order
router.post('/orders', async (req, res) => {
    try {
        const { order_type = 'manual', items, notes } = req.body;

        // Create order
        const { data: order, error: orderError } = await supabase
            .from('anode_orders')
            .insert({
                order_type,
                status: 'draft',
                notes,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (orderError) throw orderError;

        // Add items
        if (items && items.length > 0) {
            const orderItems = items.map(item => ({
                order_id: order.id,
                anode_id: item.anode_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                line_total: item.quantity * item.unit_price
            }));

            const { error: itemsError } = await supabase
                .from('anode_order_items')
                .insert(orderItems);

            if (itemsError) throw itemsError;

            // Update order totals
            const subtotal = orderItems.reduce((sum, item) => sum + item.line_total, 0);

            await supabase
                .from('anode_orders')
                .update({
                    subtotal,
                    total_amount: subtotal // Add tax/shipping later
                })
                .eq('id', order.id);
        }

        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Create auto-reorder
router.post('/orders/auto-reorder', async (req, res) => {
    try {
        // Get items needing reorder
        const { data: reorderItems, error: reorderError } = await supabase
            .from('anodes_needing_reorder')
            .select('*');

        if (reorderError) throw reorderError;

        if (reorderItems.length === 0) {
            return res.json({
                success: true,
                message: 'No items need reordering'
            });
        }

        // Create order
        const { data: order, error: orderError } = await supabase
            .from('anode_orders')
            .insert({
                order_type: 'reorder',
                status: 'draft',
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (orderError) throw orderError;

        // Add items
        const orderItems = reorderItems.map(item => ({
            order_id: order.id,
            anode_id: item.id,
            quantity: item.reorder_quantity,
            unit_price: item.list_price,
            line_total: item.reorder_quantity * item.list_price
        }));

        const { error: itemsError } = await supabase
            .from('anode_order_items')
            .insert(orderItems);

        if (itemsError) throw itemsError;

        // Update order totals
        const subtotal = orderItems.reduce((sum, item) => sum + item.line_total, 0);

        await supabase
            .from('anode_orders')
            .update({
                subtotal,
                total_amount: subtotal
            })
            .eq('id', order.id);

        res.json({
            success: true,
            data: {
                order_id: order.id,
                items_count: orderItems.length,
                estimated_total: subtotal
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Sync Endpoints
 */

// Trigger sync
router.post('/sync', async (req, res) => {
    try {
        const { type = 'full_catalog', triggered_by = 'api' } = req.body;

        // Create sync log entry
        const { data: syncLog, error: syncError } = await supabase
            .from('anode_sync_logs')
            .insert({
                sync_type: type,
                status: 'started',
                triggered_by,
                trigger_method: 'api',
                started_at: new Date().toISOString()
            })
            .select()
            .single();

        if (syncError) throw syncError;

        // Spawn Python scraper process
        const scriptPath = path.join(__dirname, '../scraper/boatzincs_scraper.py');
        const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';

        const scraperProcess = spawn(pythonCommand, [
            scriptPath,
            type === 'full_catalog' ? 'full' : 'prices'
        ], {
            cwd: path.join(__dirname, '../scraper')
        });

        // Don't wait for completion - return immediately
        scraperProcess.on('error', (error) => {
            console.error('Scraper process error:', error);
            // Update sync log with error
            supabase
                .from('anode_sync_logs')
                .update({
                    status: 'failed',
                    error_message: error.message,
                    completed_at: new Date().toISOString()
                })
                .eq('id', syncLog.id)
                .then();
        });

        res.json({
            success: true,
            sync_id: syncLog.id,
            message: `${type} sync started`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get sync status
router.get('/sync/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('anode_sync_logs')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;

        res.json({
            success: true,
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get sync history
router.get('/sync', async (req, res) => {
    try {
        const { limit = 20 } = req.query;

        const { data, error } = await supabase
            .from('anode_sync_logs')
            .select('*')
            .order('started_at', { ascending: false })
            .limit(limit);

        if (error) throw error;

        res.json({
            success: true,
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Report Endpoints
 */

// Price changes report
router.get('/reports/price-changes', async (req, res) => {
    try {
        const { days = 7 } = req.query;

        const { data, error } = await supabase
            .from('recent_price_changes')
            .select('*')
            .gte('recorded_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
            .order('recorded_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Inventory value report
router.get('/reports/inventory-value', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('anode_inventory')
            .select(`
                quantity_on_hand,
                anode:anode_id(
                    list_price,
                    category,
                    material
                )
            `);

        if (error) throw error;

        // Calculate totals
        let totalValue = 0;
        let totalItems = 0;
        const byCategory = {};
        const byMaterial = {};

        data.forEach(item => {
            if (item.anode) {
                const value = item.quantity_on_hand * item.anode.list_price;
                totalValue += value;
                totalItems += item.quantity_on_hand;

                // By category
                const category = item.anode.category || 'other';
                if (!byCategory[category]) {
                    byCategory[category] = { count: 0, value: 0 };
                }
                byCategory[category].count += item.quantity_on_hand;
                byCategory[category].value += value;

                // By material
                const material = item.anode.material || 'other';
                if (!byMaterial[material]) {
                    byMaterial[material] = { count: 0, value: 0 };
                }
                byMaterial[material].count += item.quantity_on_hand;
                byMaterial[material].value += value;
            }
        });

        res.json({
            success: true,
            summary: {
                total_items: totalItems,
                total_value: totalValue,
                by_category: byCategory,
                by_material: byMaterial
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;