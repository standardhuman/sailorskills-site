-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Customers table
CREATE TABLE customers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  stripe_customer_id TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  birthday DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Addresses table (separate for flexibility)
CREATE TABLE addresses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('billing', 'service')) DEFAULT 'billing',
  street TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Boats table
CREATE TABLE boats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  make TEXT,
  model TEXT,
  length INTEGER NOT NULL,
  type TEXT CHECK (type IN ('sailboat', 'powerboat')),
  hull_type TEXT CHECK (hull_type IN ('monohull', 'catamaran', 'trimaran')),
  twin_engines BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marinas table
CREATE TABLE marinas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service orders table
CREATE TABLE service_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  boat_id UUID REFERENCES boats(id),
  marina_id UUID REFERENCES marinas(id),
  dock TEXT,
  slip_number TEXT,
  service_type TEXT NOT NULL,
  service_interval TEXT,
  estimated_amount DECIMAL(10, 2) NOT NULL,
  final_amount DECIMAL(10, 2),
  stripe_payment_intent_id TEXT,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
  notes TEXT,
  service_details JSONB, -- Calculator inputs: boat type, hull type, paint condition, growth, anodes
  metadata JSONB, -- Service-specific data: item recovery location, description, lost date, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  scheduled_date DATE,
  completed_at TIMESTAMPTZ
);

-- Service history table
CREATE TABLE service_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES service_orders(id),
  boat_id UUID REFERENCES boats(id),
  service_date DATE NOT NULL,
  service_type TEXT NOT NULL,
  paint_condition TEXT,
  growth_level TEXT,
  anodes_replaced INTEGER DEFAULT 0,
  notes TEXT,
  photos TEXT[], -- Array of storage URLs
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recurring service schedules
CREATE TABLE service_schedules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  boat_id UUID REFERENCES boats(id),
  service_type TEXT NOT NULL,
  interval_months INTEGER NOT NULL,
  next_service_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_service_orders_customer ON service_orders(customer_id);
CREATE INDEX idx_service_orders_status ON service_orders(status);
CREATE INDEX idx_service_orders_service_details ON service_orders USING GIN (service_details);
CREATE INDEX idx_service_orders_metadata ON service_orders USING GIN (metadata);
CREATE INDEX idx_service_schedules_next_date ON service_schedules(next_service_date) WHERE is_active = TRUE;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to customers table
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE boats ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies (adjust based on your auth strategy)
-- For now, these are basic policies - you'll want to refine them

-- Customers can see their own data
CREATE POLICY "Customers can view own data" ON customers
FOR SELECT USING (auth.uid()::TEXT = id::TEXT OR auth.jwt()->>'role' = 'admin');

-- Service orders viewable by customer or admin
CREATE POLICY "View own service orders" ON service_orders
FOR SELECT USING (
  customer_id IN (SELECT id FROM customers WHERE auth.uid()::TEXT = id::TEXT) 
  OR auth.jwt()->>'role' = 'admin'
);

-- Add more policies as needed...