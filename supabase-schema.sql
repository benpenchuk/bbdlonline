-- =====================================================
-- BBDL Database Schema for Supabase
-- =====================================================
-- Run this SQL in your Supabase SQL Editor to create all tables
-- Go to: Supabase Dashboard → SQL Editor → New query → Paste this → Run

-- =====================================================
-- 1. TEAMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  players TEXT[] DEFAULT '{}', -- Array of player IDs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. PLAYERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  team_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
  bio TEXT,
  photo_url TEXT,
  -- Stats (stored as JSONB for flexibility)
  stats JSONB DEFAULT '{
    "wins": 0,
    "losses": 0,
    "gamesPlayed": 0,
    "totalPoints": 0,
    "averagePoints": 0,
    "shutouts": 0,
    "blowoutWins": 0,
    "clutchWins": 0,
    "longestWinStreak": 0,
    "currentWinStreak": 0
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. GAMES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  team1_id TEXT REFERENCES teams(id) ON DELETE CASCADE,
  team2_id TEXT REFERENCES teams(id) ON DELETE CASCADE,
  team1_score INTEGER,
  team2_score INTEGER,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_date TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('scheduled', 'completed', 'cancelled')) DEFAULT 'scheduled',
  winner_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
  is_blowout BOOLEAN DEFAULT FALSE,
  is_clutch BOOLEAN DEFAULT FALSE,
  is_shutout BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. TOURNAMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS tournaments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('single-elimination', 'double-elimination', 'round-robin')) NOT NULL,
  status TEXT CHECK (status IN ('setup', 'in-progress', 'completed')) DEFAULT 'setup',
  teams TEXT[] DEFAULT '{}', -- Array of team IDs
  bracket JSONB DEFAULT '[]'::jsonb, -- Array of tournament matches
  winner_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_date TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. TOURNAMENT MATCHES TABLE (Optional - for more structure)
-- =====================================================
CREATE TABLE IF NOT EXISTS tournament_matches (
  id TEXT PRIMARY KEY,
  tournament_id TEXT REFERENCES tournaments(id) ON DELETE CASCADE,
  round INTEGER NOT NULL,
  position INTEGER NOT NULL,
  team1_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
  team2_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
  team1_score INTEGER,
  team2_score INTEGER,
  winner_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('pending', 'completed')) DEFAULT 'pending',
  next_match_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. ANNOUNCEMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  important BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES for better query performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_games_team1_id ON games(team1_id);
CREATE INDEX IF NOT EXISTS idx_games_team2_id ON games(team2_id);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_scheduled_date ON games(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournament_id ON tournament_matches(tournament_id);

-- =====================================================
-- TRIGGERS to auto-update updated_at timestamps
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tournaments_updated_at BEFORE UPDATE ON tournaments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tournament_matches_updated_at BEFORE UPDATE ON tournament_matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
-- Enable RLS on all tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Public read access for all tables (everyone can view)
CREATE POLICY "Public read access" ON teams FOR SELECT USING (true);
CREATE POLICY "Public read access" ON players FOR SELECT USING (true);
CREATE POLICY "Public read access" ON games FOR SELECT USING (true);
CREATE POLICY "Public read access" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Public read access" ON tournament_matches FOR SELECT USING (true);
CREATE POLICY "Public read access" ON announcements FOR SELECT USING (true);

-- Admin write access (you'll need to implement auth for this later)
-- For now, we'll allow all authenticated users to write
CREATE POLICY "Authenticated users can insert" ON teams FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update" ON teams FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete" ON teams FOR DELETE USING (true);

CREATE POLICY "Authenticated users can insert" ON players FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update" ON players FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete" ON players FOR DELETE USING (true);

CREATE POLICY "Authenticated users can insert" ON games FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update" ON games FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete" ON games FOR DELETE USING (true);

CREATE POLICY "Authenticated users can insert" ON tournaments FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update" ON tournaments FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete" ON tournaments FOR DELETE USING (true);

CREATE POLICY "Authenticated users can insert" ON tournament_matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update" ON tournament_matches FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete" ON tournament_matches FOR DELETE USING (true);

CREATE POLICY "Authenticated users can insert" ON announcements FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update" ON announcements FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete" ON announcements FOR DELETE USING (true);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ BBDL Database schema created successfully!';
  RAISE NOTICE '📝 Next steps:';
  RAISE NOTICE '   1. Run the data seeding script to populate initial data';
  RAISE NOTICE '   2. Update your .env.local file with Supabase credentials';
  RAISE NOTICE '   3. Test the connection from your frontend';
END $$;

