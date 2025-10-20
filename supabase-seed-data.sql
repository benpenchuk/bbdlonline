-- =====================================================
-- BBDL Initial Data Seeding Script
-- =====================================================
-- Run this AFTER running supabase-schema.sql
-- This will populate your database with the initial mock data

-- =====================================================
-- SEED TEAMS
-- =====================================================
INSERT INTO teams (id, name, color, icon, wins, losses, total_points, games_played, players) VALUES
  ('team-1', 'Backdoor Bandits', '#3B82F6', 'skull', 0, 0, 0, 0, ARRAY['player-1', 'player-2']),
  ('team-2', 'Griers Fishy Autistic Clumpy Discharge', '#EF4444', 'waves', 0, 0, 0, 0, ARRAY['player-3', 'player-4']),
  ('team-3', 'Little Red Rockets', '#06B6D4', 'rocket', 0, 0, 0, 0, ARRAY['player-5', 'player-6']),
  ('team-4', 'Stim Lords', '#8B5CF6', 'crown', 0, 0, 0, 0, ARRAY['player-7', 'player-8']),
  ('team-5', 'Hitler Youth', '#F59E0B', 'flame', 0, 0, 0, 0, ARRAY['player-9', 'player-10']),
  ('team-6', 'The Pants Party', '#6B7280', 'beer', 0, 0, 0, 0, ARRAY['player-11', 'player-12']),
  ('team-7', 'Wam', '#FBBF24', 'zap', 0, 0, 0, 0, ARRAY['player-13', 'player-14']),
  ('team-8', 'Peas n Pickles', '#10B981', 'heart', 0, 0, 0, 0, ARRAY['player-15', 'player-16'])
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- SEED PLAYERS
-- =====================================================
INSERT INTO players (id, name, team_id, bio, photo_url, stats) VALUES
  ('player-1', 'Tate Booch', 'team-1', 'Once arm-wrestled a cactus and lost. The cactus cheated.', '/images/players/Tate Booch.png', '{"wins":0,"losses":0,"gamesPlayed":0,"totalPoints":0,"averagePoints":0,"shutouts":0,"blowoutWins":0,"clutchWins":0,"longestWinStreak":0,"currentWinStreak":0}'::jsonb),
  ('player-2', 'Diddy', 'team-1', 'Claims to have invented the color blue. We have our doubts.', '/images/players/Diddy.png', '{"wins":0,"losses":0,"gamesPlayed":0,"totalPoints":0,"averagePoints":0,"shutouts":0,"blowoutWins":0,"clutchWins":0,"longestWinStreak":0,"currentWinStreak":0}'::jsonb),
  ('player-3', 'Donald Trump', 'team-2', 'Thinks ''HTML'' is a type of sandwich. A tremendous sandwich, the best.', '/images/players/Donald Trump.png', '{"wins":0,"losses":0,"gamesPlayed":0,"totalPoints":0,"averagePoints":0,"shutouts":0,"blowoutWins":0,"clutchWins":0,"longestWinStreak":0,"currentWinStreak":0}'::jsonb),
  ('player-4', 'Yancy Longin', 'team-2', 'His spirit animal is a slightly confused pigeon.', '/images/players/Yancy Longin.png', '{"wins":0,"losses":0,"gamesPlayed":0,"totalPoints":0,"averagePoints":0,"shutouts":0,"blowoutWins":0,"clutchWins":0,"longestWinStreak":0,"currentWinStreak":0}'::jsonb),
  ('player-5', 'Kamala Harris', 'team-3', 'Laughs at her own jokes, which is good because no one else does.', '/images/players/Kamala Harris.png', '{"wins":0,"losses":0,"gamesPlayed":0,"totalPoints":0,"averagePoints":0,"shutouts":0,"blowoutWins":0,"clutchWins":0,"longestWinStreak":0,"currentWinStreak":0}'::jsonb),
  ('player-6', 'Noah Biggers', 'team-3', 'Has a pet rock named ''Dwayne''. They have deep conversations.', '/images/players/Noah Biggers.jpg', '{"wins":0,"losses":0,"gamesPlayed":0,"totalPoints":0,"averagePoints":0,"shutouts":0,"blowoutWins":0,"clutchWins":0,"longestWinStreak":0,"currentWinStreak":0}'::jsonb),
  ('player-7', 'Craig Brandstetter', 'team-4', 'Believes that pineapple on pizza is a war crime, and he''s willing to die on that hill.', '/images/players/Craig Brandstetter.png', '{"wins":0,"losses":0,"gamesPlayed":0,"totalPoints":0,"averagePoints":0,"shutouts":0,"blowoutWins":0,"clutchWins":0,"longestWinStreak":0,"currentWinStreak":0}'::jsonb),
  ('player-8', 'Mason Esworthy', 'team-4', 'Still uses a flip phone. Unironically.', '/images/players/Mason Esworthy.png', '{"wins":0,"losses":0,"gamesPlayed":0,"totalPoints":0,"averagePoints":0,"shutouts":0,"blowoutWins":0,"clutchWins":0,"longestWinStreak":0,"currentWinStreak":0}'::jsonb),
  ('player-9', 'George Washington', 'team-5', 'Wooden teeth? Please. These are artisanal, small-batch, gluten-free dentures.', '/images/players/George Washington.png', '{"wins":0,"losses":0,"gamesPlayed":0,"totalPoints":0,"averagePoints":0,"shutouts":0,"blowoutWins":0,"clutchWins":0,"longestWinStreak":0,"currentWinStreak":0}'::jsonb),
  ('player-10', 'Evan Eisman', 'team-5', 'Convinced he''s a wizard, but his only trick is making beer disappear.', '/images/players/Evan Eisman.png', '{"wins":0,"losses":0,"gamesPlayed":0,"totalPoints":0,"averagePoints":0,"shutouts":0,"blowoutWins":0,"clutchWins":0,"longestWinStreak":0,"currentWinStreak":0}'::jsonb),
  ('player-11', 'Adam Carey', 'team-6', 'Wears socks with sandals and dares you to say something.', '/images/players/Adam Carey.png', '{"wins":0,"losses":0,"gamesPlayed":0,"totalPoints":0,"averagePoints":0,"shutouts":0,"blowoutWins":0,"clutchWins":0,"longestWinStreak":0,"currentWinStreak":0}'::jsonb),
  ('player-12', 'Ben Penchuk', 'team-6', 'Once tried to pay for a burrito with a half-eaten granola bar. The cashier was not amused.', '/images/players/Ben Penchuk.png', '{"wins":0,"losses":0,"gamesPlayed":0,"totalPoints":0,"averagePoints":0,"shutouts":0,"blowoutWins":0,"clutchWins":0,"longestWinStreak":0,"currentWinStreak":0}'::jsonb),
  ('player-13', 'Jack Silk', 'team-7', 'His secret talent is being able to parallel park a unicycle.', '/images/players/Jack Silk.png', '{"wins":0,"losses":0,"gamesPlayed":0,"totalPoints":0,"averagePoints":0,"shutouts":0,"blowoutWins":0,"clutchWins":0,"longestWinStreak":0,"currentWinStreak":0}'::jsonb),
  ('player-14', 'Colin Gross', 'team-7', 'Speaks fluent sarcasm and broken English.', '/images/players/Colin Gross.png', '{"wins":0,"losses":0,"gamesPlayed":0,"totalPoints":0,"averagePoints":0,"shutouts":0,"blowoutWins":0,"clutchWins":0,"longestWinStreak":0,"currentWinStreak":0}'::jsonb),
  ('player-15', 'John Ertel', 'team-8', 'Is currently in a staring contest with a garden gnome. It''s been three days.', '/images/players/John Ertel.png', '{"wins":0,"losses":0,"gamesPlayed":0,"totalPoints":0,"averagePoints":0,"shutouts":0,"blowoutWins":0,"clutchWins":0,"longestWinStreak":0,"currentWinStreak":0}'::jsonb),
  ('player-16', 'Matt Malarkey', 'team-8', 'His last name is not an invitation for shenanigans. Or is it?', '/images/players/Matt Malarkey.png', '{"wins":0,"losses":0,"gamesPlayed":0,"totalPoints":0,"averagePoints":0,"shutouts":0,"blowoutWins":0,"clutchWins":0,"longestWinStreak":0,"currentWinStreak":0}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- SEED ANNOUNCEMENTS
-- =====================================================
INSERT INTO announcements (id, title, content, date, important) VALUES
  ('1', 'Season Playoffs Starting Soon!', 'The playoff bracket will be announced next week. Top 8 teams qualify.', NOW() - INTERVAL '2 days', true),
  ('2', 'New Team Registration Open', 'Registration for the summer season is now open. Contact us for details.', NOW() - INTERVAL '5 days', false),
  ('3', 'League Meetup This Saturday', 'Join us for food, drinks, and casual games at the community center.', NOW() - INTERVAL '7 days', false)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Initial data seeded successfully!';
  RAISE NOTICE '📊 Seeded:';
  RAISE NOTICE '   - 8 Teams';
  RAISE NOTICE '   - 16 Players';
  RAISE NOTICE '   - 3 Announcements';
  RAISE NOTICE '';
  RAISE NOTICE '💡 Note: Games will be created through the admin panel';
  RAISE NOTICE '   or you can manually add them using INSERT statements';
END $$;


