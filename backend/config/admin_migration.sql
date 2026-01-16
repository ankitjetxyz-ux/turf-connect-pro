-- Admin Module Schema Updates
-- Run this in Supabase SQL Editor or via postgres connection

-- 1. Create Admins Table
CREATE TABLE IF NOT EXISTS admins (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name text NOT NULL,
  role text DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  is_active boolean DEFAULT true,
  last_login timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- 2. Create Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_type text NOT NULL, -- 'turf_approved', 'turf_rejected', 'admin_login', etc.
  description text,
  entity_id uuid, -- ID of the entity being acted upon (e.g., turf_id)
  entity_type text, -- 'turf', 'user', 'booking'
  admin_id uuid REFERENCES admins(id), -- Who performed the action
  metadata jsonb, -- Extra details
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_admin_id ON activity_logs(admin_id);

-- 3. Add Verification Fields to Turfs Table
-- Using DO block to avoid errors if columns already exist
DO $$
BEGIN
    -- verification_status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'turfs' AND column_name = 'verification_status') THEN
        ALTER TABLE turfs ADD COLUMN verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected', 'under_review'));
    END IF;

    -- submitted_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'turfs' AND column_name = 'submitted_at') THEN
        ALTER TABLE turfs ADD COLUMN submitted_at timestamptz DEFAULT now();
    END IF;

    -- reviewed_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'turfs' AND column_name = 'reviewed_at') THEN
        ALTER TABLE turfs ADD COLUMN reviewed_at timestamptz;
    END IF;

    -- reviewed_by
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'turfs' AND column_name = 'reviewed_by') THEN
        ALTER TABLE turfs ADD COLUMN reviewed_by uuid REFERENCES admins(id);
    END IF;

    -- admin_notes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'turfs' AND column_name = 'admin_notes') THEN
        ALTER TABLE turfs ADD COLUMN admin_notes text;
    END IF;

    -- rejection_reason
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'turfs' AND column_name = 'rejection_reason') THEN
        ALTER TABLE turfs ADD COLUMN rejection_reason text;
    END IF;
END $$;

-- 4. Create Index for Verification Status
CREATE INDEX IF NOT EXISTS idx_turfs_verification_status ON turfs(verification_status);

-- Comments
COMMENT ON TABLE admins IS 'System administrators with access to verification panel';
COMMENT ON TABLE activity_logs IS 'Audit trail for admin actions';
