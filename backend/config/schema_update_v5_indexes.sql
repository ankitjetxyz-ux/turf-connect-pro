-- Improve search performance with indexes

-- Turfs
CREATE INDEX IF NOT EXISTS idx_turfs_name ON turfs (name);
CREATE INDEX IF NOT EXISTS idx_turfs_location ON turfs (location);
CREATE INDEX IF NOT EXISTS idx_turfs_owner_id ON turfs (owner_id);
CREATE INDEX IF NOT EXISTS idx_turfs_is_active ON turfs (is_active);

-- Tournaments
CREATE INDEX IF NOT EXISTS idx_tournaments_date ON tournaments (date);
CREATE INDEX IF NOT EXISTS idx_tournaments_sport ON tournaments (sport);
CREATE INDEX IF NOT EXISTS idx_tournaments_city ON tournaments (city);

-- Bookings
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings (user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings (status);
CREATE INDEX IF NOT EXISTS idx_bookings_razorpay_order_id ON bookings (razorpay_order_id);

-- Slots
CREATE INDEX IF NOT EXISTS idx_slots_turf_id ON slots (turf_id);
CREATE INDEX IF NOT EXISTS idx_slots_is_available ON slots (is_available);
CREATE INDEX IF NOT EXISTS idx_slots_date ON slots (date);
