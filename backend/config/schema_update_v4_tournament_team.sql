-- Tournament Participants Update
ALTER TABLE tournament_participants ADD COLUMN IF NOT EXISTS team_name text;
ALTER TABLE tournament_participants ADD COLUMN IF NOT EXISTS team_members text[]; -- Array of player names
