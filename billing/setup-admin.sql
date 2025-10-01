-- Run this in Supabase SQL Editor to set up admin access

-- First, create an admin user in the Auth tab of Supabase Dashboard
-- Use your email and a strong password

-- Then run this to give yourself admin privileges:
-- Replace 'your-email@example.com' with your actual email

-- Create an admin users table to track admin privileges
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add yourself as an admin (run after creating user in Auth tab)
-- INSERT INTO admin_users (id, email) 
-- SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Create RLS policies for admin access
CREATE POLICY "Admins can view all orders" ON service_orders
FOR ALL USING (
    auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY "Admins can update orders" ON service_orders
FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY "Admins can view all customers" ON customers
FOR SELECT USING (
    auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY "Admins can view all boats" ON boats
FOR SELECT USING (
    auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY "Admins can view all marinas" ON marinas
FOR SELECT USING (
    auth.uid() IN (SELECT id FROM admin_users)
);

-- Grant admin users ability to execute Edge Functions
-- This is handled by Supabase Auth automatically