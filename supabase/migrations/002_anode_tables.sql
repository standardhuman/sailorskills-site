-- Anode catalog table
CREATE TABLE anodes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  boatzincs_id TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('shaft', 'hull', 'engine', 'propeller', 'rudder', 'trim_tab', 'other')),
  list_price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track which anodes each boat typically uses
CREATE TABLE boat_anodes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  boat_id UUID REFERENCES boats(id) ON DELETE CASCADE,
  anode_id UUID REFERENCES anodes(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  position TEXT, -- e.g., "port shaft", "starboard hull", etc.
  last_replaced DATE,
  replacement_interval_months INTEGER DEFAULT 6,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(boat_id, anode_id, position)
);

-- Record anode charges/sales
CREATE TABLE anode_charges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  boat_id UUID REFERENCES boats(id) ON DELETE CASCADE,
  stripe_charge_id TEXT,
  service_date DATE DEFAULT CURRENT_DATE,
  subtotal DECIMAL(10, 2) NOT NULL, -- sum of list prices
  tax_amount DECIMAL(10, 2) NOT NULL, -- calculated tax
  markup_amount DECIMAL(10, 2) NOT NULL, -- calculated markup
  total_amount DECIMAL(10, 2) NOT NULL, -- final charge amount
  notes TEXT,
  charged_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual line items for each anode charge
CREATE TABLE anode_charge_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  anode_charge_id UUID REFERENCES anode_charges(id) ON DELETE CASCADE,
  anode_id UUID REFERENCES anodes(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL, -- list price at time of sale
  line_total DECIMAL(10, 2) NOT NULL, -- quantity * unit_price
  position TEXT -- where it was installed
);

-- Daily service schedule (can be populated from Notion or manually)
CREATE TABLE service_schedule (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  service_date DATE NOT NULL,
  boat_id UUID REFERENCES boats(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  service_order INTEGER, -- order in which boats will be serviced
  service_type TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(service_date, boat_id)
);

-- Create indexes for performance
CREATE INDEX idx_boat_anodes_boat_id ON boat_anodes(boat_id);
CREATE INDEX idx_anode_charges_customer_id ON anode_charges(customer_id);
CREATE INDEX idx_anode_charges_boat_id ON anode_charges(boat_id);
CREATE INDEX idx_anode_charges_service_date ON anode_charges(service_date);
CREATE INDEX idx_service_schedule_date ON service_schedule(service_date);
CREATE INDEX idx_service_schedule_boat_id ON service_schedule(boat_id);

-- Create update trigger for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_anodes_updated_at BEFORE UPDATE ON anodes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_boat_anodes_updated_at BEFORE UPDATE ON boat_anodes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();