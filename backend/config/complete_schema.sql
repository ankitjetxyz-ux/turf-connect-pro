-- COMPLETE SCHEMA SETUP
-- Run this in Supabase SQL Editor to fix all table issues.

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  role text NOT NULL CHECK (role IN ('player', 'client', 'admin')),
  created_at timestamptz DEFAULT now()
);

-- 2. TURFS TABLE
CREATE TABLE IF NOT EXISTS turfs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  location text NOT NULL,
  description text,
  price_per_slot numeric(10,2) NOT NULL,
  facilities text,
  images text[],
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Indexes for Search
CREATE INDEX IF NOT EXISTS idx_turfs_name ON turfs(name);
CREATE INDEX IF NOT EXISTS idx_turfs_location ON turfs(location);
CREATE INDEX IF NOT EXISTS idx_turfs_is_active ON turfs(is_active);

-- 3. SLOTS TABLE
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

-- 4. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS bookings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slot_id uuid REFERENCES slots(id), -- Nullable if using multi-slot logic elsewhere, but usually linked
  booking_date date NOT NULL DEFAULT CURRENT_DATE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  total_amount numeric(10,2) NOT NULL,
  razorpay_order_id text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_razorpay_order_id ON bookings(razorpay_order_id);

-- 5. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid REFERENCES bookings(id), -- Can be null if multi-booking
  booking_ids uuid[], -- Array of booking IDs
  turf_id uuid REFERENCES users(id), -- Owner ID
  user_id uuid REFERENCES users(id),
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'INR',

  razorpay_payment_id text,
  razorpay_order_id text,
  razorpay_signature text,
  created_at timestamptz DEFAULT now()
);

-- 6. CHATS TABLE
CREATE TABLE IF NOT EXISTS chats (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES users(id),
  player_id uuid NOT NULL REFERENCES users(id),
  last_message text,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(owner_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_chats_participants ON chats(owner_id, player_id);

-- 7. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id uuid NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES users(id),
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  is_read boolean DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_id);

-- 8. TOURNAMENTS TABLE
CREATE TABLE IF NOT EXISTS tournaments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  turf_id uuid NOT NULL REFERENCES turfs(id) ON DELETE CASCADE, -- Links to Turf
  name text NOT NULL,
  sport text NOT NULL,
  date date NOT NULL,
  time time NOT NULL,
  city text,
  location text,
  entry_fee numeric(10,2) NOT NULL,
  prize_pool numeric(10,2),
  max_teams integer,
  spots_left integer,
  image text,
  description text,
  status text DEFAULT 'upcoming', -- upcoming, ongoing, completed
  created_at timestamptz DEFAULT now()
);

-- 9. TOURNAMENT PARTICIPANTS
CREATE TABLE IF NOT EXISTS tournament_participants (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  team_name text,
  team_members text[], -- Array of names
  status text DEFAULT 'registered',
  payment_status text DEFAULT 'pending',

  created_at timestamptz DEFAULT now()
);

-- 10. EARNINGS TABLE
CREATE TABLE IF NOT EXISTS earnings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id uuid NOT NULL, -- admin or owner ID
  entity_type text NOT NULL, -- 'admin' or 'owner'
  amount numeric(12,2) NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(entity_id, entity_type)
);

-- 11. CONTACT MESSAGES
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

-- 12. REVIEWS (Optional but good to have)
CREATE TABLE IF NOT EXISTS reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  turf_id uuid NOT NULL REFERENCES turfs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  rating integer CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

-- Function to increment earnings safely
CREATE OR REPLACE FUNCTION increment_earning(p_entity_id uuid, p_entity_type text, p_amount numeric)
RETURNS void AS $$
BEGIN
  INSERT INTO earnings (entity_id, entity_type, amount, updated_at)
  VALUES (p_entity_id, p_entity_type, p_amount, now())
  ON CONFLICT (entity_id, entity_type)
  DO UPDATE SET amount = earnings.amount + excluded.amount, updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (if needed, though usually service_role has full access)
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role;
