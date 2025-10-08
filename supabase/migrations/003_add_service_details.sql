-- Add service_details and metadata JSONB columns to service_orders
-- This allows storing full calculator context and service-specific metadata

ALTER TABLE service_orders
ADD COLUMN IF NOT EXISTS service_details JSONB,
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add comment for documentation
COMMENT ON COLUMN service_orders.service_details IS 'Stores calculator inputs: boat type, hull type, paint condition, growth level, anodes, etc.';
COMMENT ON COLUMN service_orders.metadata IS 'Stores service-specific data like item recovery location, description, lost date, etc.';

-- Create index for querying service_details
CREATE INDEX IF NOT EXISTS idx_service_orders_service_details ON service_orders USING GIN (service_details);
CREATE INDEX IF NOT EXISTS idx_service_orders_metadata ON service_orders USING GIN (metadata);
