-- =============================================================
-- 0010 — Lineups, and playoffs that are actually played
--
-- Fixes four bugs, which turned out to be two root causes.
--
-- ROOT CAUSE 1: nothing recorded who actually played a game.
--   * The tracker wrote EVERY roster member as a participant, so a team
--     carrying a sub had three, and the benched sub got a game played and a
--     win or loss. That quietly reintroduced the v1 bug this table was built
--     to fix. It also broke the turn engine, which assumes two per team.
--   * Score-only games wrote no participants at all, so their players got
--     no win or loss.
--   Fix: a lineup is exactly two players per team, chosen from that team's
--   roster, and the database refuses anything else. Throws must come from
--   someone in the lineup.
--
-- ROOT CAUSE 2: playoff matches were decided by a commissioner clicking a
-- button, never by a game.
--   * Byes could never advance, because advancing needed two teams — so a
--     bracket that wasn't a power of two froze in round one.
--   * Playoff games couldn't be tracked, so the biggest games of the season
--     produced no stats and never reached the record book.
--   Fix: every playoff match gets real games. Byes advance themselves. When
--   a playoff game goes final, the series is scored and the winner moves on,
--   all in the database — so it happens the same way whether the game was
--   confirmed by both teams or overridden by the commissioner.
--
-- Also: standings now count only regular-season and rivalry games. Once
-- playoff games exist they would otherwise inflate the standings — and the
-- standings are what seed the bracket.
-- =============================================================

-- ---------- lineup rules ----------
create or replace function public.guard_game_participant()
returns trigger language plpgsql security invoker
set search_path = public, pg_temp as $$
declare v_count integer;
begin
  if not exists (
    select 1 from public.games g
     where g.id = new.game_id
       and new.team_id in (g.home_team_id, g.away_team_id)
  ) then
    raise exception 'That team is not playing in this game';
  end if;

  if not exists (
    select 1 from public.team_members tm
     where tm.team_id = new.team_id
       and tm.person_id = new.person_id
       and tm.left_at is null
  ) then
    raise exception 'Only players on a team''s roster can play for it. Add a sub to the roster first.';
  end if;

  select count(*) into v_count
    from public.game_participants
   where game_id = new.game_id
     and team_id = new.team_id
     and person_id <> new.person_id;

  if v_count >= 2 then
    raise exception 'Dye is two-on-two: this team already has two players in the game';
  end if;

  return new;
end;
$$;

create trigger game_participants_guard
  before insert or update on public.game_participants
  for each row execute function public.guard_game_participant();

-- A throw must come from someone in the lineup — never a benched sub.
create or replace function public.prepare_throw()
returns trigger language plpgsql security invoker
set search_path = public, pg_temp as $$
declare
  v_home uuid; v_away uuid; v_other uuid; v_prior integer;
begin
  select home_team_id, away_team_id into v_home, v_away
    from public.games where id = new.game_id;

  if v_home is null then
    raise exception 'No such game';
  end if;

  if new.thrower_team_id not in (v_home, v_away) then
    raise exception 'Thrower is not on either team in this game';
  end if;

  if not exists (
    select 1 from public.game_participants
     where game_id = new.game_id
       and person_id = new.thrower_id
       and team_id = new.thrower_team_id
  ) then
    raise exception 'That thrower is not in the lineup for this game';
  end if;

  v_other := case when new.thrower_team_id = v_home then v_away else v_home end;

  if new.seq is null then
    select coalesce(max(seq), 0) + 1 into new.seq
      from public.throws where game_id = new.game_id;
  end if;

  if new.outcome = 'fifa' then
    new.scoring_team_id := v_other;
    select count(*) + 1 into v_prior
      from public.throws
     where game_id = new.game_id and outcome = 'fifa' and scoring_team_id = v_other;
    new.fifa_kicks := v_prior;
  elsif new.outcome in ('point', 'dink', 'sink', 'field_goal') then
    new.scoring_team_id := new.thrower_team_id;
    new.fifa_kicks := null;
  else
    new.scoring_team_id := null;
    new.fifa_kicks := null;
  end if;

  if new.defender_id is not null then
    if not exists (
      select 1 from public.game_participants
       where game_id = new.game_id
         and person_id = new.defender_id
         and team_id = v_other
    ) then
      raise exception 'The defender must be in the opposing lineup';
    end if;
  end if;

  return new;
end;
$$;

-- ---------- standings: regular season and rivalry only ----------
-- The kind filter sits in the JOIN, not a WHERE, so a team with no games
-- still appears with a 0-0 record instead of vanishing from the table.
create or replace view public.team_season_stats with (security_invoker = true) as
select t.id            as team_id,
       t.season_id,
       t.name,
       count(r.game_id) filter (where r.status = 'final')                          as games_played,
       count(*) filter (where r.status = 'final' and r.winner_team_id = t.id)      as wins,
       count(*) filter (where r.status = 'final' and r.winner_team_id is not null
                              and r.winner_team_id <> t.id)                        as losses,
       coalesce(sum(r.points_for)     filter (where r.status = 'final'), 0)        as points_for,
       coalesce(sum(r.points_against) filter (where r.status = 'final'), 0)        as points_against,
       coalesce(sum(r.points_for)     filter (where r.status = 'final'), 0)
         - coalesce(sum(r.points_against) filter (where r.status = 'final'), 0)    as point_differential,
       round(100.0 * count(*) filter (where r.status = 'final' and r.winner_team_id = t.id)
             / nullif(count(r.game_id) filter (where r.status = 'final'), 0), 1)   as win_pct
  from public.teams t
  left join public.team_game_results r
         on r.team_id = t.id
        and r.kind in ('regular', 'rivalry')
 group by t.id, t.season_id, t.name;

-- ---------- the playoff engine ----------
create or replace function public.playoff_wins_needed(p_series integer)
returns integer language sql immutable
set search_path = public, pg_temp as $$
  -- best of 1 → 1, best of 3 → 2, best of 5 → 3
  select (greatest(p_series, 1) / 2) + 1;
$$;

-- Put a game on the schedule for a match, if it has two teams, isn't decided,
-- and doesn't already have a game in play. Also how a series continues.
create or replace function public.ensure_playoff_game(p_match uuid)
returns void language plpgsql security definer
set search_path = public, pg_temp as $$
declare
  m public.playoff_matches;
  v_season uuid;
begin
  select * into m from public.playoff_matches where id = p_match;
  if m.id is null or m.status in ('completed', 'bye') then return; end if;
  if m.team1_id is null or m.team2_id is null then return; end if;

  if exists (
    select 1 from public.games
     where playoff_match_id = p_match
       and status not in ('final', 'canceled')
  ) then
    return;
  end if;

  select season_id into v_season from public.playoffs where id = m.playoff_id;

  insert into public.games (season_id, kind, week, home_team_id, away_team_id,
                            status, playoff_match_id)
  values (v_season, 'playoff', null, m.team1_id, m.team2_id, 'scheduled', p_match);

  update public.playoff_matches set status = 'in_progress' where id = p_match;
end;
$$;

-- Record a match winner and carry them into the next round.
create or replace function public.advance_playoff_winner(p_match uuid, p_winner uuid)
returns void language plpgsql security definer
set search_path = public, pg_temp as $$
declare
  m public.playoff_matches;
  v_next uuid;
begin
  select * into m from public.playoff_matches where id = p_match;
  if m.id is null then return; end if;

  if p_winner is distinct from m.team1_id and p_winner is distinct from m.team2_id then
    raise exception 'The winner must be one of the two teams in this match';
  end if;

  update public.playoff_matches
     set winner_id = p_winner, status = 'completed'
   where id = p_match;

  -- a decided series has no use for games still waiting to be played
  update public.games
     set status = 'canceled'
   where playoff_match_id = p_match
     and status in ('scheduled', 'in_progress');

  -- match N of round R feeds match N/2 of round R+1
  select id into v_next
    from public.playoff_matches
   where playoff_id = m.playoff_id
     and round_number = m.round_number + 1
     and match_number = m.match_number / 2;

  if v_next is null then
    update public.playoffs set status = 'completed' where id = m.playoff_id;
    return;
  end if;

  if m.match_number % 2 = 0 then
    update public.playoff_matches set team1_id = p_winner where id = v_next;
  else
    update public.playoff_matches set team2_id = p_winner where id = v_next;
  end if;

  perform public.ensure_playoff_game(v_next);
end;
$$;

-- When a playoff game goes final — by two confirmations or a commissioner
-- override, it doesn't matter which — score the series and move the winner on.
create or replace function public.resolve_playoff_game()
returns trigger language plpgsql security definer
set search_path = public, pg_temp as $$
declare
  m public.playoff_matches;
  v_t1 integer; v_t2 integer; v_need integer;
begin
  if new.kind <> 'playoff' or new.playoff_match_id is null then return new; end if;
  if new.status <> 'final' or old.status = 'final' then return new; end if;

  select * into m from public.playoff_matches where id = new.playoff_match_id;
  if m.id is null or m.status = 'completed' then return new; end if;

  select count(*) filter (where winner_team_id = m.team1_id),
         count(*) filter (where winner_team_id = m.team2_id)
    into v_t1, v_t2
    from public.games
   where playoff_match_id = m.id
     and status = 'final';

  v_need := public.playoff_wins_needed(m.series_length);

  if v_t1 >= v_need then
    perform public.advance_playoff_winner(m.id, m.team1_id);
  elsif v_t2 >= v_need then
    perform public.advance_playoff_winner(m.id, m.team2_id);
  else
    perform public.ensure_playoff_game(m.id);  -- next game of the series
  end if;

  return new;
end;
$$;

create trigger games_resolve_playoff
  after update of status on public.games
  for each row execute function public.resolve_playoff_game();

-- Kick off a freshly built bracket: byes advance, then every match that has
-- two teams gets its first game.
create or replace function public.start_playoff(p_playoff uuid)
returns void language plpgsql security definer
set search_path = public, pg_temp as $$
declare m public.playoff_matches;
begin
  if not public.is_commissioner() then
    raise exception 'Only a commissioner can start the playoffs';
  end if;

  for m in
    select * from public.playoff_matches
     where playoff_id = p_playoff
       and round_number = 1
       and status = 'pending'
       and (team1_id is null) <> (team2_id is null)   -- exactly one team
  loop
    perform public.advance_playoff_winner(m.id, coalesce(m.team1_id, m.team2_id));
    update public.playoff_matches set status = 'bye' where id = m.id;
  end loop;

  for m in
    select * from public.playoff_matches
     where playoff_id = p_playoff
       and status = 'pending'
       and team1_id is not null
       and team2_id is not null
  loop
    perform public.ensure_playoff_game(m.id);
  end loop;
end;
$$;

-- The commissioner's override, for a forfeit or a series decided off the site.
create or replace function public.override_playoff_winner(p_match uuid, p_winner uuid)
returns void language plpgsql security definer
set search_path = public, pg_temp as $$
begin
  if not public.is_commissioner() then
    raise exception 'Only a commissioner can decide a playoff match';
  end if;
  perform public.advance_playoff_winner(p_match, p_winner);
end;
$$;

-- ---------- grants ----------
-- Internal machinery is callable by nobody; triggers and definer functions
-- don't need EXECUTE. The two entry points check for a commissioner themselves.
revoke execute on function public.guard_game_participant()               from public, anon, authenticated;
revoke execute on function public.playoff_wins_needed(integer)            from public, anon, authenticated;
revoke execute on function public.ensure_playoff_game(uuid)               from public, anon, authenticated;
revoke execute on function public.advance_playoff_winner(uuid, uuid)      from public, anon, authenticated;
revoke execute on function public.resolve_playoff_game()                  from public, anon, authenticated;
revoke execute on function public.start_playoff(uuid)                     from public, anon;
revoke execute on function public.override_playoff_winner(uuid, uuid)     from public, anon;

grant execute on function public.start_playoff(uuid)                 to authenticated;
grant execute on function public.override_playoff_winner(uuid, uuid) to authenticated;
