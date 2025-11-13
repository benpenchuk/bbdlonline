-- Create photos table for league photos and featured images
CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  game_id UUID REFERENCES games(id) ON DELETE SET NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  is_featured BOOLEAN DEFAULT false,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for featured photos by season
CREATE INDEX IF NOT EXISTS idx_photos_season_featured 
ON photos(season_id, is_featured);

-- Create index for photos by game
CREATE INDEX IF NOT EXISTS idx_photos_game 
ON photos(game_id);

-- Enable RLS
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read photos
CREATE POLICY "Allow public read access to photos"
ON photos FOR SELECT
USING (true);

-- Allow authenticated users to insert/update/delete (for admin)
CREATE POLICY "Allow authenticated users to manage photos"
ON photos FOR ALL
USING (auth.role() = 'authenticated');

