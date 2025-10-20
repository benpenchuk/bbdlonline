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
    const { data, error } = await supabase.from('teams').select('count').single();
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
  TEAMS: 'teams',
  PLAYERS: 'players',
  GAMES: 'games',
  TOURNAMENTS: 'tournaments',
  TOURNAMENT_MATCHES: 'tournament_matches',
  ANNOUNCEMENTS: 'announcements',
} as const;


