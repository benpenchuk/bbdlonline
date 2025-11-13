import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in .env.local');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Helper function to check connection
export const testSupabaseConnection = async () => {
  try {
    const { error } = await supabase.from('teams').select('count').single();
    if (error) throw error;
    console.log('✅ Supabase connection successful!');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    return false;
  }
};

// Database table names (for type safety)
export const TABLES = {
  PLAYERS: 'players',
  TEAMS: 'teams',
  SEASONS: 'seasons',
  PLAYER_TEAMS: 'player_teams',
  GAMES: 'games',
  PLAYER_GAME_STATS: 'player_game_stats',
  PLAYER_SEASON_STATS: 'player_season_stats',
  TEAM_SEASON_STATS: 'team_season_stats',
  PLAYOFFS: 'playoffs',
  ANNOUNCEMENTS: 'announcements',
  PHOTOS: 'photos',
} as const;


