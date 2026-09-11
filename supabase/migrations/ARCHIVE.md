# Pre-2026 migration history

Before this rebuild, BBDL's schema existed **only inside Supabase** — nothing in
this repo described it. Eleven migrations were applied through the dashboard and
the API between October and November 2025:

| Version | Name |
|---|---|
| 20251021032743 | add_demo_season_data |
| 20251021033551 | create_full_30_team_season |
| 20251021033659 | add_regular_season_games |
| 20251021033804 | update_stats_and_create_playoffs_v2 |
| 20251030030408 | drop_old_schema_and_create_clean_uuid_schema |
| 20251031013318 | rename_tournaments_to_playoffs |
| 20251031014205 | add_table_hit_percentage |
| 20251113020220 | add_announcements_table |
| 20251113020236 | add_photos_table |
| 20251113025831 | add_week_to_games |
| 20251127163246 | fix_user_signup_trigger |

Every object those migrations created was dropped by `0001_identity.sql`. The
schema they describe no longer exists, so their SQL is not reproduced here —
roughly 73 KB of DDL for tables that are gone would be dead weight in a repo
whose whole point is being readable by the next commissioner.

The full text is still recoverable two ways: the
`supabase_migrations.schema_migrations` table in the project, and the daily
backups on the Pro plan.

One of them is worth knowing about. `fix_user_signup_trigger` created a
`handle_new_user()` function that inserted into a `public.users` table which
never existed in this project — it appears to have been copied from another
Supabase project (it references a `group_ids` column BBDL never had). It was
attached to `auth.users` and would have failed **every single signup**. It is
dropped in `0001_identity.sql`.

---

## Migrations from here on

Files in this directory are a clean **build-from-zero** record, not a transcript
of how the database actually got here. Applying `0001` through `0005` in order
against an empty project reproduces the current schema exactly.

The live project's migration ledger has a few extra entries from the rebuild
session (a split-out type-drop step, and a follow-up fixing a trigger that was
wrongly declared `FOR EACH STATEMENT`). Those corrections are folded into the
files where they belong — `0001` drops the orphaned v1 enum types inline, and
`0003` declares the resync trigger `FOR EACH ROW` from the start — so a fresh
build never reproduces either mistake.
