-- =============================================================
-- 0012 — Player stats for seasons that predate the throw log
--
-- 0003 is built on one rule: no stored aggregates. Every player number
-- on the site is a view over public.throws, so any figure can be traced
-- to a throw somebody logged. That rule is why v1's invented stats are
-- gone and it is not being relaxed.
--
-- But BBDL played six seasons before this site existed, and those were
-- tracked in a spreadsheet that recorded season TOTALS only — no throw
-- log, no per-game lines, nothing to rebuild one from. There are two
-- honest options: drop that history, or store it as what it is.
--
-- This is the second. Imported totals live in their own table, clearly
-- labelled, and are never mixed into the throw log. Nothing here can
-- ever be mistaken for a tracked stat:
--
--   * Records (game_records) and game_mvp stay throws-only. Both need
--     per-game data that an imported season does not have.
--   * Games played, wins and losses are NOT taken from the import. They
--     come from the games actually loaded into public.games, which are
--     authoritative. The sheet's own games-played column is kept as
--     source_games_played for reference and deliberately not used --
--     in Season 6 it disagrees with the schedule, because stat tracking
--     was abandoned partway through the season.
--   * player_season_stats gains an is_imported flag so every surface
--     can say where a number came from.
-- =============================================================

create table public.imported_player_season_stats (
  season_id  uuid not null references public.seasons(id) on delete cascade,
  person_id  uuid not null references public.people(id)  on delete cascade,

  -- what the source actually recorded
  total_points   integer,
  throws         integer,
  table_hits     integer,
  catches        integer,
  field_goals    integer,
  dinks          integer,
  sinks          integer,
  fifas          integer,

  -- BBDL tracks these; the throw log has no outcome for them, so they
  -- exist only for imported seasons and for the awards named after them
  special_points integer,
  naked_laps     integer,
  self_sinks     integer,
  mvps           integer,

  -- the source's own games-played, kept for provenance, not used in stats
  source_games_played integer,

  source     text not null,
  note       text,
  imported_at timestamptz not null default now(),

  primary key (season_id, person_id),
  constraint imported_stats_nonnegative check (
    coalesce(total_points, 0) >= 0 and coalesce(throws, 0) >= 0
    and coalesce(table_hits, 0) >= 0 and coalesce(table_hits, 0) <= coalesce(throws, 2147483647)
  )
);

comment on table public.imported_player_season_stats is
  'Season totals carried over from pre-site spreadsheets. Aggregates with no throw log behind them — never mix these into public.throws.';

create index imported_stats_person_idx on public.imported_player_season_stats (person_id);

alter table public.imported_player_season_stats enable row level security;

create policy imported_stats_read on public.imported_player_season_stats
  for select to authenticated using (true);
create policy imported_stats_write_commissioner on public.imported_player_season_stats
  for all to authenticated
  using (public.is_commissioner()) with check (public.is_commissioner());

-- =============================================================
-- player_season_stats, rebuilt.
--
-- FULL OUTER JOIN, not UNION ALL: a player must produce exactly one row
-- per season. A union would give an imported player two rows -- one from
-- his games, one from the import -- and silently double his games played
-- everywhere the view is summed, including career totals.
--
-- The join also lets each column come from the right side: participation
-- from the games, scoring from whichever source has it.
-- =============================================================
create or replace view public.player_season_stats with (security_invoker = true) as
with tracked as (
  select season_id,
         person_id,
         count(*)                           as games_played,
         count(*) filter (where is_tracked) as games_tracked,
         count(*) filter (where won)        as wins,
         count(*) filter (where not won)    as losses,
         sum(throws)           as throws,
         sum(table_hits)       as table_hits,
         sum(sinks)            as sinks,
         sum(dinks)            as dinks,
         sum(field_goals)      as field_goals,
         sum(catches)          as catches,
         sum(fifas)            as fifas,
         sum(offensive_points) as offensive_points,
         sum(defensive_points) as defensive_points,
         sum(total_points)     as total_points
    from public.player_game_stats
   where status = 'final'
   group by season_id, person_id
)
select
  coalesce(t.season_id, i.season_id) as season_id,
  coalesce(t.person_id, i.person_id) as person_id,
  i.person_id is not null            as is_imported,

  -- participation always comes from real games
  coalesce(t.games_played, 0)   as games_played,
  coalesce(t.games_tracked, 0)  as games_tracked,
  coalesce(t.wins, 0)           as wins,
  coalesce(t.losses, 0)         as losses,
  round(100.0 * coalesce(t.wins, 0) / nullif(coalesce(t.games_played, 0), 0), 1) as win_pct,

  -- scoring comes from the throw log when there is one, the import otherwise
  coalesce(nullif(t.throws, 0),       i.throws)       as throws,
  coalesce(nullif(t.table_hits, 0),   i.table_hits)   as table_hits,
  round(100.0 * coalesce(nullif(t.table_hits, 0), i.table_hits)
        / nullif(coalesce(nullif(t.throws, 0), i.throws), 0), 1) as accuracy_pct,
  coalesce(nullif(t.sinks, 0),        i.sinks)        as sinks,
  coalesce(nullif(t.dinks, 0),        i.dinks)        as dinks,
  coalesce(nullif(t.field_goals, 0),  i.field_goals)  as field_goals,
  coalesce(nullif(t.catches, 0),      i.catches)      as catches,
  coalesce(nullif(t.fifas, 0),        i.fifas)        as fifas,

  -- an imported season records a single points total, never the split
  t.offensive_points,
  t.defensive_points,
  coalesce(nullif(t.total_points, 0), i.total_points) as total_points,
  round(coalesce(nullif(t.total_points, 0), i.total_points)::numeric
        / nullif(coalesce(t.games_played, 0), 0), 2)  as points_per_game,

  -- imported seasons only
  i.special_points,
  i.naked_laps,
  i.self_sinks,
  i.mvps,
  i.source_games_played
from tracked t
full outer join public.imported_player_season_stats i
  on i.season_id = t.season_id and i.person_id = t.person_id;

-- Career totals pick the import up for free, since they sum the view
-- above. coalesce guards the nulls an imported season leaves behind.
create or replace view public.player_career_stats with (security_invoker = true) as
select person_id,
       count(distinct season_id)        as seasons,
       sum(games_played)                as games_played,
       sum(wins)                        as wins,
       sum(losses)                      as losses,
       round(100.0 * sum(wins) / nullif(sum(games_played), 0), 1) as win_pct,
       sum(coalesce(throws, 0))         as throws,
       sum(coalesce(table_hits, 0))     as table_hits,
       round(100.0 * sum(coalesce(table_hits, 0))
             / nullif(sum(coalesce(throws, 0)), 0), 1) as accuracy_pct,
       sum(coalesce(sinks, 0))          as sinks,
       sum(coalesce(fifas, 0))          as fifas,
       sum(coalesce(total_points, 0))   as total_points,
       bool_or(is_imported)             as has_imported_seasons
  from public.player_season_stats
 group by person_id;

-- =============================================================
-- Imported per-game MVPs
--
-- Both master sheets name an MVP per game -- 63 of Season 7's 90 games,
-- 13 of Season 6's 73. public.game_mvp cannot hold them: it is computed
-- from the throw log, and an imported game has no throws.
--
-- So the recorded pick lives on the game itself, in its own column, and
-- game_mvp stays exactly as 0003 defined it. A consumer that wants "the
-- MVP of this game" falls back to this column when game_mvp is empty;
-- the two can never disagree, because no game has both.
-- =============================================================

alter table public.games
  add column imported_mvp_person_id uuid references public.people(id) on delete set null;

comment on column public.games.imported_mvp_person_id is
  'MVP as recorded in a pre-site master sheet. Only ever set on untracked imported games — tracked games derive their MVP from public.game_mvp.';

create index games_imported_mvp_idx on public.games (imported_mvp_person_id)
  where imported_mvp_person_id is not null;

-- An imported MVP is only meaningful where there is no throw log to
-- compute one from. This keeps a tracked game from carrying a
-- hand-entered pick that contradicts what its own throws say.
alter table public.games
  add constraint imported_mvp_only_when_untracked
  check (imported_mvp_person_id is null or not is_tracked);
