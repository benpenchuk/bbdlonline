-- =============================================================
-- 0001 — Identity
--
-- Replaces the v1 schema (verified empty before this ran) with
-- the model the league actually needs:
--
--   * One row per human BBDL has ever known.
--   * An account is OPTIONAL. A guy who graduated before the site
--     existed still gets a row, rosters, and career stats. Nothing
--     about the league depends on him ever logging in.
--   * Two independent axes on every person:
--       site_role     — what you can DO      (member/commissioner/superadmin)
--       league_status — where you APPEAR     (player/alumni/spectator)
--
-- The v1 admin "password" was a string hardcoded into the JavaScript
-- bundle. This file is the start of replacing it with real auth.
-- =============================================================

-- ---------- teardown of v1 ----------
-- handle_new_user() was copied in from another project and inserts
-- into a public.users table that does not exist here. Left in place
-- it fails every single signup, so it goes first.
drop function if exists public.handle_new_user() cascade;
drop function if exists public.update_announcements_updated_at() cascade;

drop table if exists
  public.player_game_stats,
  public.player_season_stats,
  public.team_season_stats,
  public.playoff_matches,
  public.playoffs,
  public.player_teams,
  public.games,
  public.announcements,
  public.photos,
  public.teams,
  public.players,
  public.seasons
cascade;

-- Dropping a table does NOT drop its enum types. All six of these are left
-- over from v1 and referenced by zero columns; two of them (roster_role,
-- game_status) carry v1's values and silently collide with 0002 if left in
-- place. Found the hard way when 0002 failed on "type already exists".
drop type if exists public.game_status;
drop type if exists public.player_status;
drop type if exists public.roster_role;
drop type if exists public.roster_status;
drop type if exists public.season_status;
drop type if exists public.team_status;
drop function if exists public.set_updated_at() cascade;

-- ---------- enums ----------
create type site_role     as enum ('member', 'commissioner', 'superadmin');
create type league_status as enum ('player', 'alumni', 'spectator');

-- ---------- shared updated_at trigger ----------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =============================================================
-- people
-- =============================================================
create table public.people (
  id             uuid primary key default gen_random_uuid(),

  -- null until (and unless) this person ever makes an account
  auth_user_id   uuid unique references auth.users(id) on delete set null,

  -- real name is commissioner-controlled so the roster stays honest
  first_name     text not null check (length(trim(first_name)) > 0),
  last_name      text not null check (length(trim(last_name))  > 0),

  -- nickname and avatar belong to the person; see the guard trigger below
  nickname       text,
  avatar_url     text,

  slug           text not null unique,
  email          text,

  site_role      site_role     not null default 'member',
  league_status  league_status not null default 'spectator',

  hometown_city  text,
  hometown_state text,
  dominant_hand  text check (dominant_hand in ('left', 'right') or dominant_hand is null),

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table public.people is
  'Every human the league knows about. An account (auth_user_id) is optional so historical players keep rosters and career stats.';

create index people_auth_user_id_idx on public.people (auth_user_id);
create index people_email_idx        on public.people (lower(email));
create index people_status_idx       on public.people (league_status);

create trigger people_touch
  before update on public.people
  for each row execute function public.touch_updated_at();

-- =============================================================
-- Role helpers.
--
-- SECURITY DEFINER so policies on `people` can call them without
-- recursing into people's own policies. search_path is pinned on
-- every one of them — an unpinned search_path on a definer function
-- is a privilege-escalation hole, and it was flagged by the linter
-- on the v1 schema.
-- =============================================================
create or replace function public.current_person_id()
returns uuid language sql stable security definer
set search_path = public, pg_temp as $$
  select id from public.people where auth_user_id = auth.uid() limit 1;
$$;

create or replace function public.is_commissioner()
returns boolean language sql stable security definer
set search_path = public, pg_temp as $$
  select coalesce((select site_role in ('commissioner', 'superadmin')
                   from public.people where auth_user_id = auth.uid() limit 1), false);
$$;

create or replace function public.is_superadmin()
returns boolean language sql stable security definer
set search_path = public, pg_temp as $$
  select coalesce((select site_role = 'superadmin'
                   from public.people where auth_user_id = auth.uid() limit 1), false);
$$;

-- anon has no business calling any of these
revoke execute on function public.current_person_id() from anon;
revoke execute on function public.is_commissioner()   from anon;
revoke execute on function public.is_superadmin()     from anon;

-- =============================================================
-- Field guard.
--
-- RLS grants or denies a whole row, so "you may edit your nickname
-- but not your name or your role" has to be a trigger. Without this,
-- any member could promote himself to commissioner with one API call.
-- =============================================================
create or replace function public.guard_people_fields()
returns trigger language plpgsql security invoker
set search_path = public, pg_temp as $$
begin
  -- No end user in the request: this is a trigger, a migration, or the
  -- service role. The guard polices what a MEMBER may edit about himself,
  -- so none of those should be subject to it.
  --
  -- This line is load-bearing. Without it, handle_new_auth_user() below is
  -- blocked from binding a new account — it sets auth_user_id, email,
  -- site_role and league_status, all protected, while auth.uid() is still
  -- null because the member is not authenticated yet. Signup then dies with
  -- "Database error saving new user".
  --
  -- It opens no hole: `anon` has no UPDATE grant on people and the RLS
  -- policy is scoped `to authenticated`, so an unauthenticated request never
  -- reaches this trigger at all.
  if auth.uid() is null then
    return new;
  end if;

  if public.is_commissioner() then
    -- only a superadmin may mint another superadmin
    if new.site_role = 'superadmin'
       and old.site_role is distinct from 'superadmin'
       and not public.is_superadmin() then
      raise exception 'Only a superadmin can grant superadmin';
    end if;
    return new;
  end if;

  -- everyone else: nickname and avatar only
  if new.first_name    is distinct from old.first_name    or
     new.last_name     is distinct from old.last_name     or
     new.site_role     is distinct from old.site_role     or
     new.league_status is distinct from old.league_status or
     new.slug          is distinct from old.slug          or
     new.email         is distinct from old.email         or
     new.auth_user_id  is distinct from old.auth_user_id then
    raise exception 'You can change your nickname and photo. Ask the commissioner for anything else.';
  end if;

  return new;
end;
$$;

create trigger people_guard
  before update on public.people
  for each row execute function public.guard_people_fields();

-- =============================================================
-- invites
--
-- Two flavours, both asked for:
--   * a house-wide code the commissioner shares in the group chat
--     (email null, max_uses set)
--   * a targeted invite to one email, optionally pre-attached to an
--     existing person so a returning player keeps his whole history
-- =============================================================
create table public.invites (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,
  email         text,
  person_id     uuid references public.people(id) on delete set null,
  grants_role   site_role     not null default 'member',
  grants_status league_status not null default 'player',
  max_uses      integer check (max_uses is null or max_uses > 0),
  use_count     integer not null default 0,
  expires_at    timestamptz,
  revoked_at    timestamptz,
  created_by    uuid references public.people(id) on delete set null,
  created_at    timestamptz not null default now()
);

comment on column public.invites.person_id is
  'Pre-links this invite to an existing person, so a returning player keeps his history instead of starting a duplicate row.';

create index invites_code_idx  on public.invites (lower(code));
create index invites_email_idx on public.invites (lower(email));

create or replace function public.invite_is_usable(inv public.invites)
returns boolean language sql immutable
set search_path = public, pg_temp as $$
  select inv.revoked_at is null
     and (inv.expires_at is null or inv.expires_at > now())
     and (inv.max_uses  is null or inv.use_count < inv.max_uses);
$$;

-- =============================================================
-- Signup.
--
-- Fires when Supabase Auth creates a user. Finds the person this
-- account belongs to in priority order — the invite's pre-link, then
-- an existing person with that email, and otherwise creates one.
-- The invite code travels in the signup metadata.
-- =============================================================
create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer
set search_path = public, pg_temp as $$
declare
  v_code   text := nullif(new.raw_user_meta_data->>'invite_code', '');
  v_invite public.invites;
  v_person uuid;
begin
  select * into v_invite from public.invites
   where lower(code) = lower(v_code) limit 1;

  if v_invite.id is null or not public.invite_is_usable(v_invite) then
    raise exception 'A valid invite from the commissioner is required to join BBDL.';
  end if;

  v_person := v_invite.person_id;

  if v_person is null then
    select id into v_person from public.people
     where lower(email) = lower(new.email) and auth_user_id is null
     limit 1;
  end if;

  if v_person is null then
    insert into public.people (first_name, last_name, slug, email,
                               site_role, league_status, auth_user_id)
    values (
      coalesce(nullif(new.raw_user_meta_data->>'first_name', ''), 'New'),
      coalesce(nullif(new.raw_user_meta_data->>'last_name',  ''), 'Member'),
      'member-' || replace(new.id::text, '-', '') ,
      new.email, v_invite.grants_role, v_invite.grants_status, new.id
    );
  else
    update public.people
       set auth_user_id  = new.id,
           email         = coalesce(email, new.email),
           site_role     = greatest(site_role, v_invite.grants_role),
           league_status = v_invite.grants_status
     where id = v_person;
  end if;

  update public.invites
     set use_count = use_count + 1
   where id = v_invite.id;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- This one must never be callable over the REST API — it is a trigger,
-- not an endpoint. v1 had exactly this hole.
revoke execute on function public.handle_new_auth_user() from anon, authenticated;
revoke execute on function public.invite_is_usable(public.invites) from anon;
