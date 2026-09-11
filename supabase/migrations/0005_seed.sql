-- =============================================================
-- 0005 — Bootstrap + demo data
--
-- A superadmin cannot be seeded outright: a person row only binds to an
-- account at first login, via the handle_new_auth_user trigger in 0001.
-- So Ben gets a person row marked superadmin plus an invite pre-linked to
-- it, and his first magic link attaches the account to that exact row
-- instead of creating a duplicate.
--
-- Everything below the season is demo data for development. Delete it
-- before the first real season.
-- =============================================================

insert into public.people (first_name, last_name, slug, email, site_role, league_status) values
  ('Ben',   'Penchuk',      'ben-penchuk',       'ben@penchuk.com', 'superadmin',   'player'),
  ('Jack',  'Silk',         'jack-silk',          null,             'commissioner', 'player'),
  ('Adam',  'Carey',        'adam-carey',         null,             'member',       'player'),
  ('Colin', 'Gross',        'colin-gross',        null,             'member',       'player'),
  ('Craig', 'Brandstetter', 'craig-brandstetter', null,             'member',       'player'),
  ('Mason', 'Esworthy',     'mason-esworthy',     null,             'member',       'player'),
  ('Evan',  'Eisman',       'evan-eisman',        null,             'member',       'player'),
  ('John',  'Ertel',        'john-ertel',         null,             'member',       'player');

-- Long and random because invite_code_valid() is reachable by anon and is
-- therefore an enumeration oracle. Never use a guessable code.
insert into public.invites (code, email, person_id, grants_role, grants_status, max_uses)
select 'bbdl-' || encode(gen_random_bytes(12), 'hex'),
       'ben@penchuk.com', id, 'superadmin', 'player', 1
  from public.people where slug = 'ben-penchuk';

insert into public.seasons (slug, name, year, term, status, regular_weeks, start_date, end_date)
values ('fall-2026', 'Fall 2026', 2026, 'fall', 'active', 6, '2026-09-01', '2026-10-15');

insert into public.teams (season_id, name, slug, abbreviation, approved)
select s.id, v.name, v.slug, v.abbr, true
  from public.seasons s,
       (values ('Dye Hard','dye-hard','DYE'), ('Cup Check','cup-check','CUP'),
               ('Sink Ships','sink-ships','SNK'), ('Table Manners','table-manners','TBL')
       ) as v(name, slug, abbr)
 where s.slug = 'fall-2026';

insert into public.team_members (team_id, person_id, role)
select t.id, p.id, 'starter'
  from public.teams t
  join public.seasons s on s.id = t.season_id and s.slug = 'fall-2026'
  join (values ('dye-hard','ben-penchuk'), ('dye-hard','jack-silk'),
               ('cup-check','adam-carey'), ('cup-check','colin-gross'),
               ('sink-ships','craig-brandstetter'), ('sink-ships','mason-esworthy'),
               ('table-manners','evan-eisman'), ('table-manners','john-ertel')
       ) as v(team_slug, person_slug) on v.team_slug = t.slug
  join public.people p on p.slug = v.person_slug;

-- Week 1: one fully tracked game and one score-only game, so both paths exist
-- in development. Score-only games count for standings but are excluded from
-- stat leaderboards by the is_tracked flag.
insert into public.games (season_id, kind, week, home_team_id, away_team_id, scheduled_at, status)
select s.id, 'regular', 1, h.id, a.id, timestamptz '2026-09-03 20:00+00', 'in_progress'
  from public.seasons s
  join public.teams h on h.season_id = s.id and h.slug = 'dye-hard'
  join public.teams a on a.season_id = s.id and a.slug = 'cup-check'
 where s.slug = 'fall-2026';

insert into public.games (season_id, kind, week, home_team_id, away_team_id, scheduled_at,
                          status, home_score, away_score, winner_team_id, is_tracked)
select s.id, 'regular', 1, h.id, a.id, timestamptz '2026-09-03 20:00+00',
       'final', 11, 7, h.id, false
  from public.seasons s
  join public.teams h on h.season_id = s.id and h.slug = 'sink-ships'
  join public.teams a on a.season_id = s.id and a.slug = 'table-manners'
 where s.slug = 'fall-2026';

insert into public.game_participants (game_id, person_id, team_id)
select g.id, tm.person_id, tm.team_id
  from public.games g
  join public.team_members tm on tm.team_id in (g.home_team_id, g.away_team_id);

-- ---------- the tracked game, throw by throw ----------
-- Cup Check won the opening roll. Turns alternate two throws each and either
-- partner may lead; a rethrow keeps the same guy up without burning his slot.
-- Finishes 14-10: Dye Hard reached 11 with only a one-point lead, so under
-- win-by-2 play continued.
do $$
declare
  v_game uuid; v_dye uuid; v_cup uuid;
  v_ben uuid; v_jack uuid; v_adam uuid; v_colin uuid;
  v_seq integer := 0;
  t record;
begin
  select tm.id into v_dye from public.teams tm join public.seasons s on s.id = tm.season_id
   where s.slug = 'fall-2026' and tm.slug = 'dye-hard';
  select tm.id into v_cup from public.teams tm join public.seasons s on s.id = tm.season_id
   where s.slug = 'fall-2026' and tm.slug = 'cup-check';
  select id into v_game from public.games
   where home_team_id = v_dye and away_team_id = v_cup;

  select id into v_ben   from public.people where slug = 'ben-penchuk';
  select id into v_jack  from public.people where slug = 'jack-silk';
  select id into v_adam  from public.people where slug = 'adam-carey';
  select id into v_colin from public.people where slug = 'colin-gross';

  for t in
    select * from (values
      (v_colin, v_cup, 'point'::throw_outcome,      null::uuid),
      (v_adam,  v_cup, 'missed'::throw_outcome,     null::uuid),
      (v_ben,   v_dye, 'sink'::throw_outcome,       null::uuid),
      (v_jack,  v_dye, 'caught'::throw_outcome,     v_adam),
      (v_adam,  v_cup, 'rethrow'::throw_outcome,    null::uuid),
      (v_adam,  v_cup, 'point'::throw_outcome,      null::uuid),
      (v_colin, v_cup, 'missed'::throw_outcome,     null::uuid),
      (v_jack,  v_dye, 'dink'::throw_outcome,       null::uuid),
      (v_ben,   v_dye, 'missed'::throw_outcome,     null::uuid),
      (v_colin, v_cup, 'sink'::throw_outcome,       null::uuid),
      (v_adam,  v_cup, 'caught'::throw_outcome,     v_ben),
      (v_ben,   v_dye, 'point'::throw_outcome,      null::uuid),
      (v_jack,  v_dye, 'fifa'::throw_outcome,       v_colin),   -- cup's 1st fifa: 1 kick
      (v_adam,  v_cup, 'missed'::throw_outcome,     null::uuid),
      (v_colin, v_cup, 'point'::throw_outcome,      null::uuid),
      (v_jack,  v_dye, 'field_goal'::throw_outcome, null::uuid),
      (v_ben,   v_dye, 'point'::throw_outcome,      null::uuid),
      (v_colin, v_cup, 'missed'::throw_outcome,     null::uuid),
      (v_adam,  v_cup, 'caught'::throw_outcome,     v_jack),
      (v_ben,   v_dye, 'fifa'::throw_outcome,       v_adam),    -- cup's 2nd fifa: 2 kicks
      (v_jack,  v_dye, 'point'::throw_outcome,      null::uuid),
      (v_adam,  v_cup, 'missed'::throw_outcome,     null::uuid),
      (v_colin, v_cup, 'dink'::throw_outcome,       null::uuid),
      (v_ben,   v_dye, 'point'::throw_outcome,      null::uuid),
      (v_jack,  v_dye, 'sink'::throw_outcome,       null::uuid)
    ) as v(thrower, team, outcome, defender)
  loop
    v_seq := v_seq + 1;
    insert into public.throws (game_id, seq, thrower_id, thrower_team_id, outcome, defender_id)
    values (v_game, v_seq, t.thrower, t.team, t.outcome, t.defender);
  end loop;
end $$;

-- one rep from each team signs off; the trigger flips the game to final
insert into public.game_confirmations (game_id, team_id, confirmed_by)
select g.id, g.home_team_id, p.id from public.games g, public.people p
 where g.is_tracked and p.slug = 'ben-penchuk';

insert into public.game_confirmations (game_id, team_id, confirmed_by)
select g.id, g.away_team_id, p.id from public.games g, public.people p
 where g.is_tracked and p.slug = 'adam-carey';
