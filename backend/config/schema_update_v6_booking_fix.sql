-- Schema Update v6: Fix Booking System Dependencies
-- Ensures all necessary columns exist for multi-slot booking and cancellation logic

-- 1. Payments Table: Support for Multi-slot and Owner Tracking
ALTER TABLE payments ADD COLUMN IF NOT EXISTS booking_ids uuid[];
ALTER TABLE payments ADD COLUMN IF NOT EXISTS turf_id uuid; -- Used to store Owner ID in current logic
ALTER TABLE payments ALTER COLUMN booking_id DROP NOT NULL; -- Allow null if booking_ids is used (though current logic populates both)

-- 2. Bookings Table: Support for Razorpay Order Linking
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS razorpay_order_id text;
CREATE INDEX IF NOT EXISTS idx_bookings_razorpay_order_id ON bookings(razorpay_order_id);

-- 3. Earnings Table: Ensure it exists for Admin/Owner Fee splits
CREATE TABLE IF NOT EXISTS earnings (
  id uuid default gen_random_uuid() primary key,
  entity_id uuid not null, -- admin account or owner id
  entity_type text not null, -- 'admin' or 'owner'
  amount numeric(12,2) not null default 0,
  updated_at timestamptz default now()
);

CREATE INDEX IF NOT EXISTS idx_earnings_entity ON earnings(entity_id, entity_type);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'earnings_entity_id_entity_type_key') THEN
    ALTER TABLE earnings ADD CONSTRAINT earnings_entity_id_entity_type_key UNIQUE (entity_id, entity_type);
  END IF;
END $$;

-- 4. Function for Earnings Increment (Safe Upsert)
CREATE OR REPLACE FUNCTION increment_earning(p_entity_id uuid, p_entity_type text, p_amount numeric)
RETURNS void AS $$
BEGIN
  INSERT INTO earnings (entity_id, entity_type, amount, updated_at)
  VALUES (p_entity_id, p_entity_type, p_amount, now())
  ON CONFLICT (entity_id, entity_type)
  DO UPDATE SET amount = earnings.amount + excluded.amount, updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- 5. Chats Table: Ensure indexes for performance
CREATE INDEX IF NOT EXISTS idx_chats_owner_player ON chats(owner_id, player_id);
