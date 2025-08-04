-- Create an admin users table to track admin privileges
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create RLS policies for admin access
CREATE POLICY IF NOT EXISTS "Admins can view all orders" ON service_orders
FOR ALL USING (
    auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY IF NOT EXISTS "Admins can update orders" ON service_orders
FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY IF NOT EXISTS "Admins can view all customers" ON customers
FOR SELECT USING (
    auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY IF NOT EXISTS "Admins can view all boats" ON boats
FOR SELECT USING (
    auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY IF NOT EXISTS "Admins can view all marinas" ON marinas
FOR SELECT USING (
    auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY IF NOT EXISTS "Admins can view all service_history" ON service_history
FOR SELECT USING (
    auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY IF NOT EXISTS "Admins can view all service_schedules" ON service_schedules
FOR SELECT USING (
    auth.uid() IN (SELECT id FROM admin_users)
);