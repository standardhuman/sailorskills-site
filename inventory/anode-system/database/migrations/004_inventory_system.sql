-- Enhanced Inventory Management System
-- Extends the anode system to handle all types of inventory items

-- Item categories for organizing inventory
CREATE TABLE IF NOT EXISTS item_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_category_id UUID REFERENCES item_categories(id),
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- General inventory items (tools, equipment, supplies)
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sku TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES item_categories(id),

  -- Item details
  manufacturer TEXT,
  model_number TEXT,
  barcode TEXT,

  -- Quantities
  quantity_on_hand INTEGER DEFAULT 0,
  quantity_allocated INTEGER DEFAULT 0,
  quantity_available INTEGER GENERATED ALWAYS AS (quantity_on_hand - quantity_allocated) STORED,

  -- Stock levels
  minimum_stock_level INTEGER DEFAULT 0,
  reorder_point INTEGER DEFAULT 5,
  reorder_quantity INTEGER DEFAULT 10,
  maximum_stock_level INTEGER,

  -- Location
  primary_location TEXT,
  bin_number TEXT,

  -- Costs
  unit_cost DECIMAL(10, 2),
  average_cost DECIMAL(10, 2),
  last_purchase_price DECIMAL(10, 2),

  -- Tracking
  is_consumable BOOLEAN DEFAULT FALSE,
  is_trackable BOOLEAN DEFAULT TRUE,
  requires_serial_number BOOLEAN DEFAULT FALSE,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,

  -- Dates
  last_counted_date DATE,
  last_ordered_date DATE,
  last_received_date DATE,
  last_used_date DATE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suppliers/Vendors
CREATE TABLE IF NOT EXISTS inventory_suppliers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,

  -- Address
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'USA',

  -- Business details
  account_number TEXT,
  payment_terms TEXT,
  tax_id TEXT,

  -- Defaults
  default_shipping_method TEXT,
  typical_lead_time_days INTEGER,
  minimum_order_amount DECIMAL(10, 2),

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_preferred BOOLEAN DEFAULT FALSE,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link items to suppliers
CREATE TABLE IF NOT EXISTS item_suppliers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES inventory_suppliers(id) ON DELETE CASCADE,
  supplier_part_number TEXT,
  cost DECIMAL(10, 2),
  lead_time_days INTEGER,
  minimum_order_quantity INTEGER DEFAULT 1,
  is_primary BOOLEAN DEFAULT FALSE,
  last_ordered_date DATE,
  notes TEXT,
  UNIQUE(item_id, supplier_id)
);

-- Inventory transactions (all movements)
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  transaction_type TEXT CHECK (transaction_type IN (
    'purchase', 'sale', 'adjustment', 'count', 'damage',
    'return', 'transfer', 'customer_charge', 'service_usage'
  )),

  -- Item reference (either anode or general item)
  anode_id UUID REFERENCES anodes_catalog(id),
  item_id UUID REFERENCES inventory_items(id),

  -- Ensure at least one item is referenced
  CONSTRAINT check_item_reference CHECK (
    (anode_id IS NOT NULL AND item_id IS NULL) OR
    (anode_id IS NULL AND item_id IS NOT NULL)
  ),

  -- Transaction details
  quantity INTEGER NOT NULL,
  unit_cost DECIMAL(10, 2),
  total_cost DECIMAL(10, 2),

  -- Before and after quantities
  quantity_before INTEGER,
  quantity_after INTEGER,

  -- Reference information
  reference_type TEXT, -- 'customer', 'supplier_order', 'adjustment', etc.
  reference_id TEXT, -- Could be customer ID, PO number, etc.
  reference_notes TEXT,

  -- Location
  from_location TEXT,
  to_location TEXT,

  -- User tracking
  performed_by TEXT,
  approved_by TEXT,

  -- Status
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  notes TEXT,

  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  po_number TEXT UNIQUE NOT NULL,
  supplier_id UUID REFERENCES inventory_suppliers(id),

  -- Status
  status TEXT CHECK (status IN (
    'draft', 'pending', 'submitted', 'approved',
    'ordered', 'partial', 'received', 'cancelled'
  )) DEFAULT 'draft',

  -- Dates
  order_date DATE,
  expected_date DATE,
  received_date DATE,

  -- Amounts
  subtotal DECIMAL(10, 2),
  tax_amount DECIMAL(10, 2),
  shipping_amount DECIMAL(10, 2),
  total_amount DECIMAL(10, 2),

  -- Reference
  supplier_order_number TEXT,
  tracking_number TEXT,

  -- Notes
  internal_notes TEXT,
  supplier_notes TEXT,

  created_by TEXT,
  approved_by TEXT,
  received_by TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase order items
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  po_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,

  -- Item reference (either anode or general item)
  anode_id UUID REFERENCES anodes_catalog(id),
  item_id UUID REFERENCES inventory_items(id),

  quantity_ordered INTEGER NOT NULL,
  quantity_received INTEGER DEFAULT 0,
  quantity_backordered INTEGER DEFAULT 0,

  unit_cost DECIMAL(10, 2) NOT NULL,
  line_total DECIMAL(10, 2) NOT NULL,

  expected_date DATE,
  notes TEXT,

  CONSTRAINT check_po_item_reference CHECK (
    (anode_id IS NOT NULL AND item_id IS NULL) OR
    (anode_id IS NULL AND item_id IS NOT NULL)
  )
);

-- Replenishment list (items to reorder)
CREATE TABLE IF NOT EXISTS replenishment_list (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Item reference
  anode_id UUID REFERENCES anodes_catalog(id),
  item_id UUID REFERENCES inventory_items(id),

  quantity_needed INTEGER NOT NULL,
  quantity_to_order INTEGER,

  -- Priority
  priority TEXT CHECK (priority IN ('critical', 'high', 'medium', 'low')) DEFAULT 'medium',

  -- Source of request
  source TEXT CHECK (source IN (
    'manual', 'low_stock', 'customer_charge', 'service_scheduled', 'auto_reorder'
  )),

  -- Reference
  reference_type TEXT,
  reference_id TEXT,

  -- Status
  status TEXT CHECK (status IN ('pending', 'ordered', 'cancelled', 'completed')) DEFAULT 'pending',
  po_id UUID REFERENCES purchase_orders(id),

  notes TEXT,
  requested_by TEXT,
  requested_date DATE DEFAULT CURRENT_DATE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT check_replenishment_item CHECK (
    (anode_id IS NOT NULL AND item_id IS NULL) OR
    (anode_id IS NULL AND item_id IS NOT NULL)
  )
);

-- Future boat management tables (structure only, not used in Phase 1)
CREATE TABLE IF NOT EXISTS boats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,

  boat_name TEXT,
  boat_make TEXT,
  boat_model TEXT,
  boat_year INTEGER,
  boat_length_ft INTEGER,
  hull_material TEXT,

  marina_location TEXT,
  slip_number TEXT,

  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Boat anode associations (for future use)
CREATE TABLE IF NOT EXISTS boat_anode_types (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  boat_id UUID REFERENCES boats(id) ON DELETE CASCADE,
  anode_id UUID REFERENCES anodes_catalog(id),
  quantity_required INTEGER DEFAULT 1,
  replacement_interval_months INTEGER DEFAULT 12,
  last_replaced_date DATE,
  notes TEXT
);

-- Anode-tool requirements (for future use)
CREATE TABLE IF NOT EXISTS anode_tool_requirements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  anode_id UUID REFERENCES anodes_catalog(id),
  tool_id UUID REFERENCES inventory_items(id),
  is_required BOOLEAN DEFAULT TRUE,
  notes TEXT
);

-- Insert default item categories
INSERT INTO item_categories (name, description, sort_order) VALUES
  ('Anodes', 'Zinc, aluminum, and magnesium anodes', 1),
  ('Tools', 'Hand tools and power tools', 2),
  ('Safety Equipment', 'Safety gear and protective equipment', 3),
  ('Fasteners', 'Bolts, screws, and mounting hardware', 4),
  ('Cleaning Supplies', 'Cleaning products and materials', 5),
  ('Consumables', 'Single-use items and supplies', 6),
  ('Equipment', 'Diving and service equipment', 7),
  ('Parts', 'Replacement parts and components', 8)
ON CONFLICT (name) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_quantity_available ON inventory_items(quantity_available);
CREATE INDEX IF NOT EXISTS idx_inventory_items_minimum_stock ON inventory_items(minimum_stock_level);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_anode ON inventory_transactions(anode_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item ON inventory_transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_date ON inventory_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type ON inventory_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_replenishment_list_status ON replenishment_list(status);
CREATE INDEX IF NOT EXISTS idx_boats_customer_name ON boats(customer_name);

-- Update triggers for updated_at columns
CREATE TRIGGER update_item_categories_updated_at BEFORE UPDATE ON item_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_suppliers_updated_at BEFORE UPDATE ON inventory_suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_replenishment_list_updated_at BEFORE UPDATE ON replenishment_list
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_boats_updated_at BEFORE UPDATE ON boats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- View for items needing reorder (combines anodes and general items)
CREATE OR REPLACE VIEW all_items_needing_reorder AS
-- Anodes needing reorder
SELECT
    'anode' as item_type,
    ac.id as item_id,
    ac.name,
    ac.sku,
    ai.quantity_available,
    ai.reorder_point,
    ai.reorder_quantity,
    ac.list_price as unit_cost,
    (ai.reorder_quantity * ac.list_price) as estimated_cost
FROM anodes_catalog ac
JOIN anode_inventory ai ON ac.id = ai.anode_id
WHERE ai.quantity_available <= ai.reorder_point
    AND ac.is_active = TRUE
UNION ALL
-- General items needing reorder
SELECT
    'item' as item_type,
    ii.id as item_id,
    ii.name,
    ii.sku,
    ii.quantity_available,
    ii.reorder_point,
    ii.reorder_quantity,
    ii.unit_cost,
    (ii.reorder_quantity * COALESCE(ii.unit_cost, 0)) as estimated_cost
FROM inventory_items ii
WHERE ii.quantity_available <= ii.reorder_point
    AND ii.is_active = TRUE
ORDER BY quantity_available ASC;

-- View for inventory value report
CREATE OR REPLACE VIEW inventory_value_report AS
-- Anode inventory value
SELECT
    'anode' as item_type,
    ac.name,
    ac.sku,
    ai.quantity_on_hand,
    ac.list_price as unit_cost,
    (ai.quantity_on_hand * ac.list_price) as total_value
FROM anodes_catalog ac
JOIN anode_inventory ai ON ac.id = ai.anode_id
WHERE ai.quantity_on_hand > 0
UNION ALL
-- General inventory value
SELECT
    'item' as item_type,
    ii.name,
    ii.sku,
    ii.quantity_on_hand,
    COALESCE(ii.average_cost, ii.unit_cost, 0) as unit_cost,
    (ii.quantity_on_hand * COALESCE(ii.average_cost, ii.unit_cost, 0)) as total_value
FROM inventory_items ii
WHERE ii.quantity_on_hand > 0
ORDER BY total_value DESC;

-- Function to add item to replenishment list
CREATE OR REPLACE FUNCTION add_to_replenishment(
    p_item_type TEXT,
    p_item_id UUID,
    p_quantity INTEGER,
    p_source TEXT DEFAULT 'manual',
    p_reference_type TEXT DEFAULT NULL,
    p_reference_id TEXT DEFAULT NULL,
    p_requested_by TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_replenishment_id UUID;
BEGIN
    IF p_item_type = 'anode' THEN
        INSERT INTO replenishment_list (
            anode_id, quantity_needed, source,
            reference_type, reference_id, requested_by
        ) VALUES (
            p_item_id, p_quantity, p_source,
            p_reference_type, p_reference_id, p_requested_by
        ) RETURNING id INTO v_replenishment_id;
    ELSE
        INSERT INTO replenishment_list (
            item_id, quantity_needed, source,
            reference_type, reference_id, requested_by
        ) VALUES (
            p_item_id, p_quantity, p_source,
            p_reference_type, p_reference_id, p_requested_by
        ) RETURNING id INTO v_replenishment_id;
    END IF;

    RETURN v_replenishment_id;
END;
$$ LANGUAGE plpgsql;

-- Function to process customer charge (deduct from inventory and add to replenishment)
CREATE OR REPLACE FUNCTION process_customer_charge(
    p_anode_id UUID,
    p_quantity INTEGER,
    p_customer_ref TEXT,
    p_performed_by TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    v_current_quantity INTEGER;
    v_reorder_point INTEGER;
BEGIN
    -- Get current inventory levels
    SELECT quantity_on_hand, reorder_point
    INTO v_current_quantity, v_reorder_point
    FROM anode_inventory
    WHERE anode_id = p_anode_id;

    -- Record the transaction
    INSERT INTO inventory_transactions (
        anode_id, transaction_type, quantity,
        quantity_before, quantity_after,
        reference_type, reference_id,
        performed_by
    ) VALUES (
        p_anode_id, 'customer_charge', -p_quantity,
        v_current_quantity, v_current_quantity - p_quantity,
        'customer', p_customer_ref,
        p_performed_by
    );

    -- Update inventory quantity
    UPDATE anode_inventory
    SET quantity_on_hand = quantity_on_hand - p_quantity
    WHERE anode_id = p_anode_id;

    -- Check if we need to add to replenishment
    IF (v_current_quantity - p_quantity) <= v_reorder_point THEN
        PERFORM add_to_replenishment(
            'anode', p_anode_id,
            v_reorder_point - (v_current_quantity - p_quantity),
            'customer_charge', 'customer', p_customer_ref, p_performed_by
        );
    END IF;
END;
$$ LANGUAGE plpgsql;