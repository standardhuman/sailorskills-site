-- Migration: Add Amazon integration support
-- Date: 2025-09-26
-- Description: Adds Amazon URL field and order tracking for inventory items

-- Add Amazon URL field to inventory_items table
ALTER TABLE inventory_items
ADD COLUMN IF NOT EXISTS amazon_url TEXT,
ADD COLUMN IF NOT EXISTS amazon_asin VARCHAR(20),
ADD COLUMN IF NOT EXISTS last_amazon_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS last_amazon_check TIMESTAMP;

-- Add index for Amazon ASIN
CREATE INDEX IF NOT EXISTS idx_inventory_items_amazon_asin
ON inventory_items(amazon_asin)
WHERE amazon_asin IS NOT NULL;

-- Add Amazon order tracking fields to replenishment_list
ALTER TABLE replenishment_list
ADD COLUMN IF NOT EXISTS amazon_order_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS amazon_order_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS expected_delivery DATE;

-- Create Amazon orders table for tracking
CREATE TABLE IF NOT EXISTS amazon_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    item_id UUID REFERENCES inventory_items(id),
    amazon_order_id VARCHAR(50),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    quantity_ordered INTEGER NOT NULL,
    unit_price DECIMAL(10, 2),
    total_price DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'pending',
    tracking_number VARCHAR(100),
    expected_delivery DATE,
    actual_delivery DATE,
    notes TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for Amazon order tracking
CREATE INDEX IF NOT EXISTS idx_amazon_orders_status
ON amazon_orders(status);

CREATE INDEX IF NOT EXISTS idx_amazon_orders_item_id
ON amazon_orders(item_id);

-- Add trigger to update timestamps
CREATE OR REPLACE FUNCTION update_amazon_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER amazon_orders_updated_at
BEFORE UPDATE ON amazon_orders
FOR EACH ROW
EXECUTE FUNCTION update_amazon_orders_updated_at();

-- Add new transaction types for Amazon orders
INSERT INTO inventory_transaction_types (name, description, affects_stock)
VALUES
    ('pending_order', 'Order placed but not yet received', false),
    ('amazon_order', 'Order placed through Amazon', false)
ON CONFLICT (name) DO NOTHING;

-- Create view for pending Amazon orders
CREATE OR REPLACE VIEW pending_amazon_orders AS
SELECT
    ao.*,
    ii.name AS item_name,
    ii.sku,
    ii.amazon_url,
    ii.quantity_on_hand,
    ii.reorder_point
FROM amazon_orders ao
JOIN inventory_items ii ON ao.item_id = ii.id
WHERE ao.status IN ('pending', 'shipped')
ORDER BY ao.expected_delivery ASC;

-- Grant permissions
GRANT ALL ON amazon_orders TO authenticated;
GRANT ALL ON pending_amazon_orders TO authenticated;

-- Add RLS policies for Amazon orders
ALTER TABLE amazon_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all Amazon orders"
    ON amazon_orders FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can create Amazon orders"
    ON amazon_orders FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update Amazon orders"
    ON amazon_orders FOR UPDATE
    TO authenticated
    USING (true);

-- Function to process received Amazon orders
CREATE OR REPLACE FUNCTION process_amazon_order_received(
    p_amazon_order_id UUID,
    p_actual_quantity INTEGER,
    p_received_by VARCHAR(255)
)
RETURNS JSON AS $$
DECLARE
    v_item_id UUID;
    v_ordered_quantity INTEGER;
    v_result JSON;
BEGIN
    -- Get order details
    SELECT item_id, quantity_ordered
    INTO v_item_id, v_ordered_quantity
    FROM amazon_orders
    WHERE id = p_amazon_order_id;

    -- Update order status
    UPDATE amazon_orders
    SET
        status = 'received',
        actual_delivery = CURRENT_DATE
    WHERE id = p_amazon_order_id;

    -- Update inventory
    UPDATE inventory_items
    SET quantity_on_hand = quantity_on_hand + p_actual_quantity,
        quantity_available = quantity_available + p_actual_quantity
    WHERE id = v_item_id;

    -- Record transaction
    INSERT INTO inventory_transactions (
        transaction_type,
        item_id,
        quantity,
        reference_type,
        reference_id,
        performed_by
    ) VALUES (
        'purchase',
        v_item_id,
        p_actual_quantity,
        'amazon_order',
        p_amazon_order_id::TEXT,
        p_received_by
    );

    -- Return result
    SELECT json_build_object(
        'success', true,
        'message', 'Amazon order received successfully',
        'quantity_received', p_actual_quantity
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE amazon_orders IS 'Tracks orders placed through Amazon for inventory items';
COMMENT ON COLUMN inventory_items.amazon_url IS 'Direct link to the product on Amazon';
COMMENT ON COLUMN inventory_items.amazon_asin IS 'Amazon Standard Identification Number';