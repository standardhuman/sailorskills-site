// Inventory Management API Endpoints
// Server-side API for inventory operations

import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY // Use service key for server-side operations
);

// Middleware for error handling
const asyncHandler = fn => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// Get all inventory items (anodes + general items)
router.get('/inventory', asyncHandler(async (req, res) => {
    const { category, lowStock, search } = req.query;

    // Get anodes with inventory
    const { data: anodes, error: anodeError } = await supabase
        .from('anodes_catalog')
        .select(`
            *,
            anode_inventory!inner(*)
        `)
        .eq('is_active', true);

    if (anodeError) throw anodeError;

    // Get general inventory items
    const { data: items, error: itemError } = await supabase
        .from('inventory_items')
        .select(`
            *,
            item_categories(name)
        `)
        .eq('is_active', true);

    if (itemError) throw itemError;

    // Combine and format
    const inventory = [
        ...anodes.map(formatAnodeInventory),
        ...items.map(formatGeneralInventory)
    ];

    // Apply filters
    let filtered = inventory;
    if (category) {
        filtered = filtered.filter(i => i.category === category);
    }
    if (lowStock === 'true') {
        filtered = filtered.filter(i => i.available <= i.reorderPoint);
    }
    if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(i =>
            i.name.toLowerCase().includes(searchLower) ||
            i.sku?.toLowerCase().includes(searchLower)
        );
    }

    res.json(filtered);
}));

// Get inventory stats
router.get('/inventory/stats', asyncHandler(async (req, res) => {
    // Get critical stock items
    const { data: critical } = await supabase
        .from('all_items_needing_reorder')
        .select('*')
        .lt('quantity_available', 'minimum_stock_level');

    // Get low stock items
    const { data: lowStock } = await supabase
        .from('all_items_needing_reorder')
        .select('*');

    // Get total inventory value
    const { data: value } = await supabase
        .from('inventory_value_report')
        .select('total_value');

    const totalValue = value?.reduce((sum, item) => sum + item.total_value, 0) || 0;

    res.json({
        criticalCount: critical?.length || 0,
        lowStockCount: lowStock?.length || 0,
        totalValue: totalValue,
        lastUpdated: new Date()
    });
}));

// Add new inventory item
router.post('/inventory/items', asyncHandler(async (req, res) => {
    const {
        type,
        anodeId,
        sku,
        name,
        categoryId,
        description,
        initialQuantity,
        unitCost,
        minStock,
        reorderPoint,
        reorderQty,
        location,
        binNumber,
        notes
    } = req.body;

    if (type === 'anode') {
        // Add or update anode inventory
        const { data, error } = await supabase
            .from('anode_inventory')
            .upsert({
                anode_id: anodeId,
                quantity_on_hand: initialQuantity || 0,
                reorder_point: reorderPoint || 5,
                reorder_quantity: reorderQty || 10,
                primary_location: location,
                bin_number: binNumber,
                average_cost: unitCost
            });

        if (error) throw error;
        res.json({ success: true, data });
    } else {
        // Add general inventory item
        const { data, error } = await supabase
            .from('inventory_items')
            .insert({
                sku,
                name,
                category_id: categoryId,
                description,
                quantity_on_hand: initialQuantity || 0,
                unit_cost: unitCost,
                minimum_stock_level: minStock || 0,
                reorder_point: reorderPoint || 5,
                reorder_quantity: reorderQty || 10,
                primary_location: location,
                bin_number: binNumber,
                notes
            });

        if (error) throw error;
        res.json({ success: true, data });
    }
}));

// Record stock transaction
router.post('/inventory/transactions', asyncHandler(async (req, res) => {
    const {
        type,
        itemType,
        itemId,
        quantity,
        reference,
        notes,
        performedBy
    } = req.body;

    // Start a transaction
    const { data: transaction, error: txError } = await supabase
        .from('inventory_transactions')
        .insert({
            transaction_type: type,
            [itemType === 'anode' ? 'anode_id' : 'item_id']: itemId,
            quantity: quantity,
            reference_type: type,
            reference_id: reference,
            notes: notes,
            performed_by: performedBy || 'api_user'
        })
        .select()
        .single();

    if (txError) throw txError;

    // Update inventory quantity
    const table = itemType === 'anode' ? 'anode_inventory' : 'inventory_items';
    const idField = itemType === 'anode' ? 'anode_id' : 'id';

    const { error: updateError } = await supabase.rpc('update_inventory_quantity', {
        p_table: table,
        p_id_field: idField,
        p_id: itemId,
        p_quantity_change: quantity
    });

    if (updateError) throw updateError;

    res.json({ success: true, transaction });
}));

// Process customer charge
router.post('/inventory/charge', asyncHandler(async (req, res) => {
    const { customer, items, addToReplenishment, notes } = req.body;

    const results = [];

    for (const item of items) {
        const { data, error } = await supabase.rpc('process_customer_charge', {
            p_anode_id: item.anodeId,
            p_quantity: item.quantity,
            p_customer_ref: customer,
            p_performed_by: req.user?.id || 'api_user'
        });

        if (error) {
            results.push({ anodeId: item.anodeId, success: false, error: error.message });
        } else {
            results.push({ anodeId: item.anodeId, success: true });
        }
    }

    res.json({
        success: results.every(r => r.success),
        results,
        message: `Charged ${results.filter(r => r.success).length} of ${items.length} items to ${customer}`
    });
}));

// Get replenishment list
router.get('/replenishment', asyncHandler(async (req, res) => {
    const { status = 'pending' } = req.query;

    const { data, error } = await supabase
        .from('replenishment_list')
        .select(`
            *,
            anodes_catalog(name, sku, list_price),
            inventory_items(name, sku, unit_cost)
        `)
        .eq('status', status)
        .order('priority', { ascending: false });

    if (error) throw error;

    res.json(data);
}));

// Add to replenishment list
router.post('/replenishment', asyncHandler(async (req, res) => {
    const { itemType, itemId, quantity, priority, notes } = req.body;

    const { data, error } = await supabase
        .from('replenishment_list')
        .insert({
            [itemType === 'anode' ? 'anode_id' : 'item_id']: itemId,
            quantity_needed: quantity,
            priority: priority || 'medium',
            source: 'manual',
            requested_by: req.user?.id || 'api_user',
            notes
        });

    if (error) throw error;

    res.json({ success: true, data });
}));

// Update replenishment item
router.put('/replenishment/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { quantityToOrder, priority, status } = req.body;

    const updates = {};
    if (quantityToOrder !== undefined) updates.quantity_to_order = quantityToOrder;
    if (priority) updates.priority = priority;
    if (status) updates.status = status;

    const { data, error } = await supabase
        .from('replenishment_list')
        .update(updates)
        .eq('id', id);

    if (error) throw error;

    res.json({ success: true, data });
}));

// Delete from replenishment list
router.delete('/replenishment/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

    const { error } = await supabase
        .from('replenishment_list')
        .update({ status: 'cancelled' })
        .eq('id', id);

    if (error) throw error;

    res.json({ success: true });
}));

// Create purchase order from replenishment items
router.post('/purchase-orders', asyncHandler(async (req, res) => {
    const { supplierId, items, notes } = req.body;

    // Create PO
    const poNumber = `PO-${Date.now()}`;
    const { data: po, error: poError } = await supabase
        .from('purchase_orders')
        .insert({
            po_number: poNumber,
            supplier_id: supplierId,
            status: 'draft',
            internal_notes: notes,
            created_by: req.user?.id || 'api_user'
        })
        .select()
        .single();

    if (poError) throw poError;

    // Add items to PO
    const poItems = items.map(item => ({
        po_id: po.id,
        [item.type === 'anode' ? 'anode_id' : 'item_id']: item.id,
        quantity_ordered: item.quantity,
        unit_cost: item.unitCost,
        line_total: item.quantity * item.unitCost
    }));

    const { error: itemError } = await supabase
        .from('purchase_order_items')
        .insert(poItems);

    if (itemError) throw itemError;

    // Update replenishment items status
    const replenishmentIds = items.map(i => i.replenishmentId).filter(Boolean);
    if (replenishmentIds.length > 0) {
        await supabase
            .from('replenishment_list')
            .update({ status: 'ordered', po_id: po.id })
            .in('id', replenishmentIds);
    }

    res.json({
        success: true,
        poNumber,
        poId: po.id,
        itemCount: items.length
    });
}));

// Get suppliers
router.get('/suppliers', asyncHandler(async (req, res) => {
    const { data, error } = await supabase
        .from('inventory_suppliers')
        .select('*')
        .eq('is_active', true)
        .order('name');

    if (error) throw error;

    res.json(data);
}));

// Helper functions
function formatAnodeInventory(anode) {
    return {
        type: 'anode',
        id: anode.id,
        sku: anode.sku || anode.boatzincs_id,
        name: anode.name,
        category: 'Anodes',
        subcategory: anode.category,
        onHand: anode.anode_inventory.quantity_on_hand,
        allocated: anode.anode_inventory.quantity_allocated,
        available: anode.anode_inventory.quantity_available,
        minStock: anode.anode_inventory.reorder_point,
        reorderPoint: anode.anode_inventory.reorder_point,
        reorderQty: anode.anode_inventory.reorder_quantity,
        location: anode.anode_inventory.primary_location,
        unitCost: anode.list_price,
        lastCounted: anode.anode_inventory.last_counted
    };
}

function formatGeneralInventory(item) {
    return {
        type: 'item',
        id: item.id,
        sku: item.sku,
        name: item.name,
        category: item.item_categories?.name || 'General',
        onHand: item.quantity_on_hand,
        allocated: item.quantity_allocated,
        available: item.quantity_available,
        minStock: item.minimum_stock_level,
        reorderPoint: item.reorder_point,
        reorderQty: item.reorder_quantity,
        location: item.primary_location,
        unitCost: item.unit_cost,
        lastCounted: item.last_counted_date
    };
}

// Error handling middleware
router.use((error, req, res, next) => {
    console.error('API Error:', error);
    res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
    });
});

export default router;