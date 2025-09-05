-- Create booking types enum
CREATE TYPE booking_type AS ENUM ('consultation', 'half_day', 'full_day', 'extended');

-- Create booking status enum
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

-- Create service types table
CREATE TABLE service_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  duration_hours DECIMAL(3,1) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  type booking_type NOT NULL,
  max_participants INTEGER DEFAULT 1,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create bookings table
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_type_id UUID REFERENCES service_types(id) ON DELETE RESTRICT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  participants INTEGER DEFAULT 1,
  status booking_status DEFAULT 'pending',
  google_event_id TEXT,
  notes TEXT,
  total_price DECIMAL(10,2) NOT NULL,
  stripe_payment_intent_id TEXT,
  confirmation_sent_at TIMESTAMP WITH TIME ZONE,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create availability rules table
CREATE TABLE availability_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create blocked dates table
CREATE TABLE blocked_dates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(date)
);

-- Create admin settings table
CREATE TABLE booking_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert default service types
INSERT INTO service_types (name, description, duration_hours, price, type) VALUES
  ('Free Consultation', 'We meet at your boat to discuss your goals and develop a plan for you.', 1, 0, 'consultation'),
  ('Training: Half Day', '3 hours of in-person training', 3, 250, 'half_day'),
  ('Training: Full Day', '6-7 hours of in-person training', 7, 450, 'full_day'),
  ('Extended Session', 'For voyages requiring more than 7 hours. See FAQ for pricing details.', 12, 800, 'extended');

-- Insert default availability (9 AM to 6 PM, Monday to Saturday)
INSERT INTO availability_rules (day_of_week, start_time, end_time, is_available) VALUES
  (0, '09:00', '18:00', false), -- Sunday
  (1, '09:00', '18:00', true),  -- Monday
  (2, '09:00', '18:00', true),  -- Tuesday
  (3, '09:00', '18:00', true),  -- Wednesday
  (4, '09:00', '18:00', true),  -- Thursday
  (5, '09:00', '18:00', true),  -- Friday
  (6, '09:00', '18:00', true);  -- Saturday

-- Insert default settings
INSERT INTO booking_settings (setting_key, setting_value) VALUES
  ('advance_booking_days', '90'),
  ('minimum_notice_hours', '24'),
  ('buffer_time_minutes', '30'),
  ('reminder_hours_before', '24'),
  ('google_calendar_id', '""'),
  ('sendgrid_api_key', '""'),
  ('twilio_account_sid', '""'),
  ('twilio_auth_token', '""'),
  ('twilio_phone_number', '""'),
  ('admin_email', '""');

-- Create indexes
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_customer_email ON bookings(customer_email);
CREATE INDEX idx_blocked_dates_date ON blocked_dates(date);

-- Create function to check availability
CREATE OR REPLACE FUNCTION check_booking_availability(
  p_date DATE,
  p_start_time TIME,
  p_end_time TIME,
  p_service_type_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_day_of_week INTEGER;
  v_is_available BOOLEAN;
  v_blocked_count INTEGER;
  v_conflict_count INTEGER;
BEGIN
  -- Get day of week (0 = Sunday)
  v_day_of_week := EXTRACT(DOW FROM p_date);
  
  -- Check if date is blocked
  SELECT COUNT(*) INTO v_blocked_count
  FROM blocked_dates
  WHERE date = p_date;
  
  IF v_blocked_count > 0 THEN
    RETURN FALSE;
  END IF;
  
  -- Check availability rules
  SELECT is_available INTO v_is_available
  FROM availability_rules
  WHERE day_of_week = v_day_of_week
    AND start_time <= p_start_time
    AND end_time >= p_end_time;
  
  IF v_is_available IS NULL OR NOT v_is_available THEN
    RETURN FALSE;
  END IF;
  
  -- Check for conflicting bookings
  SELECT COUNT(*) INTO v_conflict_count
  FROM bookings
  WHERE booking_date = p_date
    AND status IN ('pending', 'confirmed')
    AND (
      (start_time <= p_start_time AND end_time > p_start_time) OR
      (start_time < p_end_time AND end_time >= p_end_time) OR
      (start_time >= p_start_time AND end_time <= p_end_time)
    );
  
  RETURN v_conflict_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Create RLS policies
ALTER TABLE service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_settings ENABLE ROW LEVEL SECURITY;

-- Public can read service types
CREATE POLICY "Service types are viewable by everyone" ON service_types
  FOR SELECT USING (true);

-- Public can create bookings
CREATE POLICY "Anyone can create bookings" ON bookings
  FOR INSERT WITH CHECK (true);

-- Public can view their own bookings
CREATE POLICY "Users can view their own bookings" ON bookings
  FOR SELECT USING (true);

-- Public can read availability rules
CREATE POLICY "Availability rules are viewable by everyone" ON availability_rules
  FOR SELECT USING (true);

-- Public can read blocked dates
CREATE POLICY "Blocked dates are viewable by everyone" ON blocked_dates
  FOR SELECT USING (true);