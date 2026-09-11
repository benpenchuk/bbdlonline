-- =============================================================
-- 0004 — Row Level Security
--
-- What this replaces: v1 had policies NAMED "Authenticated users can
-- insert/update/delete" that were granted to `public` with USING (true)
-- and WITH CHECK (true) — they checked nothing at all. Because the anon
-- key ships inside the browser bundle, any visitor to the site could
-- open a console and delete the entire league. Ten of twelve tables.
--
-- The model here:
--   anon            — nothing. The public landing page reads no data.
--   authenticated   — reads the league.
--   participants    — write the things they took part in.
--   commissioner    — edits essentially everything.
-- =============================================================

-- ---------- helpers ----------
create or replace function public.is_on_team(p_team uuid)
returns boolean language sql stable security definer
set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.team_members tm
     where tm.team_id = p_team
       and tm.person_id = public.current_person_id()
       and tm.left_at is null);
$$;

create or replace function public.is_in_game(p_game uuid)
returns boolean language sql stable security definer
set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.game_participants gp
     where gp.game_id = p_game
       and gp.person_id = public.current_person_id());
$$;

-- The /join page must check a code BEFORE an account exists. Returns a bare
-- boolean so it cannot leak who an invite was for or what it grants.
create or replace function public.invite_code_valid(p_code text)
returns boolean language sql stable security definer
set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.invites i
     where lower(i.code) = lower(p_code)
       and i.revoked_at is null
       and (i.expires_at is null or i.expires_at > now())
       and (i.max_uses  is null or i.use_count < i.max_uses));
$$;

-- ---------- lock anon out ----------
-- NOTE: revoking from `anon` alone is NOT enough for functions. Postgres
-- grants EXECUTE on every new function to the PUBLIC pseudo-role, and anon
-- inherits from PUBLIC, so a revoke aimed only at anon is a no-op. Learned
-- that from the linter after the first attempt.
revoke all     on all tables    in schema public from anon;
revoke all     on all sequences in schema public from anon;
revoke execute on all functions in schema public from public, anon, authenticated;

alter default privileges in schema public revoke all     on tables    from anon;
alter default privileges in schema public revoke all     on sequences from anon;
alter default privileges in schema public revoke execute on functions from public, anon;

-- The only function anon may call. Invite codes are long and random
-- precisely because this endpoint is an enumeration oracle.
grant execute on function public.invite_code_valid(text) to anon, authenticated;

-- Referenced inside RLS policies, so members must be able to execute them or
-- every policied query errors out.
grant execute on function public.current_person_id() to authenticated;
grant execute on function public.is_commissioner()   to authenticated;
grant execute on function public.is_superadmin()     to authenticated;
grant execute on function public.is_on_team(uuid)    to authenticated;
grant execute on function public.is_in_game(uuid)    to authenticated;
grant execute on function public.active_season_id()  to authenticated;

-- Trigger functions (handle_new_auth_user, maybe_finalize_game,
-- resync_game_score, prepare_throw, touch_updated_at, guard_people_fields,
-- invite_is_usable) are granted to NOBODY on purpose: Postgres does not check
-- EXECUTE when firing a trigger, so they keep working while being unreachable
-- over /rest/v1/rpc. v1 exposed its signup trigger as a callable endpoint.

-- ---------- enable RLS everywhere ----------
alter table public.people             enable row level security;
alter table public.invites            enable row level security;
alter table public.seasons            enable row level security;
alter table public.teams              enable row level security;
alter table public.team_members       enable row level security;
alter table public.games              enable row level security;
alter table public.game_participants  enable row level security;
alter table public.game_confirmations enable row level security;
alter table public.throws             enable row level security;
alter table public.rivalry_challenges enable row level security;
alter table public.playoffs           enable row level security;
alter table public.playoff_matches    enable row level security;

-- ---------- people ----------
create policy people_read on public.people
  for select to authenticated using (true);

-- WHICH COLUMNS a member may change is enforced by guard_people_fields()
-- in 0001 — RLS can only grant or deny a whole row, so "nickname yes,
-- site_role no" has to be a trigger.
create policy people_update_self on public.people
  for update to authenticated
  using (auth_user_id = auth.uid() or public.is_commissioner())
  with check (auth_user_id = auth.uid() or public.is_commissioner());

create policy people_insert_commissioner on public.people
  for insert to authenticated with check (public.is_commissioner());

create policy people_delete_commissioner on public.people
  for delete to authenticated using (public.is_commissioner());

-- ---------- invites: commissioner only, so members cannot enumerate codes ----------
create policy invites_all_commissioner on public.invites
  for all to authenticated
  using (public.is_commissioner()) with check (public.is_commissioner());

-- ---------- seasons ----------
create policy seasons_read on public.seasons
  for select to authenticated using (true);
create policy seasons_write_commissioner on public.seasons
  for all to authenticated
  using (public.is_commissioner()) with check (public.is_commissioner());

-- ---------- teams: guys register their own pair, commissioner approves ----------
create policy teams_read on public.teams
  for select to authenticated using (true);

create policy teams_insert_member on public.teams
  for insert to authenticated
  with check (created_by = public.current_person_id() or public.is_commissioner());

create policy teams_update_own_or_commissioner on public.teams
  for update to authenticated
  using (public.is_commissioner() or public.is_on_team(id))
  with check (public.is_commissioner() or public.is_on_team(id));

create policy teams_delete_commissioner on public.teams
  for delete to authenticated using (public.is_commissioner());

-- ---------- team_members: editable until the commissioner approves the team ----------
create policy team_members_read on public.team_members
  for select to authenticated using (true);

create policy team_members_write on public.team_members
  for all to authenticated
  using (public.is_commissioner()
         or exists (select 1 from public.teams t
                     where t.id = team_id
                       and t.created_by = public.current_person_id()
                       and not t.approved))
  with check (public.is_commissioner()
         or exists (select 1 from public.teams t
                     where t.id = team_id
                       and t.created_by = public.current_person_id()
                       and not t.approved));

-- ---------- games ----------
create policy games_read on public.games
  for select to authenticated using (true);

create policy games_write_commissioner on public.games
  for all to authenticated
  using (public.is_commissioner()) with check (public.is_commissioner());

-- A participant can move his own game along, but cannot create or delete one,
-- and cannot mark it final — only the two-team confirmation trigger does that.
create policy games_update_participant on public.games
  for update to authenticated
  using (public.is_in_game(id) and status <> 'final')
  with check (status <> 'final');

-- ---------- game_participants ----------
create policy game_participants_read on public.game_participants
  for select to authenticated using (true);

create policy game_participants_write on public.game_participants
  for all to authenticated
  using (public.is_commissioner()
         or exists (select 1 from public.games g
                     where g.id = game_id and g.status <> 'final'))
  with check (public.is_commissioner()
         or exists (select 1 from public.games g
                     where g.id = game_id and g.status <> 'final'));

-- ---------- game_confirmations: one rep per team makes it official ----------
create policy game_confirmations_read on public.game_confirmations
  for select to authenticated using (true);

create policy game_confirmations_insert on public.game_confirmations
  for insert to authenticated
  with check (
    confirmed_by = public.current_person_id()
    and (public.is_commissioner() or public.is_on_team(team_id)));

create policy game_confirmations_delete_commissioner on public.game_confirmations
  for delete to authenticated using (public.is_commissioner());

-- ---------- throws ----------
-- Any signed-in member may track: the tracker is usually a brother who isn't
-- playing. Corrections stay open until the game is confirmed final.
create policy throws_read on public.throws
  for select to authenticated using (true);

create policy throws_insert on public.throws
  for insert to authenticated
  with check (exists (select 1 from public.games g
                       where g.id = game_id and g.status <> 'final'));

create policy throws_modify on public.throws
  for update to authenticated
  using (public.is_commissioner()
         or exists (select 1 from public.games g
                     where g.id = game_id and g.status <> 'final'))
  with check (true);

create policy throws_delete on public.throws
  for delete to authenticated
  using (public.is_commissioner()
         or exists (select 1 from public.games g
                     where g.id = game_id and g.status <> 'final'));

-- ---------- rivalry week ----------
create policy rivalry_read on public.rivalry_challenges
  for select to authenticated using (true);

create policy rivalry_insert on public.rivalry_challenges
  for insert to authenticated
  with check (public.is_commissioner() or public.is_on_team(challenger_team_id));

-- the challenged team answers; the challenger may withdraw
create policy rivalry_update on public.rivalry_challenges
  for update to authenticated
  using (public.is_commissioner()
         or public.is_on_team(challenged_team_id)
         or public.is_on_team(challenger_team_id))
  with check (true);

create policy rivalry_delete_commissioner on public.rivalry_challenges
  for delete to authenticated using (public.is_commissioner());

-- ---------- playoffs ----------
create policy playoffs_read on public.playoffs
  for select to authenticated using (true);
create policy playoffs_write_commissioner on public.playoffs
  for all to authenticated
  using (public.is_commissioner()) with check (public.is_commissioner());

create policy playoff_matches_read on public.playoff_matches
  for select to authenticated using (true);
create policy playoff_matches_write_commissioner on public.playoff_matches
  for all to authenticated
  using (public.is_commissioner()) with check (public.is_commissioner());

-- ---------- grants for signed-in members (RLS is the real gate) ----------
grant select on all tables in schema public to authenticated;
grant insert, update, delete on
  public.people, public.invites, public.seasons, public.teams,
  public.team_members, public.games, public.game_participants,
  public.game_confirmations, public.throws, public.rivalry_challenges,
  public.playoffs, public.playoff_matches
to authenticated;
