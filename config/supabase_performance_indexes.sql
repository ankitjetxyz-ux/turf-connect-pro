-- Performance Optimization Indexes
-- Run these queries in your Supabase SQL Editor to improve query performance

-- Bookings indexes
create index if not exists idx_bookings_user_id on bookings(user_id);
create index if not exists idx_bookings_status on bookings(status);
create index if not exists idx_bookings_slot_id on bookings(slot_id);

-- Slots indexes
create index if not exists idx_slots_turf_id on slots(turf_id);
create index if not exists idx_slots_is_available on slots(is_available);
create index if not exists idx_slots_date_time on slots(start_time, end_time); -- Assuming these are timestamp or comparable

-- Turfs indexes
create index if not exists idx_turfs_owner_id on turfs(owner_id);
create index if not exists idx_turfs_is_active on turfs(is_active);
create index if not exists idx_turfs_location on turfs(location); -- If searching by location

-- Users indexes (if not already managed by Auth)
-- create index if not exists idx_users_email on users(email);

-- Composite indexes for common query patterns
-- Finding available slots for a turf
create index if not exists idx_slots_turf_available on slots(turf_id, is_available);

-- Finding confirmed bookings for a user
create index if not exists idx_bookings_user_confirmed on bookings(user_id, status);

-- Finding bookings for a turf (via slots) - this is harder to index directly without a join or denormalization, 
-- but ensuring foreign keys are indexed helps.
