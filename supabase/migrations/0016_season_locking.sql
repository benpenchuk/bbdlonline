-- =============================================================
-- 0016 — Finished seasons are locked, and can be unlocked
--
-- Seasons 6 and 7 came in from spreadsheets full of things only a human
-- can settle: which team each of the two Peter Ms played for, the games
-- whose scores nobody wrote down, a Season 7 bracket missing a semi.
-- All of that has to be fixable from the site.
--
-- But a finished season should not be quietly editable forever. A stray
-- click on a 2025 game silently rewrites standings, records and career
-- totals, and nobody would notice for months.
--
-- So a season carries a lock. Locked means read-only, whatever your
-- role. A commissioner unlocks it, makes the correction, locks it again.
--
-- The lock is enforced HERE, in RLS, not in the admin pages. A check
-- that lives only in the UI is not a lock -- it is a suggestion, and
-- anything holding an API key ignores it.
-- =============================================================

alter table public.seasons
  add column locked boolean not null default false;

comment on column public.seasons.locked is
  'Read-only. Set on finished seasons so a stray edit cannot silently rewrite history; a commissioner unlocks to correct something, then locks it again.';

-- The two imported seasons arrive locked. Season 8 is being played, so
-- it stays open.
update public.seasons set locked = true where status in ('completed', 'archived');

-- =============================================================
-- The gate.
--
-- SECURITY DEFINER so the policies below can read seasons without every
-- caller needing their own select on it, and so the lookup cannot be
-- subverted by a row-level policy on seasons itself. search_path is
-- pinned: an unpinned definer function is a privilege-escalation hole.
-- =============================================================
create or replace function public.season_is_open(p_season uuid)
returns boolean language sql stable security definer
set search_path = public, pg_temp as $$
  select coalesce((select not locked from public.seasons where id = p_season), false);
$$;

comment on function public.season_is_open(uuid) is
  'False when the season is locked. Every write policy on season-scoped data goes through this.';

-- A team_id is one hop from a season; this saves repeating the join in
-- four policies.
create or replace function public.team_season_is_open(p_team uuid)
returns boolean language sql stable security definer
set search_path = public, pg_temp as $$
  select coalesce((select not s.locked
                     from public.teams t
                     join public.seasons s on s.id = t.season_id
                    where t.id = p_team), false);
$$;

revoke execute on function public.season_is_open(uuid)      from anon;
revoke execute on function public.team_season_is_open(uuid) from anon;

-- =============================================================
-- Write policies, rebuilt to respect the lock.
--
-- Reads are untouched throughout: a locked season is fully visible, it
-- simply cannot be changed.
-- =============================================================

-- ---------- teams ----------
drop policy if exists teams_insert_member on public.teams;
create policy teams_insert_member on public.teams
  for insert to authenticated
  with check (public.season_is_open(season_id)
              and (created_by = public.current_person_id() or public.is_commissioner()));

drop policy if exists teams_update_own_or_commissioner on public.teams;
create policy teams_update_own_or_commissioner on public.teams
  for update to authenticated
  using (public.season_is_open(season_id)
         and (public.is_commissioner() or public.is_on_team(id)))
  with check (public.season_is_open(season_id)
              and (public.is_commissioner() or public.is_on_team(id)));

drop policy if exists teams_delete_commissioner on public.teams;
create policy teams_delete_commissioner on public.teams
  for delete to authenticated
  using (public.season_is_open(season_id) and public.is_commissioner());

-- ---------- team_members ----------
drop policy if exists team_members_write on public.team_members;
create policy team_members_write on public.team_members
  for all to authenticated
  using (public.team_season_is_open(team_id)
         and (public.is_commissioner()
              or exists (select 1 from public.teams t
                          where t.id = team_id
                            and t.created_by = public.current_person_id()
                            and not t.approved)))
  with check (public.team_season_is_open(team_id)
              and (public.is_commissioner()
                   or exists (select 1 from public.teams t
                               where t.id = team_id
                                 and t.created_by = public.current_person_id()
                                 and not t.approved)));

-- ---------- games ----------
drop policy if exists games_write_commissioner on public.games;
create policy games_write_commissioner on public.games
  for all to authenticated
  using (public.season_is_open(season_id) and public.is_commissioner())
  with check (public.season_is_open(season_id) and public.is_commissioner());

drop policy if exists games_update_participant on public.games;
create policy games_update_participant on public.games
  for update to authenticated
  using (public.season_is_open(season_id) and public.is_in_game(id) and status <> 'final')
  with check (public.season_is_open(season_id) and status <> 'final');

-- ---------- game_participants ----------
drop policy if exists game_participants_write on public.game_participants;
create policy game_participants_write on public.game_participants
  for all to authenticated
  using (public.team_season_is_open(team_id)
         and (public.is_commissioner()
              or exists (select 1 from public.games g
                          where g.id = game_id and g.status <> 'final')))
  with check (public.team_season_is_open(team_id)
              and (public.is_commissioner()
                   or exists (select 1 from public.games g
                               where g.id = game_id and g.status <> 'final')));

-- ---------- throws ----------
-- A locked season's throw log is history. Without this, a tracked game
-- in a locked season could still be rewritten throw by throw, which
-- would move every stat derived from it.
drop policy if exists throws_insert on public.throws;
create policy throws_insert on public.throws
  for insert to authenticated
  with check (exists (select 1 from public.games g
                       where g.id = game_id
                         and g.status <> 'final'
                         and public.season_is_open(g.season_id)));

drop policy if exists throws_modify on public.throws;
create policy throws_modify on public.throws
  for update to authenticated
  using (exists (select 1 from public.games g
                  where g.id = game_id
                    and public.season_is_open(g.season_id)
                    and (public.is_commissioner() or g.status <> 'final')))
  with check (true);

-- ---------- playoffs ----------
drop policy if exists playoffs_write_commissioner on public.playoffs;
create policy playoffs_write_commissioner on public.playoffs
  for all to authenticated
  using (public.season_is_open(season_id) and public.is_commissioner())
  with check (public.season_is_open(season_id) and public.is_commissioner());

drop policy if exists playoff_matches_write_commissioner on public.playoff_matches;
create policy playoff_matches_write_commissioner on public.playoff_matches
  for all to authenticated
  using (public.is_commissioner()
         and exists (select 1 from public.playoffs p
                      where p.id = playoff_id and public.season_is_open(p.season_id)))
  with check (public.is_commissioner()
              and exists (select 1 from public.playoffs p
                           where p.id = playoff_id and public.season_is_open(p.season_id)));

-- ---------- imported stats ----------
drop policy if exists imported_stats_write_commissioner on public.imported_player_season_stats;
create policy imported_stats_write_commissioner on public.imported_player_season_stats
  for all to authenticated
  using (public.season_is_open(season_id) and public.is_commissioner())
  with check (public.season_is_open(season_id) and public.is_commissioner());

-- =============================================================
-- Unlocking is itself a commissioner action, and the seasons table
-- already restricts writes to commissioners. One guard on top: a season
-- cannot be edited into a different season's identity while locked.
-- =============================================================
create or replace function public.guard_locked_season()
returns trigger language plpgsql security invoker
set search_path = public, pg_temp as $$
begin
  -- Changing `locked` itself is always allowed; that IS the unlock.
  if old.locked and new.locked
     and (new.number is distinct from old.number
          or new.slug   is distinct from old.slug
          or new.year   is distinct from old.year
          or new.term   is distinct from old.term) then
    raise exception 'BBDL Season % is locked. Unlock it before changing it.', old.number;
  end if;
  return new;
end;
$$;

create trigger seasons_guard_locked
  before update on public.seasons
  for each row execute function public.guard_locked_season();
