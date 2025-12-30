-- Tournament participants payment metadata
ALTER TABLE tournament_participants
  ADD COLUMN IF NOT EXISTS razorpay_order_id text;