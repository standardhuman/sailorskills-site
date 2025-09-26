-- Migration: Order Management System
-- Date: 2025-09-26
-- Description: Creates tables for managing inventory orders

-- Create orders table
CREATE TABLE IF NOT EXISTS inventory_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE,
    order_type VARCHAR(50) DEFAULT 'manual', -- manual, reorder, emergency
    status VARCHAR(50) DEFAULT 'draft', -- draft, submitted, confirmed, shipped, delivered, cancelled
    supplier_id UUID,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expected_delivery DATE,
    actual_delivery DATE,
    subtotal DECIMAL(10, 2),
    tax_amount DECIMAL(10, 2),
    shipping_cost DECIMAL(10, 2),
    total_amount DECIMAL(10, 2),
    notes TEXT,
    po_number VARCHAR(100),
    tracking_number VARCHAR(100),
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create order items table
CREATE TABLE IF NOT EXISTS inventory_order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES inventory_orders(id) ON DELETE CASCADE,
    item_id UUID REFERENCES inventory_items(id),
    anode_id UUID REFERENCES anodes_catalog(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2),
    line_total DECIMAL(10, 2),
    received_quantity INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_item_reference CHECK (
        (item_id IS NOT NULL AND anode_id IS NULL) OR
        (item_id IS NULL AND anode_id IS NOT NULL)
    )
);

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    website VARCHAR(255),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    payment_terms VARCHAR(100),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add supplier references
ALTER TABLE inventory_orders
ADD CONSTRAINT fk_order_supplier
FOREIGN KEY (supplier_id) REFERENCES suppliers(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_status ON inventory_orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON inventory_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_supplier ON inventory_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON inventory_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_item ON inventory_order_items(item_id);
CREATE INDEX IF NOT EXISTS idx_order_items_anode ON inventory_order_items(anode_id);

-- Create order status enum type (if not exists)
DO $$ BEGIN
    CREATE TYPE order_status AS ENUM (
        'draft', 'submitted', 'confirmed', 'shipped', 'delivered', 'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create order type enum
DO $$ BEGIN
    CREATE TYPE order_type AS ENUM (
        'manual', 'reorder', 'emergency', 'amazon'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create view for order summary
CREATE OR REPLACE VIEW order_summary AS
SELECT
    o.id,
    o.order_number,
    o.order_type,
    o.status,
    o.order_date,
    o.expected_delivery,
    o.total_amount,
    s.name as supplier_name,
    COUNT(oi.id) as item_count,
    SUM(oi.quantity) as total_quantity,
    o.created_by,
    o.created_at
FROM inventory_orders o
LEFT JOIN suppliers s ON o.supplier_id = s.id
LEFT JOIN inventory_order_items oi ON o.id = oi.order_id
GROUP BY o.id, s.name
ORDER BY o.order_date DESC;

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL THEN
        NEW.order_number := 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' ||
                           LPAD(NEXTVAL('order_number_seq')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1;

-- Add trigger for order number generation
CREATE TRIGGER generate_order_number_trigger
BEFORE INSERT ON inventory_orders
FOR EACH ROW
EXECUTE FUNCTION generate_order_number();

-- Add trigger to update timestamps
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
BEFORE UPDATE ON inventory_orders
FOR EACH ROW
EXECUTE FUNCTION update_orders_updated_at();

-- Function to receive order items
CREATE OR REPLACE FUNCTION receive_order_items(
    p_order_id UUID,
    p_item_id UUID,
    p_received_quantity INTEGER
)
RETURNS JSON AS $$
DECLARE
    v_item_type TEXT;
    v_anode_id UUID;
    v_result JSON;
BEGIN
    -- Get item details from order
    SELECT
        CASE
            WHEN item_id IS NOT NULL THEN 'item'
            WHEN anode_id IS NOT NULL THEN 'anode'
        END,
        anode_id
    INTO v_item_type, v_anode_id
    FROM inventory_order_items
    WHERE order_id = p_order_id
    AND (item_id = p_item_id OR anode_id = p_item_id)
    LIMIT 1;

    -- Update received quantity
    UPDATE inventory_order_items
    SET received_quantity = received_quantity + p_received_quantity
    WHERE order_id = p_order_id
    AND (item_id = p_item_id OR anode_id = p_item_id);

    -- Update inventory based on type
    IF v_item_type = 'item' THEN
        UPDATE inventory_items
        SET quantity_on_hand = quantity_on_hand + p_received_quantity,
            quantity_available = quantity_available + p_received_quantity
        WHERE id = p_item_id;
    ELSIF v_item_type = 'anode' THEN
        UPDATE anode_inventory
        SET quantity_on_hand = quantity_on_hand + p_received_quantity,
            quantity_available = quantity_available + p_received_quantity
        WHERE anode_id = v_anode_id;
    END IF;

    -- Record transaction
    INSERT INTO inventory_transactions (
        transaction_type,
        item_id,
        anode_id,
        quantity,
        reference_type,
        reference_id
    ) VALUES (
        'purchase',
        CASE WHEN v_item_type = 'item' THEN p_item_id ELSE NULL END,
        CASE WHEN v_item_type = 'anode' THEN v_anode_id ELSE NULL END,
        p_received_quantity,
        'order',
        p_order_id::TEXT
    );

    SELECT json_build_object(
        'success', true,
        'message', 'Items received successfully',
        'quantity_received', p_received_quantity
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT ALL ON inventory_orders TO authenticated;
GRANT ALL ON inventory_order_items TO authenticated;
GRANT ALL ON suppliers TO authenticated;
GRANT ALL ON order_summary TO authenticated;
GRANT USAGE ON SEQUENCE order_number_seq TO authenticated;

-- Add RLS policies
ALTER TABLE inventory_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- Policies for orders
CREATE POLICY "Users can view all orders"
    ON inventory_orders FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can create orders"
    ON inventory_orders FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update orders"
    ON inventory_orders FOR UPDATE
    TO authenticated
    USING (true);

-- Policies for order items
CREATE POLICY "Users can view all order items"
    ON inventory_order_items FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can manage order items"
    ON inventory_order_items FOR ALL
    TO authenticated
    USING (true);

-- Policies for suppliers
CREATE POLICY "Users can view suppliers"
    ON suppliers FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can manage suppliers"
    ON suppliers FOR ALL
    TO authenticated
    USING (true);

-- Add some default suppliers
INSERT INTO suppliers (name, email, website, is_active) VALUES
    ('Boatzincs', 'orders@boatzincs.com', 'https://www.boatzincs.com', true),
    ('Amazon', 'orders@amazon.com', 'https://www.amazon.com', true),
    ('Marine Supply Co', 'sales@marinesupply.com', NULL, true)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE inventory_orders IS 'Manages purchase orders for inventory items';
COMMENT ON TABLE inventory_order_items IS 'Line items for inventory orders';
COMMENT ON TABLE suppliers IS 'Supplier information for inventory ordering';