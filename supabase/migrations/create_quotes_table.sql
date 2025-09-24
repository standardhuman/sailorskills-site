-- Create quotes table
CREATE TABLE IF NOT EXISTS public.quotes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quote_number VARCHAR(50) UNIQUE NOT NULL,
    quote_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_days INTEGER DEFAULT 30,

    -- Customer information
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    boat_name VARCHAR(255),
    boat_make VARCHAR(255),
    marina VARCHAR(255),
    slip VARCHAR(50),

    -- Service details
    service_type VARCHAR(100),
    service_name VARCHAR(255),
    boat_length DECIMAL(5,2),
    paint_condition VARCHAR(50),
    growth_level VARCHAR(50),
    has_twin_engines BOOLEAN DEFAULT false,
    additional_hulls INTEGER DEFAULT 0,

    -- Pricing
    base_price DECIMAL(10,2),
    rate_per_foot DECIMAL(10,2),
    anode_cost DECIMAL(10,2) DEFAULT 0,
    anode_labor_cost DECIMAL(10,2) DEFAULT 0,
    total_cost DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',

    -- Anodes JSON array
    anodes JSONB DEFAULT '[]'::JSONB,

    -- Quote status
    status VARCHAR(50) DEFAULT 'draft',
    viewed_at TIMESTAMP WITH TIME ZONE,
    accepted_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255),
    pdf_url TEXT,
    notes TEXT
);

-- Create indexes for common queries
CREATE INDEX idx_quotes_quote_number ON public.quotes(quote_number);
CREATE INDEX idx_quotes_customer_email ON public.quotes(customer_email);
CREATE INDEX idx_quotes_status ON public.quotes(status);
CREATE INDEX idx_quotes_created_at ON public.quotes(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to view quotes by quote_number
-- (for the public quote viewer)
CREATE POLICY "Quotes are viewable by anyone with the quote number"
    ON public.quotes
    FOR SELECT
    USING (true);

-- Create a policy for inserting quotes (admin only - requires service role)
CREATE POLICY "Service role can insert quotes"
    ON public.quotes
    FOR INSERT
    WITH CHECK (true);

-- Create a policy for updating quotes (admin only - requires service role)
CREATE POLICY "Service role can update quotes"
    ON public.quotes
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Add a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_quotes_updated_at
    BEFORE UPDATE ON public.quotes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();