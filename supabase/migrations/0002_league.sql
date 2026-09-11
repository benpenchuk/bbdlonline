-- =============================================================
-- 0002 — Seasons, teams, games
--
-- Shape of a BBDL season, from the rules as they're actually played:
--   * Fall and spring, ~25-35 teams, fixed pairs, 6 weeks.
--   * Weeks 1-5 auto-generated, random, no repeat matchups.
--   * Week 6 is rivalry week: teams call each other out, leftovers
--     get paired randomly once the challenge window closes.
--   * Regular games to 11 win by 2. Semis to 15. Final is a best-of-3
--     to 15. All of it commissioner-editable per season.
--   * A game is not official until one rep from EACH team confirms it.
-- =============================================================

create type season_term      as enum ('fall', 'spring');
create type season_status    as enum ('upcoming', 'active', 'completed', 'archived');
create type roster_role      as enum ('starter', 'sub');
create type game_kind        as enum ('regular', 'rivalry', 'playoff');
create type game_status      as enum ('scheduled', 'in_progress', 'awaiting_confirmation',
                                      'final', 'disputed', 'canceled');
create type challenge_status as enum ('pending', 'accepted', 'declined', 'expired');

-- =============================================================
-- seasons
-- =============================================================
create table public.seasons (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  name       text not null,                    -- "Fall 2026"
  year       integer not null,
  term       season_term not null,
  status     season_status not null default 'upcoming',
  start_date date,
  end_date   date,
  regular_weeks integer not null default 6,

  -- Scoring rules live on the season, not in code, so a future
  -- commissioner can change them without anyone touching the repo.
  point_target      integer not null default 11,
  win_by            integer not null default 2,
  point_cap         integer,          -- null = win-by-2 runs forever
  semi_point_target integer not null default 15,
  final_point_target integer not null default 15,
  final_series_length integer not null default 3,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (year, term)
);

comment on column public.seasons.point_cap is
  'Hard ceiling when win-by-2 drags on. Null means no cap — confirm which BBDL actually plays.';

create trigger seasons_touch before update on public.seasons
  for each row execute function public.touch_updated_at();

-- only one active season at a time
create unique index seasons_one_active_idx on public.seasons (status)
  where status = 'active';

create or replace function public.active_season_id()
returns uuid language sql stable security definer
set search_path = public, pg_temp as $$
  select id from public.seasons where status = 'active' limit 1;
$$;

-- =============================================================
-- teams — season-scoped, because pairs re-form every season
-- =============================================================
create table public.teams (
  id           uuid primary key default gen_random_uuid(),
  season_id    uuid not null references public.seasons(id) on delete cascade,
  name         text not null,
  slug         text not null,
  abbreviation text check (abbreviation is null or length(abbreviation) between 2 and 4),
  logo_url     text,
  -- guys register their own pair; the commissioner approves the final list
  approved     boolean not null default false,
  created_by   uuid references public.people(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (season_id, slug),
  unique (season_id, name)
);

create trigger teams_touch before update on public.teams
  for each row execute function public.touch_updated_at();

create index teams_season_idx on public.teams (season_id);

-- =============================================================
-- team_members
--
-- Subs count normally: a sub's throws land in his own career totals
-- for the games he actually played. `role` records how he got there,
-- it does not discount the stats.
-- =============================================================
create table public.team_members (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references public.teams(id)  on delete cascade,
  person_id  uuid not null references public.people(id) on delete cascade,
  role       roster_role not null default 'starter',
  joined_at  date,
  left_at    date,
  created_at timestamptz not null default now(),
  unique (team_id, person_id)
);

create index team_members_person_idx on public.team_members (person_id);
create index team_members_team_idx   on public.team_members (team_id);

-- =============================================================
-- games
-- =============================================================
create table public.games (
  id            uuid primary key default gen_random_uuid(),
  season_id     uuid not null references public.seasons(id) on delete cascade,
  kind          game_kind not null default 'regular',
  week          integer check (week is null or week between 1 and 20),

  home_team_id  uuid not null references public.teams(id) on delete cascade,
  away_team_id  uuid not null references public.teams(id) on delete cascade,
  constraint no_self_play check (home_team_id <> away_team_id),

  scheduled_at  timestamptz,
  location      text,
  status        game_status not null default 'scheduled',

  home_score    integer not null default 0 check (home_score >= 0),
  away_score    integer not null default 0 check (away_score >= 0),
  winner_team_id uuid references public.teams(id) on delete set null,

  -- true when a tracker logged throw-by-throw; false for a game where
  -- somebody just entered the final score afterward
  is_tracked    boolean not null default false,
  tracked_by    uuid references public.people(id) on delete set null,

  playoff_match_id uuid,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger games_touch before update on public.games
  for each row execute function public.touch_updated_at();

create index games_season_idx on public.games (season_id);
create index games_week_idx   on public.games (season_id, week);
create index games_status_idx on public.games (status);
create index games_teams_idx  on public.games (home_team_id, away_team_id);

-- =============================================================
-- game_participants — who ACTUALLY played
--
-- v1 credited every rostered player for every game, so subs picked up
-- stats for games they never played. This table is the fix: stats
-- follow participation, not roster membership.
-- =============================================================
create table public.game_participants (
  game_id   uuid not null references public.games(id)  on delete cascade,
  person_id uuid not null references public.people(id) on delete cascade,
  team_id   uuid not null references public.teams(id)  on delete cascade,
  primary key (game_id, person_id)
);

create index game_participants_person_idx on public.game_participants (person_id);

-- =============================================================
-- game_confirmations — one rep per team makes it official
-- =============================================================
create table public.game_confirmations (
  game_id      uuid not null references public.games(id)  on delete cascade,
  team_id      uuid not null references public.teams(id)  on delete cascade,
  confirmed_by uuid not null references public.people(id) on delete cascade,
  confirmed_at timestamptz not null default now(),
  primary key (game_id, team_id)
);

-- Flip a game to final once both sides have signed off. A commissioner
-- can also set status directly; this only ever promotes, never demotes.
create or replace function public.maybe_finalize_game()
returns trigger language plpgsql security definer
set search_path = public, pg_temp as $$
declare n integer;
begin
  select count(*) into n from public.game_confirmations where game_id = new.game_id;
  if n >= 2 then
    update public.games
       set status = 'final',
           winner_team_id = case
             when home_score > away_score then home_team_id
             when away_score > home_score then away_team_id
             else null end
     where id = new.game_id and status <> 'final';
  end if;
  return new;
end;
$$;

create trigger game_confirmations_finalize
  after insert on public.game_confirmations
  for each row execute function public.maybe_finalize_game();

-- =============================================================
-- rivalry_challenges — week 6
--
-- Teams call each other out. Whoever is left unmatched when the
-- window closes gets paired randomly by generate_rivalry_week().
-- =============================================================
create table public.rivalry_challenges (
  id                uuid primary key default gen_random_uuid(),
  season_id         uuid not null references public.seasons(id) on delete cascade,
  challenger_team_id uuid not null references public.teams(id) on delete cascade,
  challenged_team_id uuid not null references public.teams(id) on delete cascade,
  status            challenge_status not null default 'pending',
  created_by        uuid references public.people(id) on delete set null,
  responded_by      uuid references public.people(id) on delete set null,
  created_at        timestamptz not null default now(),
  responded_at      timestamptz,
  constraint no_self_challenge check (challenger_team_id <> challenged_team_id)
);

create index rivalry_season_idx on public.rivalry_challenges (season_id, status);

-- =============================================================
-- playoffs — top half of the league
-- =============================================================
create table public.playoffs (
  id           uuid primary key default gen_random_uuid(),
  season_id    uuid not null references public.seasons(id) on delete cascade,
  name         text not null,
  bracket_type text not null default 'single_elimination',
  status       text not null default 'planned',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger playoffs_touch before update on public.playoffs
  for each row execute function public.touch_updated_at();

create table public.playoff_matches (
  id            uuid primary key default gen_random_uuid(),
  playoff_id    uuid not null references public.playoffs(id) on delete cascade,
  round_number  integer not null,
  match_number  integer not null,
  team1_id      uuid references public.teams(id) on delete set null,  -- null = bye
  team2_id      uuid references public.teams(id) on delete set null,
  winner_id     uuid references public.teams(id) on delete set null,
  status        text not null default 'pending',
  series_length integer not null default 1,
  point_target  integer not null default 11,
  next_match_id uuid references public.playoff_matches(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (playoff_id, round_number, match_number)
);

create trigger playoff_matches_touch before update on public.playoff_matches
  for each row execute function public.touch_updated_at();

alter table public.games
  add constraint games_playoff_match_fk
  foreign key (playoff_match_id) references public.playoff_matches(id) on delete set null;
