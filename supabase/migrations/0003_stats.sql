-- =============================================================
-- 0003 — The throw log, and every stat derived from it
--
-- This is the file that fixes the worst problem in v1. There, player
-- stats were stored numbers invented from the team score:
--   cups = score * 0.7, sinks = score * 0.5, throws = score * 2 ...
-- so every player on a winning team had identical "accuracy", and subs
-- collected stats for games they never played.
--
-- Here there are NO stored aggregates at all. One row per throw, and
-- every statistic in the league is a view over those rows. Any number on
-- the site can be traced back to a throw somebody actually logged.
-- =============================================================

create type throw_outcome as enum (
  'point',       -- bounced off the far side and fell, uncaught      +1
  'dink',        -- off the far side, hit a cup, fell                +2
  'sink',        -- landed in a cup                                  +3
  'field_goal',  -- came back through the thrower's own cups         +2
  'fifa',        -- thrower missed, defense kicked and caught        +1 DEFENSE
  'caught',      -- good throw, opponent caught it                    0
  'missed',      -- off the table entirely                            0
  'rethrow'      -- stayed on the table and he called it right        0
);

create table public.throws (
  id              uuid primary key default gen_random_uuid(),
  game_id         uuid not null references public.games(id)  on delete cascade,
  seq             integer not null,
  thrower_id      uuid not null references public.people(id) on delete cascade,
  thrower_team_id uuid not null references public.teams(id)  on delete cascade,
  outcome         throw_outcome not null,

  -- Point values live in the row, not in application code, so a displayed
  -- stat can never disagree with the throw that produced it.
  points smallint generated always as (
    case outcome
      when 'point'      then 1
      when 'dink'       then 2
      when 'sink'       then 3
      when 'field_goal' then 2
      when 'fifa'       then 1
      else 0
    end
  ) stored,

  -- Accuracy denominator. A die that stayed on the table never completed
  -- the throw: it counts as a throw but NOT as a table hit, so it drags
  -- accuracy down without earning credit.
  counts_as_hit boolean generated always as (
    outcome in ('point', 'dink', 'sink', 'field_goal', 'caught')
  ) stored,

  scoring_team_id uuid references public.teams(id)  on delete set null,
  defender_id     uuid references public.people(id) on delete set null,
  fifa_kicks      smallint,
  created_at      timestamptz not null default now(),

  unique (game_id, seq),
  constraint defender_required_for_defensive_plays
    check ((outcome in ('caught', 'fifa')) = (defender_id is not null)),
  constraint fifa_kicks_only_on_fifa
    check ((outcome = 'fifa') = (fifa_kicks is not null))
);

comment on table public.throws is
  'One row per throw. Every player and team statistic in BBDL is a view over this table — nothing is stored pre-aggregated.';

create index throws_game_idx     on public.throws (game_id, seq);
create index throws_thrower_idx  on public.throws (thrower_id);
create index throws_defender_idx on public.throws (defender_id) where defender_id is not null;

-- Fills in what the tracker should never be trusted to compute: the
-- sequence number, which team the points belong to, and the fifa ladder.
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

  v_other := case when new.thrower_team_id = v_home then v_away else v_home end;

  if new.seq is null then
    select coalesce(max(seq), 0) + 1 into new.seq
      from public.throws where game_id = new.game_id;
  end if;

  if new.outcome = 'fifa' then
    -- a fifa scores for the DEFENDING team
    new.scoring_team_id := v_other;
    -- ladder climbs per team, per game: 1 kick, then 2, then 3...
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
    if not exists (select 1 from public.game_participants
                    where game_id = new.game_id
                      and person_id = new.defender_id
                      and team_id = v_other) then
      raise exception 'The defender must be a participant on the opposing team';
    end if;
  end if;

  return new;
end;
$$;

create trigger throws_prepare
  before insert on public.throws
  for each row execute function public.prepare_throw();

-- Keeps the score on the game in step with the log, so the scoreboard never
-- has to add up throws in the browser.
create or replace function public.resync_game_score()
returns trigger language plpgsql security definer
set search_path = public, pg_temp as $$
declare v_game uuid;
begin
  v_game := coalesce(new.game_id, old.game_id);
  update public.games g
     set home_score = coalesce((select sum(points) from public.throws
                                 where game_id = v_game and scoring_team_id = g.home_team_id), 0),
         away_score = coalesce((select sum(points) from public.throws
                                 where game_id = v_game and scoring_team_id = g.away_team_id), 0),
         is_tracked = true
   where g.id = v_game;
  return null;
end;
$$;

-- FOR EACH ROW, deliberately. An earlier cut of this was FOR EACH STATEMENT
-- while reading NEW.game_id — statement-level triggers have no NEW record, so
-- it silently updated nothing and every tracked game sat at 0-0 while the log
-- underneath was correct. Row-level is also the honest shape here: the tracker
-- inserts one throw at a time as somebody taps a button.
create trigger throws_resync_score
  after insert or update or delete on public.throws
  for each row execute function public.resync_game_score();

-- =============================================================
-- Views.
--
-- security_invoker = true on EVERY one. Without it a view executes with
-- its owner's rights and silently bypasses all the RLS in 0004 — the
-- single easiest way to undo that entire file by accident.
-- =============================================================

create view public.player_game_stats with (security_invoker = true) as
with off as (
  select game_id, thrower_id as person_id,
         count(*)                                       as throws,
         count(*) filter (where counts_as_hit)          as table_hits,
         count(*) filter (where outcome = 'point')      as points_plain,
         count(*) filter (where outcome = 'dink')       as dinks,
         count(*) filter (where outcome = 'sink')       as sinks,
         count(*) filter (where outcome = 'field_goal') as field_goals,
         count(*) filter (where outcome = 'rethrow')    as rethrows,
         coalesce(sum(points) filter (where scoring_team_id = thrower_team_id), 0) as offensive_points
    from public.throws
   group by game_id, thrower_id
),
def as (
  select game_id, defender_id as person_id,
         count(*) filter (where outcome = 'caught') as catches,
         count(*) filter (where outcome = 'fifa')   as fifas,
         coalesce(sum(points) filter (where outcome = 'fifa'), 0) as defensive_points
    from public.throws
   where defender_id is not null
   group by game_id, defender_id
)
select gp.game_id,
       gp.person_id,
       gp.team_id,
       g.season_id,
       g.status,
       g.is_tracked,
       (g.winner_team_id = gp.team_id)                      as won,
       coalesce(o.throws, 0)                                as throws,
       coalesce(o.table_hits, 0)                            as table_hits,
       round(100.0 * o.table_hits / nullif(o.throws, 0), 1) as accuracy_pct,
       coalesce(o.points_plain, 0)                          as points_plain,
       coalesce(o.dinks, 0)                                 as dinks,
       coalesce(o.sinks, 0)                                 as sinks,
       coalesce(o.field_goals, 0)                           as field_goals,
       coalesce(o.rethrows, 0)                              as rethrows,
       coalesce(o.offensive_points, 0)                      as offensive_points,
       coalesce(d.catches, 0)                               as catches,
       coalesce(d.fifas, 0)                                 as fifas,
       coalesce(d.defensive_points, 0)                      as defensive_points,
       coalesce(o.offensive_points, 0) + coalesce(d.defensive_points, 0) as total_points
  from public.game_participants gp
  join public.games g on g.id = gp.game_id
  left join off o on o.game_id = gp.game_id and o.person_id = gp.person_id
  left join def d on d.game_id = gp.game_id and d.person_id = gp.person_id;

create view public.player_season_stats with (security_invoker = true) as
select season_id,
       person_id,
       count(*)                           as games_played,
       count(*) filter (where is_tracked) as games_tracked,
       count(*) filter (where won)        as wins,
       count(*) filter (where not won)    as losses,
       round(100.0 * count(*) filter (where won) / nullif(count(*), 0), 1) as win_pct,
       sum(throws)           as throws,
       sum(table_hits)       as table_hits,
       round(100.0 * sum(table_hits) / nullif(sum(throws), 0), 1) as accuracy_pct,
       sum(sinks)            as sinks,
       sum(dinks)            as dinks,
       sum(field_goals)      as field_goals,
       sum(catches)          as catches,
       sum(fifas)            as fifas,
       sum(offensive_points) as offensive_points,
       sum(defensive_points) as defensive_points,
       sum(total_points)     as total_points,
       round(sum(total_points)::numeric / nullif(count(*), 0), 2) as points_per_game
  from public.player_game_stats
 where status = 'final'
 group by season_id, person_id;

create view public.player_career_stats with (security_invoker = true) as
select person_id,
       count(distinct season_id) as seasons,
       sum(games_played)         as games_played,
       sum(wins)                 as wins,
       sum(losses)               as losses,
       round(100.0 * sum(wins) / nullif(sum(games_played), 0), 1) as win_pct,
       sum(throws)               as throws,
       sum(table_hits)           as table_hits,
       round(100.0 * sum(table_hits) / nullif(sum(throws), 0), 1) as accuracy_pct,
       sum(sinks)                as sinks,
       sum(fifas)                as fifas,
       sum(total_points)         as total_points
  from public.player_season_stats
 group by person_id;

-- one row per team per game, so home/away stops being a special case everywhere
create view public.team_game_results with (security_invoker = true) as
select id as game_id, season_id, status, week, kind,
       home_team_id as team_id, away_team_id as opponent_id,
       home_score as points_for, away_score as points_against, winner_team_id
  from public.games
union all
select id, season_id, status, week, kind,
       away_team_id, home_team_id,
       away_score, home_score, winner_team_id
  from public.games;

create view public.team_season_stats with (security_invoker = true) as
select t.id        as team_id,
       t.season_id,
       t.name,
       count(r.game_id) filter (where r.status = 'final')                        as games_played,
       count(*) filter (where r.status = 'final' and r.winner_team_id = t.id)    as wins,
       count(*) filter (where r.status = 'final' and r.winner_team_id is not null
                              and r.winner_team_id <> t.id)                      as losses,
       coalesce(sum(r.points_for)     filter (where r.status = 'final'), 0)      as points_for,
       coalesce(sum(r.points_against) filter (where r.status = 'final'), 0)      as points_against,
       coalesce(sum(r.points_for)     filter (where r.status = 'final'), 0)
         - coalesce(sum(r.points_against) filter (where r.status = 'final'), 0)  as point_differential,
       round(100.0 * count(*) filter (where r.status = 'final' and r.winner_team_id = t.id)
             / nullif(count(r.game_id) filter (where r.status = 'final'), 0), 1) as win_pct
  from public.teams t
  left join public.team_game_results r on r.team_id = t.id
 group by t.id, t.season_id, t.name;

-- Point differential is the chosen tiebreak, then total points scored.
create view public.standings with (security_invoker = true) as
select *,
       rank() over (
         partition by season_id
         order by wins desc, point_differential desc, points_for desc
       ) as rank
  from public.team_season_stats;

-- MVP is computed, never voted: most total points (offense + defensive fifas),
-- then accuracy, then raw table hits. Only exists for games somebody tracked.
create view public.game_mvp with (security_invoker = true) as
select distinct on (game_id)
       game_id, person_id, team_id, total_points, accuracy_pct
  from public.player_game_stats
 where is_tracked and status = 'final' and throws > 0
 order by game_id, total_points desc, accuracy_pct desc nulls last, table_hits desc;
