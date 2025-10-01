-- Migration: Booking System Tables
-- Created: 2025-09-30
-- Description: Tables for booking system with Google Calendar integration

-- ============================================================================
-- Service Types Table
-- Defines available services, durations, and pricing
-- ============================================================================
CREATE TABLE IF NOT EXISTS service_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL, -- URL-friendly identifier
    description TEXT,
    duration_minutes INTEGER NOT NULL, -- Service duration
    buffer_minutes INTEGER DEFAULT 30, -- Time after service before next booking
    price_cents INTEGER, -- Price in cents (null if contact for pricing)
    category TEXT, -- e.g., 'training', 'diving', 'detailing', 'deliveries'
    active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    requires_deposit BOOLEAN DEFAULT false,
    deposit_percentage INTEGER DEFAULT 0, -- 0-100
    max_advance_days INTEGER DEFAULT 90, -- How far in advance can book
    min_advance_hours INTEGER DEFAULT 24, -- Minimum notice required
    metadata JSONB DEFAULT '{}'::jsonb, -- For custom fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Business Hours Table
-- Defines when bookings can be made
-- ============================================================================
CREATE TABLE IF NOT EXISTS business_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- ============================================================================
-- Booking Settings Table
-- Global settings for booking system
-- ============================================================================
CREATE TABLE IF NOT EXISTS booking_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    setting_type TEXT DEFAULT 'string', -- string, number, boolean, json
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Bookings Table
-- Main bookings/appointments table
-- ============================================================================
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Service Info
    service_type_id UUID REFERENCES service_types(id),
    service_name TEXT NOT NULL, -- Denormalized for history

    -- Timing
    booking_start TIMESTAMPTZ NOT NULL,
    booking_end TIMESTAMPTZ NOT NULL,
    timezone TEXT DEFAULT 'America/Los_Angeles',

    -- Customer Info
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,

    -- Location (for services like deliveries, diving)
    location_info JSONB DEFAULT '{}'::jsonb,

    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
    cancellation_reason TEXT,
    cancelled_at TIMESTAMPTZ,

    -- Payment
    stripe_payment_intent_id TEXT,
    stripe_customer_id TEXT,
    amount_cents INTEGER,
    deposit_cents INTEGER,
    payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'deposit_paid', 'paid', 'refunded')),

    -- Google Calendar Integration
    google_calendar_event_id TEXT,
    calendar_sync_status TEXT DEFAULT 'pending' CHECK (calendar_sync_status IN ('pending', 'synced', 'failed', 'deleted')),
    calendar_sync_error TEXT,
    calendar_synced_at TIMESTAMPTZ,

    -- Notes
    customer_notes TEXT,
    internal_notes TEXT,

    -- Reminders
    reminder_sent_24h BOOLEAN DEFAULT false,
    reminder_sent_1h BOOLEAN DEFAULT false,

    -- Metadata
    booking_metadata JSONB DEFAULT '{}'::jsonb,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT, -- User ID if admin created

    CONSTRAINT valid_booking_time CHECK (booking_end > booking_start)
);

-- ============================================================================
-- Booking History Table
-- Track changes to bookings
-- ============================================================================
CREATE TABLE IF NOT EXISTS booking_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    changed_by TEXT, -- User ID or 'system'
    change_type TEXT NOT NULL, -- created, updated, cancelled, completed
    old_values JSONB,
    new_values JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Blackout Dates Table
-- Dates when bookings are not allowed (vacations, holidays, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS blackout_dates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    all_day BOOLEAN DEFAULT true,
    start_time TIME,
    end_time TIME,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Bookings indexes
CREATE INDEX IF NOT EXISTS idx_bookings_start_time ON bookings(booking_start);
CREATE INDEX IF NOT EXISTS idx_bookings_end_time ON bookings(booking_end);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_email ON bookings(customer_email);
CREATE INDEX IF NOT EXISTS idx_bookings_service_type ON bookings(service_type_id);
CREATE INDEX IF NOT EXISTS idx_bookings_calendar_event ON bookings(google_calendar_event_id);

-- Service types indexes
CREATE INDEX IF NOT EXISTS idx_service_types_active ON service_types(active);
CREATE INDEX IF NOT EXISTS idx_service_types_category ON service_types(category);

-- Business hours indexes
CREATE INDEX IF NOT EXISTS idx_business_hours_day ON business_hours(day_of_week);
CREATE INDEX IF NOT EXISTS idx_business_hours_active ON business_hours(active);

-- Blackout dates indexes
CREATE INDEX IF NOT EXISTS idx_blackout_dates_range ON blackout_dates(start_date, end_date);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE blackout_dates ENABLE ROW LEVEL SECURITY;

-- Public can view active service types
CREATE POLICY "Anyone can view active service types"
ON service_types FOR SELECT
USING (active = true);

-- Public can view active business hours
CREATE POLICY "Anyone can view active business hours"
ON business_hours FOR SELECT
USING (active = true);

-- Public can view active blackout dates
CREATE POLICY "Anyone can view active blackout dates"
ON blackout_dates FOR SELECT
USING (active = true);

-- Public can create bookings
CREATE POLICY "Anyone can create bookings"
ON bookings FOR INSERT
WITH CHECK (true);

-- Customers can view their own bookings
CREATE POLICY "Customers can view their bookings"
ON bookings FOR SELECT
USING (true); -- Will need to add auth.email() check when auth is set up

-- Service role can do everything (for admin and server)
-- These policies will use service role key which bypasses RLS

-- ============================================================================
-- Updated At Triggers
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
CREATE TRIGGER update_service_types_updated_at BEFORE UPDATE ON service_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_hours_updated_at BEFORE UPDATE ON business_hours
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_booking_settings_updated_at BEFORE UPDATE ON booking_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Seed Data - Service Types
-- ============================================================================

INSERT INTO service_types (name, slug, description, duration_minutes, buffer_minutes, category, display_order, min_advance_hours)
VALUES
    ('Free Consultation', 'free-consultation', 'Discuss your sailing goals and create a personalized training plan', 30, 15, 'training', 1, 24),
    ('Training Half Day', 'training-half-day', 'Focused 4-hour sailing instruction session', 240, 30, 'training', 2, 48),
    ('Training Full Day', 'training-full-day', 'Comprehensive 8-hour sailing instruction', 480, 30, 'training', 3, 48),
    ('Extended Training Session', 'training-extended', 'Multi-day intensive training program', 960, 60, 'training', 4, 168),
    ('Diving Service Quote', 'diving-quote', 'Get a custom quote for hull cleaning, anode replacement, or inspection', 30, 15, 'diving', 5, 24),
    ('Detailing Quote', 'detailing-quote', 'Get a custom quote for boat detailing services', 30, 15, 'detailing', 6, 24),
    ('Delivery Quote', 'delivery-quote', 'Discuss your boat delivery needs and get a custom quote', 60, 15, 'deliveries', 7, 48)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- Seed Data - Business Hours (Monday - Saturday, 8 AM - 6 PM)
-- ============================================================================

INSERT INTO business_hours (day_of_week, start_time, end_time, notes)
VALUES
    (1, '08:00', '18:00', 'Monday'),
    (2, '08:00', '18:00', 'Tuesday'),
    (3, '08:00', '18:00', 'Wednesday'),
    (4, '08:00', '18:00', 'Thursday'),
    (5, '08:00', '18:00', 'Friday'),
    (6, '08:00', '18:00', 'Saturday')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Seed Data - Booking Settings
-- ============================================================================

INSERT INTO booking_settings (setting_key, setting_value, setting_type, description)
VALUES
    ('max_advance_booking_days', '90', 'number', 'Maximum days in advance customers can book'),
    ('min_advance_booking_hours', '24', 'number', 'Minimum hours in advance required for booking'),
    ('default_timezone', 'America/Los_Angeles', 'string', 'Default timezone for bookings'),
    ('allow_same_day_booking', 'false', 'boolean', 'Allow bookings for same day'),
    ('send_confirmation_email', 'true', 'boolean', 'Send email confirmation to customers'),
    ('send_reminder_24h', 'true', 'boolean', 'Send reminder 24 hours before appointment'),
    ('send_reminder_1h', 'true', 'boolean', 'Send reminder 1 hour before appointment'),
    ('cancellation_policy_hours', '24', 'number', 'Hours before booking that cancellation is allowed')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE service_types IS 'Available services that can be booked';
COMMENT ON TABLE business_hours IS 'Operating hours for booking availability';
COMMENT ON TABLE booking_settings IS 'Global configuration for booking system';
COMMENT ON TABLE bookings IS 'Customer bookings and appointments';
COMMENT ON TABLE booking_history IS 'Audit trail for booking changes';
COMMENT ON TABLE blackout_dates IS 'Dates when bookings are not available';
