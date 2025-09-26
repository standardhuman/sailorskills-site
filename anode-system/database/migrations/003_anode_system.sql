-- Enhanced Anode System Database Schema
-- Standalone system with full product catalog and ordering capabilities

-- Drop existing tables if we need a clean slate (comment out in production)
-- DROP TABLE IF EXISTS anode_sync_logs CASCADE;
-- DROP TABLE IF EXISTS anode_order_items CASCADE;
-- DROP TABLE IF EXISTS anode_orders CASCADE;
-- DROP TABLE IF EXISTS anode_inventory CASCADE;
-- DROP TABLE IF EXISTS anode_price_history CASCADE;
-- DROP TABLE IF EXISTS anodes_catalog CASCADE;

-- Complete product catalog from boatzincs.com
CREATE TABLE IF NOT EXISTS anodes_catalog (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  boatzincs_id TEXT UNIQUE NOT NULL,
  sku TEXT,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  subcategory TEXT,
  material TEXT CHECK (material IN ('zinc', 'aluminum', 'magnesium', 'other')),

  -- Pricing
  list_price DECIMAL(10, 2) NOT NULL,
  sale_price DECIMAL(10, 2),
  is_on_sale BOOLEAN DEFAULT FALSE,

  -- Product details
  dimensions TEXT,
  weight TEXT,
  manufacturer TEXT,
  part_number TEXT,

  -- Images and URLs
  image_url TEXT,
  thumbnail_url TEXT,
  product_url TEXT NOT NULL,

  -- Stock and availability
  stock_status TEXT CHECK (stock_status IN ('in_stock', 'out_of_stock', 'limited', 'discontinued', 'unknown')),
  stock_quantity INTEGER,

  -- Metadata
  is_active BOOLEAN DEFAULT TRUE,
  last_scraped TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Price history tracking
CREATE TABLE IF NOT EXISTS anode_price_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  anode_id UUID REFERENCES anodes_catalog(id) ON DELETE CASCADE,
  list_price DECIMAL(10, 2) NOT NULL,
  sale_price DECIMAL(10, 2),
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  price_change DECIMAL(10, 2), -- Difference from previous price
  percent_change DECIMAL(5, 2) -- Percentage change
);

-- Inventory management
CREATE TABLE IF NOT EXISTS anode_inventory (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  anode_id UUID REFERENCES anodes_catalog(id) ON DELETE CASCADE UNIQUE,

  -- Current inventory
  quantity_on_hand INTEGER DEFAULT 0,
  quantity_allocated INTEGER DEFAULT 0, -- Reserved for upcoming jobs
  quantity_available INTEGER GENERATED ALWAYS AS (quantity_on_hand - quantity_allocated) STORED,

  -- Reorder settings
  reorder_point INTEGER DEFAULT 5,
  reorder_quantity INTEGER DEFAULT 10,
  preferred_stock_level INTEGER DEFAULT 20,

  -- Location tracking
  primary_location TEXT,
  bin_number TEXT,

  -- Costs
  average_cost DECIMAL(10, 2),
  last_purchase_price DECIMAL(10, 2),

  -- Dates
  last_counted DATE,
  last_ordered DATE,
  last_received DATE,

  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order tracking
CREATE TABLE IF NOT EXISTS anode_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_number TEXT UNIQUE,
  boatzincs_order_id TEXT,

  -- Order details
  order_type TEXT CHECK (order_type IN ('manual', 'automated', 'reorder', 'emergency')),
  status TEXT CHECK (status IN ('draft', 'submitted', 'confirmed', 'shipped', 'delivered', 'cancelled')),

  -- Financials
  subtotal DECIMAL(10, 2),
  tax_amount DECIMAL(10, 2),
  shipping_amount DECIMAL(10, 2),
  total_amount DECIMAL(10, 2),

  -- Dates
  created_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,

  -- Tracking
  tracking_number TEXT,
  carrier TEXT,

  notes TEXT
);

-- Order line items
CREATE TABLE IF NOT EXISTS anode_order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES anode_orders(id) ON DELETE CASCADE,
  anode_id UUID REFERENCES anodes_catalog(id),

  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  line_total DECIMAL(10, 2) NOT NULL,

  -- Status tracking
  quantity_received INTEGER DEFAULT 0,
  quantity_backordered INTEGER DEFAULT 0,

  notes TEXT
);

-- Sync and scraping logs
CREATE TABLE IF NOT EXISTS anode_sync_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sync_type TEXT CHECK (sync_type IN ('full_catalog', 'price_update', 'stock_check', 'order_status', 'manual')),
  status TEXT CHECK (status IN ('started', 'in_progress', 'completed', 'failed', 'partial')),

  -- Statistics
  items_processed INTEGER DEFAULT 0,
  items_added INTEGER DEFAULT 0,
  items_updated INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,

  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,

  -- Error tracking
  error_message TEXT,
  error_details JSONB,

  -- Trigger info
  triggered_by TEXT, -- username or 'system'
  trigger_method TEXT CHECK (trigger_method IN ('manual', 'scheduled', 'api', 'cli'))
);

-- Boatzincs account credentials (encrypted)
CREATE TABLE IF NOT EXISTS boatzincs_credentials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  username TEXT,
  encrypted_password TEXT, -- Will be encrypted before storage
  session_cookie TEXT,
  cookie_expiry TIMESTAMPTZ,
  last_login TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_anodes_catalog_boatzincs_id ON anodes_catalog(boatzincs_id);
CREATE INDEX IF NOT EXISTS idx_anodes_catalog_sku ON anodes_catalog(sku);
CREATE INDEX IF NOT EXISTS idx_anodes_catalog_category ON anodes_catalog(category);
CREATE INDEX IF NOT EXISTS idx_anodes_catalog_material ON anodes_catalog(material);
CREATE INDEX IF NOT EXISTS idx_anodes_catalog_stock_status ON anodes_catalog(stock_status);
CREATE INDEX IF NOT EXISTS idx_anode_price_history_anode_id ON anode_price_history(anode_id);
CREATE INDEX IF NOT EXISTS idx_anode_price_history_recorded_at ON anode_price_history(recorded_at);
CREATE INDEX IF NOT EXISTS idx_anode_inventory_quantity_available ON anode_inventory(quantity_available);
CREATE INDEX IF NOT EXISTS idx_anode_orders_status ON anode_orders(status);
CREATE INDEX IF NOT EXISTS idx_anode_orders_created_at ON anode_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_anode_sync_logs_sync_type ON anode_sync_logs(sync_type);
CREATE INDEX IF NOT EXISTS idx_anode_sync_logs_started_at ON anode_sync_logs(started_at);

-- Create update triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_anodes_catalog_updated_at BEFORE UPDATE ON anodes_catalog
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_anode_inventory_updated_at BEFORE UPDATE ON anode_inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_boatzincs_credentials_updated_at BEFORE UPDATE ON boatzincs_credentials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate price changes
CREATE OR REPLACE FUNCTION calculate_price_change()
RETURNS TRIGGER AS $$
DECLARE
    prev_price DECIMAL(10, 2);
BEGIN
    -- Get the previous price
    SELECT list_price INTO prev_price
    FROM anode_price_history
    WHERE anode_id = NEW.anode_id
    ORDER BY recorded_at DESC
    LIMIT 1;

    IF prev_price IS NOT NULL THEN
        NEW.price_change := NEW.list_price - prev_price;
        IF prev_price > 0 THEN
            NEW.percent_change := ((NEW.list_price - prev_price) / prev_price) * 100;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_anode_price_change BEFORE INSERT ON anode_price_history
    FOR EACH ROW EXECUTE FUNCTION calculate_price_change();

-- View for anodes that need reordering
CREATE OR REPLACE VIEW anodes_needing_reorder AS
SELECT
    ac.id,
    ac.boatzincs_id,
    ac.name,
    ai.quantity_available,
    ai.reorder_point,
    ai.reorder_quantity,
    ac.list_price,
    (ai.reorder_quantity * ac.list_price) as estimated_cost
FROM anodes_catalog ac
JOIN anode_inventory ai ON ac.id = ai.anode_id
WHERE ai.quantity_available <= ai.reorder_point
    AND ac.is_active = TRUE
    AND ac.stock_status = 'in_stock'
ORDER BY ai.quantity_available ASC;

-- View for price change alerts
CREATE OR REPLACE VIEW recent_price_changes AS
SELECT
    ac.name,
    ac.boatzincs_id,
    aph.list_price as new_price,
    aph.price_change,
    aph.percent_change,
    aph.recorded_at
FROM anode_price_history aph
JOIN anodes_catalog ac ON aph.anode_id = ac.id
WHERE aph.recorded_at > NOW() - INTERVAL '7 days'
    AND ABS(aph.percent_change) > 5  -- Only show changes > 5%
ORDER BY aph.recorded_at DESC;