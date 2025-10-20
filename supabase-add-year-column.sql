-- Add 'year' column to players table
-- Run this in Supabase SQL Editor

ALTER TABLE players 
ADD COLUMN IF NOT EXISTS year TEXT 
CHECK (year IN ('freshman', 'sophomore', 'junior', 'senior', 'alumni'));

-- Add comment
COMMENT ON COLUMN players.year IS 'Player academic year or alumni status';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Successfully added year column to players table!';
  RAISE NOTICE 'Valid values: freshman, sophomore, junior, senior, alumni';
END $$;

