-- ============================================
-- OPTIMIZED DATABASE SCHEMA FOR TURF CONNECT PRO
-- Consolidates all migrations, removes redundancies
-- Production-ready schema - January 2026
-- ============================================

-- ============================================
-- 1. USERS TABLE
-- Core user accounts (players, clients, admins)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  role text NOT NULL CHECK (role IN ('player', 'client', 'admin')),
  phone text, -- User contact number
  profile_image_url text, -- Profile photo
  email_verified boolean DEFAULT false,
  email_verified_at timestamptz,
  failed_login_attempts integer DEFAULT 0, -- Used for account locking logic
  last_failed_login timestamptz, -- Tracks last failed login
  deleted_at timestamptz, -- Soft delete timestamp (actively checked in login)
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);

-- ============================================
-- 2. USER SESSIONS TABLE
-- JWT refresh token management
-- ============================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  user_agent text,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON user_sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON user_sessions(expires_at);

-- ============================================
-- 3. OTP VERIFICATIONS TABLE
-- Email verification & password reset OTPs
-- ============================================
CREATE TABLE IF NOT EXISTS otp_verifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  otp_hash text NOT NULL,
  purpose text NOT NULL CHECK (purpose IN ('email_verification', 'password_reset')),
  expires_at timestamptz NOT NULL,
  is_used boolean DEFAULT false,
  attempt_count integer DEFAULT 0,
  user_agent text,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_otp_email_purpose ON otp_verifications(email, purpose);
CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON otp_verifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_is_used ON otp_verifications(is_used);

-- ============================================
-- 4. TURFS TABLE
-- Turf ground listings by owners
-- ============================================
CREATE TABLE IF NOT EXISTS turfs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  location text NOT NULL,
  description text,
  price_per_slot numeric(10,2) NOT NULL,
  facilities text,
  images text[], -- Array of image URLs
  rating numeric(3,2) DEFAULT 0, -- Average rating (computed)
  reviews_count integer DEFAULT 0, -- Total reviews (computed)
  owner_phone text, -- Contact number for turf
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Indexes for search and filtering
CREATE INDEX IF NOT EXISTS idx_turfs_name ON turfs(name);
CREATE INDEX IF NOT EXISTS idx_turfs_location ON turfs(location);
CREATE INDEX IF NOT EXISTS idx_turfs_is_active ON turfs(is_active);
CREATE INDEX IF NOT EXISTS idx_turfs_owner_id ON turfs(owner_id);

-- ============================================
-- 5. SLOTS TABLE
-- Bookable time slots for turfs
-- ============================================
CREATE TABLE IF NOT EXISTS slots (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  turf_id uuid NOT NULL REFERENCES turfs(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  price numeric(10,2) NOT NULL,
  is_booked boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_slots_turf_date ON slots(turf_id, date);
CREATE INDEX IF NOT EXISTS idx_slots_is_booked ON slots(is_booked);

-- ============================================
-- 6. BOOKINGS TABLE
-- Slot bookings by users
-- ============================================
CREATE TABLE IF NOT EXISTS bookings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slot_id uuid REFERENCES slots(id),
  turf_id uuid REFERENCES turfs(id), -- Direct reference for easier queries
  booking_date date NOT NULL DEFAULT CURRENT_DATE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  total_amount numeric(10,2) NOT NULL,
  razorpay_order_id text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_turf ON bookings(turf_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_razorpay_order_id ON bookings(razorpay_order_id);

-- ============================================
-- 7. BOOKING VERIFICATION CODES TABLE
-- Entry verification codes for bookings
-- ============================================
CREATE TABLE IF NOT EXISTS booking_verification_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES tournament_participants(id) ON DELETE CASCADE,
  slot_id uuid REFERENCES slots(id) ON DELETE SET NULL,
  booking_type text NOT NULL CHECK (booking_type IN ('turf', 'tournament')),
  verification_code text NOT NULL,
  expires_at timestamptz NOT NULL,
  is_verified boolean DEFAULT false,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_codes_booking ON booking_verification_codes(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_codes_participant ON booking_verification_codes(participant_id);
CREATE INDEX IF NOT EXISTS idx_booking_codes_code ON booking_verification_codes(verification_code);

-- ============================================
-- 8. PAYMENTS TABLE
-- Razorpay payment records
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_ids uuid[], -- Array of booking IDs (flexible for multi-booking)
  turf_id uuid REFERENCES turfs(id), -- Turf owner reference
  user_id uuid REFERENCES users(id), -- Paying user
  payer_id uuid REFERENCES users(id), -- Alias for user_id (used in bookingController)
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'INR',
  status text DEFAULT 'pending', -- Standardized status field
  razorpay_payment_id text,
  razorpay_order_id text,
  razorpay_signature text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_turf ON payments(turf_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order_id ON payments(razorpay_order_id);

-- ============================================
-- 9. REVIEWS TABLE
-- User reviews for turfs
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  turf_id uuid NOT NULL REFERENCES turfs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  booking_id uuid REFERENCES bookings(id), -- Optional: link to specific booking
  rating integer CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_turf ON reviews(turf_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);

-- ============================================
-- 10. TOURNAMENTS TABLE
-- Sports tournaments hosted at turfs
-- ============================================
CREATE TABLE IF NOT EXISTS tournaments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  turf_id uuid NOT NULL REFERENCES turfs(id) ON DELETE CASCADE,
  name text NOT NULL,
  sport text NOT NULL,
  date date NOT NULL,
  time time NOT NULL,
  start_date date,
  end_date date,
  city text,
  location text,
  entry_fee numeric(10,2) NOT NULL,
  prize_pool numeric(10,2),
  max_teams integer,
  spots_left integer,
  image text,
  description text,
  status text DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tournaments_turf ON tournaments(turf_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_date ON tournaments(date);
CREATE INDEX IF NOT EXISTS idx_tournaments_city ON tournaments(city);

-- ============================================
-- 11. TOURNAMENT PARTICIPANTS TABLE
-- Team registrations for tournaments
-- ============================================
CREATE TABLE IF NOT EXISTS tournament_participants (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  team_name text,
  team_members text[], -- Array of team member names
  leader_contact_phone text, -- Team leader's contact
  status text DEFAULT 'registered',
  payment_status text DEFAULT 'pending',
  razorpay_order_id text,
  razorpay_payment_id text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament ON tournament_participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_user ON tournament_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_status ON tournament_participants(status);

-- ============================================
-- 12. CHATS TABLE
-- Player ↔ Turf Owner chat threads
-- ============================================
CREATE TABLE IF NOT EXISTS chats (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES users(id),
  player_id uuid NOT NULL REFERENCES users(id),
  last_message text,
  related_booking_id uuid REFERENCES bookings(id),
  is_favorite boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  auto_delete_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(owner_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_chats_participants ON chats(owner_id, player_id);
CREATE INDEX IF NOT EXISTS idx_chats_owner ON chats(owner_id);
CREATE INDEX IF NOT EXISTS idx_chats_player ON chats(player_id);

-- ============================================
-- 13. MESSAGES TABLE
-- Individual chat messages
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id uuid NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES users(id),
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

-- ============================================
-- 14. EARNINGS TABLE
-- Revenue tracking for owners and admin
-- ============================================
CREATE TABLE IF NOT EXISTS earnings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id uuid NOT NULL, -- User ID (admin or owner)
  entity_type text NOT NULL CHECK (entity_type IN ('admin', 'owner')),
  amount numeric(12,2) NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(entity_id, entity_type)
);

CREATE INDEX IF NOT EXISTS idx_earnings_entity ON earnings(entity_id, entity_type);

-- ============================================
-- 15. CONTACT MESSAGES TABLE
-- Contact form submissions
-- ============================================
CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  name text NOT NULL,
  email text NOT NULL,
  subject text,
  message text NOT NULL,
  admin_email text DEFAULT 'bookmyturfofficial@gmail.com',
  status text DEFAULT 'unread',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_user ON contact_messages(user_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Increment earnings safely (upsert pattern)
CREATE OR REPLACE FUNCTION increment_earning(p_entity_id uuid, p_entity_type text, p_amount numeric)
RETURNS void AS $$
BEGIN
  INSERT INTO earnings (entity_id, entity_type, amount, updated_at)
  VALUES (p_entity_id, p_entity_type, p_amount, now())
  ON CONFLICT (entity_id, entity_type)
  DO UPDATE SET amount = earnings.amount + p_amount, updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Clean up expired OTPs (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM otp_verifications 
  WHERE expires_at < now() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM user_sessions 
  WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Update turf rating and review count
CREATE OR REPLACE FUNCTION update_turf_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE turfs
  SET 
    rating = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE turf_id = NEW.turf_id),
    reviews_count = (SELECT COUNT(*) FROM reviews WHERE turf_id = NEW.turf_id)
  WHERE id = NEW.turf_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update turf rating on review insert/update
CREATE TRIGGER trigger_update_turf_rating
AFTER INSERT OR UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_turf_rating();

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role, anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role, anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role, anon;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON TABLE users IS 'Core user accounts for players, turf owners, and admins';
COMMENT ON TABLE user_sessions IS 'JWT refresh tokens for long-lived user sessions';
COMMENT ON TABLE otp_verifications IS 'Hashed OTPs for email verification and password reset';
COMMENT ON TABLE turfs IS 'Turf ground listings with computed rating and review counts';
COMMENT ON TABLE slots IS 'Bookable time slots for each turf';
COMMENT ON TABLE bookings IS 'Turf booking records with payment tracking';
COMMENT ON TABLE booking_verification_codes IS '6-digit verification codes for entry confirmation';
COMMENT ON TABLE payments IS 'Razorpay payment transaction records';
COMMENT ON TABLE reviews IS 'User reviews and ratings for turfs';
COMMENT ON TABLE tournaments IS 'Sports tournaments hosted at turfs';
COMMENT ON TABLE tournament_participants IS 'Team registrations for tournaments';
COMMENT ON TABLE chats IS 'Chat threads between players and turf owners';
COMMENT ON TABLE messages IS 'Individual messages within chat threads';
COMMENT ON TABLE earnings IS 'Revenue tracking for turf owners and platform admin';
COMMENT ON TABLE contact_messages IS 'Contact form submissions from users';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
SELECT 'Optimized schema created successfully! ✅' as message;
