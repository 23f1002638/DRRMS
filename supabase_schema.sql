-- =====================================================
-- LIFELINE DISASTER RELIEF SYSTEM - DATABASE SCHEMA
-- =====================================================
-- Run this script in Supabase SQL Editor to set up the complete backend
-- This creates all tables, RLS policies, functions, and triggers

-- =====================================================
-- 1. CUSTOM TYPES & ENUMS
-- =====================================================

-- User role types
CREATE TYPE user_role AS ENUM ('admin', 'volunteer', 'victim', 'donor');

-- Request status types
CREATE TYPE request_status AS ENUM ('pending', 'in_progress', 'resolved', 'cancelled');

-- Request category types
CREATE TYPE request_category AS ENUM ('food', 'medical', 'shelter', 'emergency');

-- Inventory status types
CREATE TYPE inventory_status AS ENUM ('available', 'low_stock', 'out_of_stock', 'reserved');

-- =====================================================
-- 2. PROFILES TABLE (Extends auth.users)
-- =====================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'victim',
  phone TEXT,
  location TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster role-based queries
CREATE INDEX idx_profiles_role ON profiles(role);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- 3. RELIEF REQUESTS TABLE
-- =====================================================

CREATE TABLE relief_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category request_category NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  urgency INTEGER NOT NULL CHECK (urgency >= 1 AND urgency <= 5),
  status request_status NOT NULL DEFAULT 'pending',
  
  -- Geolocation
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  location_address TEXT,
  
  -- Request details
  people_count INTEGER DEFAULT 1,
  required_items JSONB DEFAULT '[]'::jsonb,
  special_needs TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT valid_coordinates CHECK (
    lat >= -90 AND lat <= 90 AND
    lng >= -180 AND lng <= 180
  )
);

-- Create indexes for performance
CREATE INDEX idx_relief_requests_status ON relief_requests(status);
CREATE INDEX idx_relief_requests_category ON relief_requests(category);
CREATE INDEX idx_relief_requests_urgency ON relief_requests(urgency DESC);
CREATE INDEX idx_relief_requests_requester ON relief_requests(requester_id);
CREATE INDEX idx_relief_requests_location ON relief_requests USING gist (
  ll_to_earth(lat, lng)
);

-- Enable RLS
ALTER TABLE relief_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for relief_requests
CREATE POLICY "Victims can view their own requests"
  ON relief_requests FOR SELECT
  USING (
    requester_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'volunteer')
    )
  );

CREATE POLICY "Victims can create their own requests"
  ON relief_requests FOR INSERT
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Victims can update their own pending requests"
  ON relief_requests FOR UPDATE
  USING (
    requester_id = auth.uid() AND status = 'pending'
  );

CREATE POLICY "Admins and volunteers can update requests"
  ON relief_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'volunteer')
    )
  );

CREATE POLICY "Admins can delete requests"
  ON relief_requests FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- 4. INVENTORY TABLE
-- =====================================================

CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name TEXT NOT NULL,
  category request_category NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit TEXT NOT NULL DEFAULT 'units',
  threshold_limit INTEGER NOT NULL DEFAULT 10,
  status inventory_status GENERATED ALWAYS AS (
    CASE
      WHEN quantity = 0 THEN 'out_of_stock'::inventory_status
      WHEN quantity <= threshold_limit THEN 'low_stock'::inventory_status
      ELSE 'available'::inventory_status
    END
  ) STORED,
  
  -- Metadata
  location TEXT,
  supplier TEXT,
  expiry_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure unique items per category
  UNIQUE(item_name, category)
);

-- Create indexes
CREATE INDEX idx_inventory_category ON inventory(category);
CREATE INDEX idx_inventory_status ON inventory(status);

-- Enable RLS
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inventory
CREATE POLICY "Everyone can view inventory"
  ON inventory FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage inventory"
  ON inventory FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- 5. ASSIGNMENTS TABLE (Volunteer-Request Junction)
-- =====================================================

CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  request_id UUID NOT NULL REFERENCES relief_requests(id) ON DELETE CASCADE,
  
  -- Assignment status
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  notes TEXT,
  
  -- Prevent duplicate assignments
  UNIQUE(volunteer_id, request_id)
);

-- Create indexes
CREATE INDEX idx_assignments_volunteer ON assignments(volunteer_id);
CREATE INDEX idx_assignments_request ON assignments(request_id);

-- Enable RLS
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assignments
CREATE POLICY "Volunteers can view their own assignments"
  ON assignments FOR SELECT
  USING (
    volunteer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Volunteers can create assignments for themselves"
  ON assignments FOR INSERT
  WITH CHECK (volunteer_id = auth.uid());

CREATE POLICY "Volunteers can update their own assignments"
  ON assignments FOR UPDATE
  USING (volunteer_id = auth.uid());

-- =====================================================
-- 6. DONATIONS TABLE
-- =====================================================

CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Donation details
  donation_type TEXT NOT NULL CHECK (donation_type IN ('monetary', 'supplies', 'services')),
  amount DECIMAL(10, 2) CHECK (amount > 0),
  items JSONB DEFAULT '[]'::jsonb,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'delivered', 'cancelled')),
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_donations_donor ON donations(donor_id);
CREATE INDEX idx_donations_status ON donations(status);

-- Enable RLS
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for donations
CREATE POLICY "Donors can view their own donations"
  ON donations FOR SELECT
  USING (
    donor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Donors can create donations"
  ON donations FOR INSERT
  WITH CHECK (donor_id = auth.uid());

-- =====================================================
-- 7. DATABASE FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'victim')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to claim a task (used by volunteers)
CREATE OR REPLACE FUNCTION claim_task(task_id UUID)
RETURNS JSONB AS $$
DECLARE
  current_status request_status;
  result JSONB;
BEGIN
  -- Check if request exists and is pending
  SELECT status INTO current_status
  FROM relief_requests
  WHERE id = task_id;
  
  IF current_status IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found');
  END IF;
  
  IF current_status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request already claimed');
  END IF;
  
  -- Update request status
  UPDATE relief_requests
  SET status = 'in_progress', updated_at = NOW()
  WHERE id = task_id;
  
  -- Create assignment
  INSERT INTO assignments (volunteer_id, request_id)
  VALUES (auth.uid(), task_id);
  
  RETURN jsonb_build_object('success', true, 'message', 'Task claimed successfully');
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'error', 'You have already claimed this task');
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. TRIGGERS
-- =====================================================

-- Trigger to update updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at on relief_requests
CREATE TRIGGER update_relief_requests_updated_at
  BEFORE UPDATE ON relief_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at on inventory
CREATE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at on donations
CREATE TRIGGER update_donations_updated_at
  BEFORE UPDATE ON donations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- 9. SEED DATA (Optional - for testing)
-- =====================================================

-- Insert sample inventory items
INSERT INTO inventory (item_name, category, quantity, unit, threshold_limit, location, supplier) VALUES
  ('Emergency Food Packages', 'food', 500, 'packages', 100, 'Warehouse A', 'Relief Foods Inc'),
  ('Bottled Water (1L)', 'food', 1000, 'bottles', 200, 'Warehouse A', 'AquaSafe Corp'),
  ('First Aid Kits', 'medical', 150, 'kits', 50, 'Warehouse B', 'MedCorp Solutions'),
  ('Antibiotics', 'medical', 80, 'boxes', 30, 'Warehouse B', 'MedCorp Solutions'),
  ('Emergency Blankets', 'shelter', 300, 'pieces', 100, 'Warehouse C', 'Warmth Solutions'),
  ('Tents (4-person)', 'shelter', 50, 'units', 20, 'Warehouse C', 'Shelter Supplies Co');

-- =====================================================
-- 10. GRANT PERMISSIONS
-- =====================================================

-- Grant usage on custom types
GRANT USAGE ON TYPE user_role TO authenticated;
GRANT USAGE ON TYPE request_status TO authenticated;
GRANT USAGE ON TYPE request_category TO authenticated;
GRANT USAGE ON TYPE inventory_status TO authenticated;

-- =====================================================
-- SETUP COMPLETE
-- =====================================================
-- Your database is now ready for the Lifeline Disaster Relief System!
-- Next steps:
-- 1. Configure your .env file with Supabase credentials
-- 2. Initialize Supabase client in src/lib/supabase.ts
-- 3. Create custom hooks in src/hooks/useDisasterData.ts
-- 4. Refactor components to use real data
