-- =====================================================
-- DRRMS Production Database Schema
-- Complete schema for disaster relief management system
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: aid_requests
-- Stores aid requests from victims
-- =====================================================
CREATE TABLE IF NOT EXISTS aid_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  aid_type TEXT NOT NULL CHECK (aid_type IN ('food', 'medical', 'shelter', 'emergency')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
  people_count INTEGER NOT NULL CHECK (people_count > 0),
  description TEXT,
  location JSONB, -- {lat: number, lng: number, address: string}
  assigned_volunteer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_aid_requests_user_id ON aid_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_aid_requests_status ON aid_requests(status);
CREATE INDEX IF NOT EXISTS idx_aid_requests_priority ON aid_requests(priority);
CREATE INDEX IF NOT EXISTS idx_aid_requests_assigned_volunteer ON aid_requests(assigned_volunteer_id);

-- =====================================================
-- TABLE: donations
-- Stores donations from donors
-- =====================================================
CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10, 2),
  donation_type TEXT NOT NULL CHECK (donation_type IN ('money', 'supplies', 'services')),
  category TEXT CHECK (category IN ('food', 'medical', 'shelter', 'general')),
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'delivered')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_donations_donor_id ON donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);

-- =====================================================
-- TABLE: volunteer_tasks
-- Stores tasks for volunteers
-- =====================================================
CREATE TABLE IF NOT EXISTS volunteer_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aid_request_id UUID REFERENCES aid_requests(id) ON DELETE CASCADE,
  volunteer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  task_type TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'claimed', 'in_progress', 'completed')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  location JSONB, -- {lat: number, lng: number, address: string}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  claimed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_volunteer_tasks_volunteer_id ON volunteer_tasks(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_tasks_status ON volunteer_tasks(status);
CREATE INDEX IF NOT EXISTS idx_volunteer_tasks_aid_request ON volunteer_tasks(aid_request_id);

-- =====================================================
-- TABLE: resources
-- Stores emergency resources (shelters, distribution centers, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('shelter', 'food_distribution', 'medical', 'support_center')),
  address TEXT NOT NULL,
  location JSONB, -- {lat: number, lng: number}
  contact_phone TEXT,
  contact_email TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'limited', 'closed')),
  capacity INTEGER,
  current_occupancy INTEGER DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(type);
CREATE INDEX IF NOT EXISTS idx_resources_status ON resources(status);

-- =====================================================
-- TABLE: inventory
-- Stores inventory items for admin management
-- =====================================================
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('food', 'medical', 'shelter', 'clothing', 'other')),
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit TEXT NOT NULL, -- 'units', 'kg', 'liters', 'boxes', etc.
  min_threshold INTEGER DEFAULT 10,
  location TEXT,
  last_updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock ON inventory(quantity) WHERE quantity <= min_threshold;

-- =====================================================
-- TABLE: notifications
-- Stores user notifications
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- =====================================================
-- TRIGGERS: Update timestamps
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
DROP TRIGGER IF EXISTS update_aid_requests_updated_at ON aid_requests;
CREATE TRIGGER update_aid_requests_updated_at
  BEFORE UPDATE ON aid_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_resources_updated_at ON resources;
CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON resources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_inventory_updated_at ON inventory;
CREATE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TRIGGERS: Auto-create volunteer tasks from aid requests
-- =====================================================

CREATE OR REPLACE FUNCTION create_volunteer_task_from_aid_request()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a volunteer task when a new aid request is created
  INSERT INTO volunteer_tasks (
    aid_request_id,
    task_type,
    description,
    status,
    priority,
    location
  ) VALUES (
    NEW.id,
    NEW.aid_type,
    'Aid request: ' || NEW.description,
    'available',
    NEW.priority,
    NEW.location
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS create_task_on_aid_request ON aid_requests;
CREATE TRIGGER create_task_on_aid_request
  AFTER INSERT ON aid_requests
  FOR EACH ROW
  EXECUTE FUNCTION create_volunteer_task_from_aid_request();

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE aid_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES: aid_requests
-- =====================================================

-- Victims can view and create their own requests
DROP POLICY IF EXISTS "victims_own_requests" ON aid_requests;
CREATE POLICY "victims_own_requests" ON aid_requests
  FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Volunteers can view all requests
DROP POLICY IF EXISTS "volunteers_view_requests" ON aid_requests;
CREATE POLICY "volunteers_view_requests" ON aid_requests
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'volunteer'
    )
  );

-- Volunteers can update requests they're assigned to
DROP POLICY IF EXISTS "volunteers_update_assigned_requests" ON aid_requests;
CREATE POLICY "volunteers_update_assigned_requests" ON aid_requests
  FOR UPDATE
  USING (
    auth.uid() = assigned_volunteer_id AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'volunteer'
    )
  );

-- Admins can do everything
DROP POLICY IF EXISTS "admins_all_requests" ON aid_requests;
CREATE POLICY "admins_all_requests" ON aid_requests
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- RLS POLICIES: donations
-- =====================================================

-- Donors can view and create their own donations
DROP POLICY IF EXISTS "donors_own_donations" ON donations;
CREATE POLICY "donors_own_donations" ON donations
  FOR ALL 
  USING (auth.uid() = donor_id)
  WITH CHECK (auth.uid() = donor_id);

-- Admins can view all donations
DROP POLICY IF EXISTS "admins_view_donations" ON donations;
CREATE POLICY "admins_view_donations" ON donations
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- RLS POLICIES: volunteer_tasks
-- =====================================================

-- Volunteers can view available tasks
DROP POLICY IF EXISTS "volunteers_view_available_tasks" ON volunteer_tasks;
CREATE POLICY "volunteers_view_available_tasks" ON volunteer_tasks
  FOR SELECT 
  USING (
    status = 'available' OR 
    volunteer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('volunteer', 'admin')
    )
  );

-- Volunteers can claim available tasks
DROP POLICY IF EXISTS "volunteers_claim_tasks" ON volunteer_tasks;
CREATE POLICY "volunteers_claim_tasks" ON volunteer_tasks
  FOR UPDATE 
  USING (
    (status = 'available' OR volunteer_id = auth.uid()) AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'volunteer'
    )
  );

-- Admins can do everything
DROP POLICY IF EXISTS "admins_all_tasks" ON volunteer_tasks;
CREATE POLICY "admins_all_tasks" ON volunteer_tasks
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- RLS POLICIES: resources
-- =====================================================

-- Everyone can view resources
DROP POLICY IF EXISTS "public_view_resources" ON resources;
CREATE POLICY "public_view_resources" ON resources
  FOR SELECT 
  USING (true);

-- Only admins can modify resources
DROP POLICY IF EXISTS "admins_manage_resources" ON resources;
CREATE POLICY "admins_manage_resources" ON resources
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- RLS POLICIES: inventory
-- =====================================================

-- Admins and volunteers can view inventory
DROP POLICY IF EXISTS "staff_view_inventory" ON inventory;
CREATE POLICY "staff_view_inventory" ON inventory
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'volunteer')
    )
  );

-- Only admins can modify inventory
DROP POLICY IF EXISTS "admins_manage_inventory" ON inventory;
CREATE POLICY "admins_manage_inventory" ON inventory
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- RLS POLICIES: notifications
-- =====================================================

-- Users can view their own notifications
DROP POLICY IF EXISTS "users_own_notifications" ON notifications;
CREATE POLICY "users_own_notifications" ON notifications
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
DROP POLICY IF EXISTS "users_update_own_notifications" ON notifications;
CREATE POLICY "users_update_own_notifications" ON notifications
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- System can create notifications for any user
DROP POLICY IF EXISTS "system_create_notifications" ON notifications;
CREATE POLICY "system_create_notifications" ON notifications
  FOR INSERT 
  WITH CHECK (true);

-- =====================================================
-- SEED DATA: Sample resources
-- =====================================================

INSERT INTO resources (name, type, address, location, contact_phone, status, capacity, description)
VALUES 
  (
    'Central Emergency Shelter',
    'shelter',
    '123 Main Street, Downtown',
    '{"lat": 40.7128, "lng": -74.0060}',
    '(555) 123-4567',
    'open',
    200,
    'Main emergency shelter with beds, food, and medical support'
  ),
  (
    'Red Cross Food Distribution Center',
    'food_distribution',
    '456 Oak Avenue, Westside',
    '{"lat": 40.7580, "lng": -73.9855}',
    '(555) 234-5678',
    'open',
    NULL,
    'Daily food distribution from 9 AM to 5 PM'
  ),
  (
    'Emergency Medical Clinic',
    'medical',
    '789 Pine Street, Eastside',
    '{"lat": 40.7489, "lng": -73.9680}',
    '(555) 345-6789',
    'limited',
    50,
    'Emergency medical services and first aid'
  ),
  (
    'Family Support Center',
    'support_center',
    '321 Elm Road, Northside',
    '{"lat": 40.7831, "lng": -73.9712}',
    '(555) 456-7890',
    'open',
    NULL,
    '24/7 counseling and family support services'
  )
ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check tables exist
SELECT 
  'aid_requests' as table_name, 
  COUNT(*) as row_count 
FROM aid_requests
UNION ALL
SELECT 'donations', COUNT(*) FROM donations
UNION ALL
SELECT 'volunteer_tasks', COUNT(*) FROM volunteer_tasks
UNION ALL
SELECT 'resources', COUNT(*) FROM resources
UNION ALL
SELECT 'inventory', COUNT(*) FROM inventory
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications;

-- Check RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('aid_requests', 'donations', 'volunteer_tasks', 'resources', 'inventory', 'notifications')
ORDER BY tablename;

-- List all policies
SELECT 
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- FUNCTION: claim_task
-- Allows a volunteer to claim a task and updates linked request
-- =====================================================
CREATE OR REPLACE FUNCTION claim_task(task_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_task_record RECORD;
  v_aid_request_id UUID;
BEGIN
  -- Check if task exists and is available
  SELECT * INTO v_task_record FROM volunteer_tasks
  WHERE id = task_id AND status = 'available'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Task not found or already claimed');
  END IF;

  v_aid_request_id := v_task_record.aid_request_id;

  -- Update task
  UPDATE volunteer_tasks
  SET 
    volunteer_id = auth.uid(),
    status = 'claimed',
    claimed_at = NOW()
  WHERE id = task_id;

  -- Update linked aid request if it exists
  IF v_aid_request_id IS NOT NULL THEN
    UPDATE aid_requests
    SET 
      assigned_volunteer_id = auth.uid(),
      status = 'assigned'
    WHERE id = v_aid_request_id;
  END IF;

  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
