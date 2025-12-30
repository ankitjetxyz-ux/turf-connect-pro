-- Ensure tournaments table has city and location columns used by the API and frontend
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS location text;
