-- Migration for Owner Verification System
-- This script adds necessary columns to 'turfs' and creates new tables for verification documents and history.

-- 1. Update 'turfs' table with verification fields
ALTER TABLE turfs
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected', 'draft')),
ADD COLUMN IF NOT EXISTS is_listed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reviewed_by UUID references admins(id),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS google_maps_url TEXT, -- Store raw URL separate from generated coords if needed
ADD COLUMN IF NOT EXISTS additional_facilities TEXT[], -- Array for structured facilities
ADD COLUMN IF NOT EXISTS images_urls TEXT[]; -- Make specific column for array if 'images' is text

-- Update existing turfs to be approved by default so current business is not disrupted
UPDATE turfs SET verification_status = 'approved', is_listed = true WHERE verification_status = 'pending' AND created_at < NOW();


-- 2. Create 'turf_verification_documents' table
CREATE TABLE IF NOT EXISTS turf_verification_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turf_id UUID REFERENCES turfs(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL, -- e.g., 'ownership_proof', 'business_license', 'id_proof'
    document_url TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    rejection_reason TEXT
);

-- 3. Create 'turf_verification_history' table (Audit Trail)
CREATE TABLE IF NOT EXISTS turf_verification_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turf_id UUID REFERENCES turfs(id) ON DELETE CASCADE,
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    changed_by UUID, -- Can be admin_id or NULL (system)
    change_reason TEXT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create 'owner_notifications' table
CREATE TABLE IF NOT EXISTS owner_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Assuming 'users' table exists and owners are users
    type VARCHAR(50) NOT NULL, -- 'verification_approved', 'verification_rejected', 'info'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    related_turf_id UUID REFERENCES turfs(id) ON DELETE SET NULL
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_turfs_owner_id ON turfs(owner_id);
CREATE INDEX IF NOT EXISTS idx_turfs_verification_status ON turfs(verification_status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON owner_notifications(user_id);
