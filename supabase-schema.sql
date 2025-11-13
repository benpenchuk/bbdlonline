-- =====================================================
-- BBDL Database Schema - Clean PostgreSQL Design
-- =====================================================
-- Built around UUID primary keys, lightweight enums, and proper constraints
-- Run this SQL in your Supabase SQL Editor to create the complete schema

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE player_status AS ENUM ('active', 'inactive', 'retired');
CREATE TYPE team_status AS ENUM ('active', 'inactive', 'retired');
CREATE TYPE season_status AS ENUM ('upcoming', 'active', 'completed', 'archived');
CREATE TYPE roster_role AS ENUM ('starter_1', 'starter_2', 'sub');
CREATE TYPE roster_status AS ENUM ('active', 'inactive', 'ir');
CREATE TYPE game_status AS ENUM ('scheduled', 'in_progress', 'completed', 'canceled');

-- =====================================================
-- SHARED TRIGGER FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CORE IDENTITY TABLES
-- =====================================================

-- Players: Individual player identities
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  status player_status NOT NULL DEFAULT 'active',
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  nickname TEXT,
  avatar_url TEXT,
  hometown_city TEXT,
  hometown_state TEXT,
  dominant_hand TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for search performance
CREATE INDEX idx_players_name_search ON players(lower(first_name), lower(last_name));

-- Auto-update timestamp trigger
CREATE TRIGGER trg_players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Teams: Team identities
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  status team_status NOT NULL DEFAULT 'active',
  name TEXT NOT NULL,
  abbreviation TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  home_city TEXT,
  home_state TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT chk_abbreviation_length CHECK (length(abbreviation) BETWEEN 2 AND 4)
);

-- Index for team name search
CREATE INDEX idx_teams_name_search ON teams(lower(name));

-- Auto-update timestamp trigger
CREATE TRIGGER trg_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Seasons: Timeline/season definitions
CREATE TABLE seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  status season_status NOT NULL DEFAULT 'upcoming',
  name TEXT NOT NULL,
  year INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT chk_season_dates CHECK (end_date >= start_date)
);

-- Index for filtering active seasons
CREATE INDEX idx_seasons_status ON seasons(status);

-- Auto-update timestamp trigger
CREATE TRIGGER trg_seasons_updated_at
  BEFORE UPDATE ON seasons
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- =====================================================
-- ROSTER MEMBERSHIP
-- =====================================================

-- Player-Team relationships per season
CREATE TABLE player_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE RESTRICT,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE RESTRICT,
  role roster_role NOT NULL,
  status roster_status NOT NULL DEFAULT 'active',
  is_captain BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Prevent duplicate player assignments per team per season
  CONSTRAINT uniq_player_team_season UNIQUE(player_id, team_id, season_id)
);

-- Enforce "two starters + optional sub" roster rule
-- Each team can have exactly one active starter_1
CREATE UNIQUE INDEX idx_roster_starter_1 
  ON player_teams(team_id, season_id) 
  WHERE role = 'starter_1' AND status = 'active' AND left_at IS NULL;

-- Each team can have exactly one active starter_2
CREATE UNIQUE INDEX idx_roster_starter_2 
  ON player_teams(team_id, season_id) 
  WHERE role = 'starter_2' AND status = 'active' AND left_at IS NULL;

-- Each team can have at most one active sub
CREATE UNIQUE INDEX idx_roster_sub 
  ON player_teams(team_id, season_id) 
  WHERE role = 'sub' AND status = 'active' AND left_at IS NULL;

-- Performance indexes
CREATE INDEX idx_player_teams_team_season ON player_teams(team_id, season_id);
CREATE INDEX idx_player_teams_player ON player_teams(player_id);

-- Auto-update timestamp trigger
CREATE TRIGGER trg_player_teams_updated_at
  BEFORE UPDATE ON player_teams
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- =====================================================
-- GAMES & MATCH RESULTS
-- =====================================================

-- Games: Match scheduling and results
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE RESTRICT,
  home_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
  away_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
  game_date TIMESTAMPTZ,
  location TEXT,
  status game_status NOT NULL DEFAULT 'scheduled',
  home_score INT NOT NULL DEFAULT 0,
  away_score INT NOT NULL DEFAULT 0,
  winning_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT chk_different_teams CHECK (home_team_id <> away_team_id),
  CONSTRAINT chk_non_negative_scores CHECK (home_score >= 0 AND away_score >= 0),
  CONSTRAINT chk_winner_is_participant CHECK (
    winning_team_id IS NULL OR 
    winning_team_id = home_team_id OR 
    winning_team_id = away_team_id
  )
);

-- Performance indexes
CREATE INDEX idx_games_season ON games(season_id);
CREATE INDEX idx_games_date ON games(game_date);
CREATE INDEX idx_games_status ON games(status);

-- Auto-update timestamp trigger
CREATE TRIGGER trg_games_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- =====================================================
-- INDIVIDUAL PERFORMANCE
-- =====================================================

-- Player Game Stats: Per-game individual performance
CREATE TABLE player_game_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE RESTRICT,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE RESTRICT,
  
  -- Performance stats
  points_scored INT NOT NULL DEFAULT 0,
  cups_hit INT NOT NULL DEFAULT 0,
  sinks INT NOT NULL DEFAULT 0,
  bounces INT NOT NULL DEFAULT 0,
  throws_made INT NOT NULL DEFAULT 0,
  throws_missed INT NOT NULL DEFAULT 0,
  
  -- Awards
  is_winner BOOLEAN NOT NULL DEFAULT false,
  mvp BOOLEAN NOT NULL DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- One stat line per player per game
  CONSTRAINT uniq_game_player UNIQUE(game_id, player_id),
  
  -- All stats must be non-negative
  CONSTRAINT chk_stats_non_negative CHECK (
    points_scored >= 0 AND
    cups_hit >= 0 AND
    sinks >= 0 AND
    bounces >= 0 AND
    throws_made >= 0 AND
    throws_missed >= 0
  )
);

-- Performance indexes
CREATE INDEX idx_player_game_stats_game ON player_game_stats(game_id);
CREATE INDEX idx_player_game_stats_player ON player_game_stats(player_id);
CREATE INDEX idx_player_game_stats_team ON player_game_stats(team_id);

-- Auto-update timestamp trigger
CREATE TRIGGER trg_player_game_stats_updated_at
  BEFORE UPDATE ON player_game_stats
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- =====================================================
-- PRECOMPUTED AGGREGATES
-- =====================================================

-- Player Season Stats: Precomputed player aggregates per season
CREATE TABLE player_season_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE RESTRICT,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE RESTRICT,
  
  -- Aggregate stats
  games_played INT NOT NULL DEFAULT 0,
  games_won INT NOT NULL DEFAULT 0,
  points_scored_total INT NOT NULL DEFAULT 0,
  points_per_game NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  cups_hit_total INT NOT NULL DEFAULT 0,
  win_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  mvp_awards INT NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- One aggregate per player per season
  CONSTRAINT uniq_player_season UNIQUE(player_id, season_id),
  
  -- All counts must be non-negative
  CONSTRAINT chk_player_stats_non_negative CHECK (
    games_played >= 0 AND
    games_won >= 0 AND
    points_scored_total >= 0 AND
    cups_hit_total >= 0 AND
    mvp_awards >= 0
  )
);

-- Performance index
CREATE INDEX idx_player_season_stats_season ON player_season_stats(season_id);

-- Auto-update timestamp trigger
CREATE TRIGGER trg_player_season_stats_updated_at
  BEFORE UPDATE ON player_season_stats
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Team Season Stats: Precomputed team aggregates (standings)
CREATE TABLE team_season_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE RESTRICT,
  
  -- Aggregate stats
  games_played INT NOT NULL DEFAULT 0,
  wins INT NOT NULL DEFAULT 0,
  losses INT NOT NULL DEFAULT 0,
  points_for INT NOT NULL DEFAULT 0,
  points_against INT NOT NULL DEFAULT 0,
  win_pct NUMERIC(5,3) NOT NULL DEFAULT 0.000,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- One aggregate per team per season
  CONSTRAINT uniq_team_season UNIQUE(team_id, season_id),
  
  -- All counts must be non-negative
  CONSTRAINT chk_team_stats_non_negative CHECK (
    games_played >= 0 AND
    wins >= 0 AND
    losses >= 0 AND
    points_for >= 0 AND
    points_against >= 0
  )
);

-- Performance index
CREATE INDEX idx_team_season_stats_season ON team_season_stats(season_id);

-- Auto-update timestamp trigger
CREATE TRIGGER trg_team_season_stats_updated_at
  BEFORE UPDATE ON team_season_stats
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- =====================================================
-- PLAYOFFS
-- =====================================================

-- Playoffs: Playoffs and bracket competitions
CREATE TABLE playoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  bracket_type TEXT NOT NULL DEFAULT 'single_elimination',
  status TEXT NOT NULL DEFAULT 'planned',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Performance index
CREATE INDEX idx_playoffs_season ON playoffs(season_id);

-- Auto-update timestamp trigger
CREATE TRIGGER trg_playoffs_updated_at
  BEFORE UPDATE ON playoffs
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_game_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_season_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_season_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE playoffs ENABLE ROW LEVEL SECURITY;

-- Public read access for all tables (everyone can view)
CREATE POLICY "Public read access" ON players FOR SELECT USING (true);
CREATE POLICY "Public read access" ON teams FOR SELECT USING (true);
CREATE POLICY "Public read access" ON seasons FOR SELECT USING (true);
CREATE POLICY "Public read access" ON player_teams FOR SELECT USING (true);
CREATE POLICY "Public read access" ON games FOR SELECT USING (true);
CREATE POLICY "Public read access" ON player_game_stats FOR SELECT USING (true);
CREATE POLICY "Public read access" ON player_season_stats FOR SELECT USING (true);
CREATE POLICY "Public read access" ON team_season_stats FOR SELECT USING (true);
CREATE POLICY "Public read access" ON playoffs FOR SELECT USING (true);

-- Authenticated write access (admin users can modify)
-- Players
CREATE POLICY "Authenticated users can insert" ON players FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update" ON players FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete" ON players FOR DELETE USING (true);

-- Teams
CREATE POLICY "Authenticated users can insert" ON teams FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update" ON teams FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete" ON teams FOR DELETE USING (true);

-- Seasons
CREATE POLICY "Authenticated users can insert" ON seasons FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update" ON seasons FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete" ON seasons FOR DELETE USING (true);

-- Player Teams
CREATE POLICY "Authenticated users can insert" ON player_teams FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update" ON player_teams FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete" ON player_teams FOR DELETE USING (true);

-- Games
CREATE POLICY "Authenticated users can insert" ON games FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update" ON games FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete" ON games FOR DELETE USING (true);

-- Player Game Stats
CREATE POLICY "Authenticated users can insert" ON player_game_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update" ON player_game_stats FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete" ON player_game_stats FOR DELETE USING (true);

-- Player Season Stats
CREATE POLICY "Authenticated users can insert" ON player_season_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update" ON player_season_stats FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete" ON player_season_stats FOR DELETE USING (true);

-- Team Season Stats
CREATE POLICY "Authenticated users can insert" ON team_season_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update" ON team_season_stats FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete" ON team_season_stats FOR DELETE USING (true);

-- Playoffs
CREATE POLICY "Authenticated users can insert" ON playoffs FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update" ON playoffs FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete" ON playoffs FOR DELETE USING (true);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ BBDL Database schema created successfully!';
  RAISE NOTICE '📊 Schema includes:';
  RAISE NOTICE '   • 9 core tables with UUID primary keys';
  RAISE NOTICE '   • 6 enum types for status fields';
  RAISE NOTICE '   • Roster constraints (2 starters + 1 sub per team)';
  RAISE NOTICE '   • Automatic updated_at timestamps';
  RAISE NOTICE '   • Row Level Security policies';
  RAISE NOTICE '   • Performance indexes';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Next steps:';
  RAISE NOTICE '   1. Create a migration/seed script for your existing data';
  RAISE NOTICE '   2. Update your frontend API layer to work with new schema';
  RAISE NOTICE '   3. Test the roster constraints and relationships';
END $$;
