-- =============================================================
-- 0011 — Seasons are numbered, because that is what they are called
--
-- 0002 identified a season by year and term and derived its name from
-- them ("Fall 2026", slug fall-2026). BBDL does not call them that. It
-- calls them BBDL Season 1 through 8, and the number is the identity:
-- it is how players refer to a season, and the only thing that orders
-- them correctly. Year and term are still recorded -- they are the only
-- statement of WHEN a season happened, and unique(year, term) is still
-- the guard against creating two seasons for one term -- they simply
-- stop being the name.
--
-- The seeded season is renumbered here, not just relabelled. It was
-- created as 'fall-2026' with demo teams, and Fall 2026 is in fact the
-- CURRENT season, which is Season 8. The two finished seasons that come
-- before it are being imported from their master sheets:
--
--     Season 6   Fall 2025     26 teams   (0013)
--     Season 7   Spring 2026   32 teams   (0014)
--     Season 8   Fall 2026     in progress, no data yet
--
-- Season 8 keeps the seeded row's id, so it stays the active season and
-- nothing referencing it breaks. Its four seeded teams (Dye Hard, Cup
-- Check, Sink Ships, Table Manners) are demo data and still there --
-- clearing them out belongs to whoever opens Season 8 for real.
-- =============================================================

alter table public.seasons add column number integer;

comment on column public.seasons.number is
  'BBDL season number — the league''s own name for the season, and its sort order.';

update public.seasons set number = 8 where slug = 'fall-2026';

-- Number anything else by date, oldest first, so this migration cannot
-- fail on a database that is ahead of the seed.
with ordered as (
  select id, row_number() over (order by year, term) as n
    from public.seasons where number is null
)
update public.seasons s
   set number = ordered.n + coalesce((select max(number) from public.seasons), 0)
  from ordered where ordered.id = s.id;

alter table public.seasons
  alter column number set not null,
  add constraint seasons_number_positive check (number > 0),
  add constraint seasons_number_unique unique (number);

-- The name and slug now follow the number.
update public.seasons
   set name = 'BBDL Season ' || number,
       slug = 'season-' || number;

create index seasons_number_idx on public.seasons (number desc);
