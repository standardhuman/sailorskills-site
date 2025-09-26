-- Create anodes catalog table
CREATE TABLE IF NOT EXISTS anodes_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    boatzincs_id VARCHAR(100) UNIQUE,
    name VARCHAR(500) NOT NULL,
    product_url TEXT,
    material VARCHAR(50),
    category VARCHAR(50),
    subcategory VARCHAR(100),
    list_price DECIMAL(10,2),
    sale_price DECIMAL(10,2),
    is_on_sale BOOLEAN DEFAULT false,
    image_url TEXT,
    thumbnail_url TEXT,
    sku VARCHAR(100),
    description TEXT,
    dimensions VARCHAR(200),
    weight VARCHAR(100),
    manufacturer VARCHAR(200),
    part_number VARCHAR(100),
    stock_status VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    last_scraped TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create price history table
CREATE TABLE IF NOT EXISTS anode_price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anode_id UUID REFERENCES anodes_catalog(id) ON DELETE CASCADE,
    list_price DECIMAL(10,2),
    sale_price DECIMAL(10,2),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sync logs table
CREATE TABLE IF NOT EXISTS anode_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sync_type VARCHAR(50),
    status VARCHAR(50),
    triggered_by VARCHAR(50),
    trigger_method VARCHAR(50),
    items_processed INTEGER DEFAULT 0,
    items_added INTEGER DEFAULT 0,
    items_updated INTEGER DEFAULT 0,
    items_failed INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_anodes_catalog_material ON anodes_catalog(material);
CREATE INDEX IF NOT EXISTS idx_anodes_catalog_category ON anodes_catalog(category);
CREATE INDEX IF NOT EXISTS idx_anodes_catalog_subcategory ON anodes_catalog(subcategory);
CREATE INDEX IF NOT EXISTS idx_anodes_catalog_is_active ON anodes_catalog(is_active);
CREATE INDEX IF NOT EXISTS idx_anode_price_history_anode_id ON anode_price_history(anode_id);
CREATE INDEX IF NOT EXISTS idx_anode_sync_logs_sync_type ON anode_sync_logs(sync_type);
CREATE INDEX IF NOT EXISTS idx_anode_sync_logs_status ON anode_sync_logs(status);