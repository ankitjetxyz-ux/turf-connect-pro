-- Tournament System Updates
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS turf_id uuid REFERENCES turfs(id);
CREATE INDEX IF NOT EXISTS idx_tournaments_turf_id ON tournaments(turf_id);
