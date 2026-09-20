-- =============================================================
-- 0013 — A man owns his own name
--
-- Two changes, both forced by the same fact: the league does not know
-- everybody's surname, and never did.
--
-- 1. last_name may now be blank.
--    0001 required a non-empty surname. The Season 6 and 7 master
--    sheets identify several players by a first name alone -- the
--    Season 7 roster literally lists one as "Max somethin" -- and there
--    is no surname to be found for them anywhere. Requiring one would
--    mean inventing it. Blank means unknown, and it is the player
--    himself who is best placed to fix it.
--
-- 2. A member may edit his own first and last name.
--    0001 reserved both to the commissioner "so the roster stays
--    honest". That was the right call when names came from an invite,
--    but the imported seasons arrive with names typed off a
--    spreadsheet by somebody else, and guessed initials for surnames.
--    The man himself is the authority on his own name.
--
-- Everything else the guard protects is unchanged: site_role,
-- league_status, email, auth_user_id and slug all stay out of reach.
-- slug in particular stays locked on purpose -- it is in the URL of
-- his player page, and letting a rename break every link to it would
-- be a poor trade for the convenience.
-- =============================================================

alter table public.people drop constraint if exists people_last_name_check;

alter table public.people
  add constraint people_last_name_known_or_blank
  check (last_name = trim(last_name));

comment on column public.people.last_name is
  'Blank means the league does not know it. The player can fill it in from his own profile page.';

create or replace function public.guard_people_fields()
returns trigger language plpgsql security invoker
set search_path = public, pg_temp as $$
begin
  -- No end user in the request: a trigger, a migration, or the service
  -- role. The guard polices what a MEMBER may edit about himself, so
  -- none of those should be subject to it.
  --
  -- This line is load-bearing. Without it, handle_new_auth_user() is
  -- blocked from binding a new account — it sets auth_user_id, email,
  -- site_role and league_status, all protected, while auth.uid() is
  -- still null because the member is not authenticated yet. Signup then
  -- dies with "Database error saving new user".
  --
  -- It opens no hole: `anon` has no UPDATE grant on people and the RLS
  -- policy is scoped `to authenticated`, so an unauthenticated request
  -- never reaches this trigger at all.
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

  -- A member owns his name, nickname and photo. He may not rename
  -- himself out of existence, though: first_name is what the site falls
  -- back to when there is no surname.
  if length(trim(coalesce(new.first_name, ''))) = 0 then
    raise exception 'You need a first name.';
  end if;

  if new.site_role     is distinct from old.site_role     or
     new.league_status is distinct from old.league_status or
     new.slug          is distinct from old.slug          or
     new.email         is distinct from old.email         or
     new.auth_user_id  is distinct from old.auth_user_id then
    raise exception 'You can change your name, nickname and photo. Ask the commissioner for anything else.';
  end if;

  return new;
end;
$$;
