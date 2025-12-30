-- Search Optimization Indexes

-- Turfs
CREATE INDEX IF NOT EXISTS idx_turfs_name ON turfs(name);
CREATE INDEX IF NOT EXISTS idx_turfs_facilities ON turfs(facilities); -- For keyword search

-- Tournaments
CREATE INDEX IF NOT EXISTS idx_tournaments_date ON tournaments(date);
CREATE INDEX IF NOT EXISTS idx_tournaments_name ON tournaments(name);
CREATE INDEX IF NOT EXISTS idx_tournaments_sport ON tournaments(sport);
CREATE INDEX IF NOT EXISTS idx_tournaments_city ON tournaments(city);
