#!/usr/bin/env python3
"""
Turns the Season 6 and Season 7 master sheets into migrations.

Run it, review the SQL, commit both. It is deterministic -- same inputs,
same bytes out -- so a correction to roster.tsv or to a sheet is re-run,
never hand-patched.

It invents nothing. A game with no score in the sheet imports as
'canceled' rather than guessed. Player stats land in
imported_player_season_stats because there is no throw log to rebuild one
from. A playoff round the sheet never recorded is simply absent.

    python3 scripts/import/extract.py
"""
import csv, re, sys, unicodedata, difflib
from pathlib import Path
import openpyxl

HERE = Path(__file__).resolve().parent
TRACKERS = HERE.parents[2] / "Old League Trackers"
MIGRATIONS = HERE.parents[1] / "supabase" / "migrations"

SEASONS = {
    6: dict(file="BBDL Season 6 Master Sheet.xlsx", year=2025, term="fall",
            team_col=1, player_cols=(2, 3), rivalry_week=6,
            out="0014_season_6_import.sql"),
    7: dict(file="Copy of BBDL Season 7 Master Sheet.xlsx", year=2026, term="spring",
            team_col=3, player_cols=(1, 2), rivalry_week=6,
            out="0015_season_7_import.sql"),
}

# Player Stats spells some men differently from the roster tab. Values are
# the roster tab's spelling; "name@team" disambiguates the two Peters.
STAT_ALIASES = {
    6: {"peter mil.": "peter m@the queefers", "peter mut.": "peter m@toe ticklers"},
    7: {"justin hemery": "justin", "michael bernstein": "michael",
        "max de la rosa": "max somethin", "matt malarkey": "malarkey",
        "seamus": "moose", "ryan meeks": "ryan"},
}

# The sheets never say which team either Peter played for. They are two
# different men -- 52 roster slots against 52 stat rows proves it -- so both
# are created and this pairing is a GUESS, flagged in the SQL and swappable
# from /admin/teams.
# Neither sheet recorded a final. These come from the commissioner.
#   Season 6: Froomberg and Orlando -- Jumbo Shrimp -- beat La Cosa Nostra.
#   Season 7: Shawah and Scogna -- Sleepy Terrorists. The same pair were
#   La Cosa Nostra, who LOST the Season 6 final, and came back to win.
#
# Season 7's bracket stops at the semi-finals, so its final is added
# here. Its other finalist is still unknown -- whoever won Peas n'
# Pickles vs Dog Eaters -- and is left null for /playoffs to fill in.
PLAYOFF_RESULTS = {
    6: dict(winners={(4, 1): "jumbo-shrimp"}, extra=[]),
    7: dict(winners={(3, 2): "sleepy-terrorists"},
            extra=[dict(rnd=4, mtch=1, t1="sleepy-terrorists", t2=None,
                        win="sleepy-terrorists")]),
}

PETER_SLUG_BY_TEAM = {"queefers": "peter-miller", "toe ticklers": "peter-mut"}

# Names a team was written under in the schedule but never on the roster.
# "Grier" plays in Season 6 weeks 4 and 5, the only two weeks Sabner and
# Turner is absent; Season 7 confirms it, where the same pair enters as
# "Griers Autistic Fishy Clumpy Discharge".
TEAM_ALIASES = {6: {"grier": "sabner and turner"}, 7: {}}


def norm(s) -> str:
    s = unicodedata.normalize("NFKD", str(s)).encode("ascii", "ignore").decode()
    s = s.lower().replace("&", " and ")
    s = re.sub(r"\b(the)\b", " ", s)
    s = re.sub(r"[^a-z0-9]+", " ", s).strip()
    return s.replace("two dudes", "2 dudes").replace("we are ck", "we are charlie kirk")


def slugify(s) -> str:
    s = unicodedata.normalize("NFKD", str(s)).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower() or "x"


def uniq(base, taken):
    s, n = base, 2
    while s in taken:
        s, n = f"{base}-{n}", n + 1
    taken.add(s)
    return s


def q(v):
    return "null" if v in (None, "") else "'" + str(v).replace("'", "''") + "'"


def qs(v):
    """Always a string literal, never null. last_name is NOT NULL even
    though it may be blank — blank means the league never knew it."""
    return "'" + str(v or "").replace("'", "''") + "'"


def num(v):
    return "null" if v is None else str(v)


# ------------------------------------------------------------------ people
def load_roster():
    """-> (people by slug, slot->slug). One person row per distinct
    first+last, which is the rule Ben used when filling the sheet."""
    people, slot, taken = {}, {}, set()
    ident_slug = {}
    for r in csv.DictReader((HERE / "roster.tsv").open(), delimiter="\t"):
        season, team, sheet = int(r["season"]), r["team"].strip(), r["sheet_name"].strip()
        first, last, nick = (r["first_name"].strip(), r["last_name"].strip(),
                             r["nickname"].strip())

        if sheet == "Peter M":
            key = next(s for t, s in PETER_SLUG_BY_TEAM.items() if t in norm(team))
            first, last = "Peter", ("Miller" if key == "peter-miller" else "")
            nick = nick or ("Mut." if key == "peter-mut" else "")
            slug = key
            taken.add(slug)
        else:
            if not first:
                sys.exit(f"roster.tsv: no first name for {sheet!r} (S{season} {team})")
            key = (first.lower(), last.lower())
            if key not in ident_slug:
                ident_slug[key] = uniq(slugify(f"{first} {last}".strip()), taken)
            slug = ident_slug[key]

        prev = people.get(slug)
        people[slug] = dict(first=first, last=last, slug=slug,
                            nick=nick or (prev or {}).get("nick", ""))
        slot[(season, norm(team), norm(sheet))] = slug
    return people, slot


# ------------------------------------------------------------------ sheets
def load_season(n, slot):
    cfg = SEASONS[n]
    wb = openpyxl.load_workbook(TRACKERS / cfg["file"], data_only=True)

    teams, taken = [], set()
    for r in wb["Teams and Rosters"].iter_rows(min_row=2, max_col=4, values_only=True):
        name = (r[cfg["team_col"]] or "").strip()
        if not name:
            continue
        members = []
        for c in cfg["player_cols"]:
            if r[c]:
                k = (n, norm(name), norm(r[c]))
                if k not in slot:
                    sys.exit(f"S{n}: {r[c]!r} on {name!r} is not in roster.tsv")
                members.append(slot[k])
        teams.append(dict(name=name, slug=uniq(slugify(name), taken), members=members))

    canon = {norm(t["name"]): t for t in teams}

    def find(x):
        k = TEAM_ALIASES[n].get(norm(x), norm(x))
        if k in canon:
            return canon[k]
        m = difflib.get_close_matches(k, list(canon), 1, 0.80)
        return canon[m[0]] if m else None

    games, week = [], None
    for r in wb["Schedule and Scores"].iter_rows(min_row=1, max_row=260, max_col=6, values_only=True):
        c = ["" if v is None else str(v).strip() for v in r]
        if c[0].lower().startswith("week"):
            week = int(re.sub(r"\D", "", c[0]) or 0)
            continue
        if not c[1] or not c[3] or c[1].lower() == "team 1":
            continue
        h, a = find(c[1]), find(c[3])
        if not h or not a:
            sys.exit(f"S{n} wk{week}: cannot resolve {c[1]!r} vs {c[3]!r}")
        try:
            hs, as_, status = int(float(c[2])), int(float(c[4])), "final"
        except ValueError:
            hs, as_, status = 0, 0, "canceled"
        games.append(dict(week=week, home=h, away=a, hs=hs, as_=as_, status=status,
                          mvp=c[5],
                          kind="rivalry" if week == cfg["rivalry_week"] else "regular"))

    stats = []
    hdr = [str(x or "") for x in next(wb["Player Stats"].iter_rows(min_row=1, max_row=1, values_only=True))]
    col = {h.lower(): i for i, h in enumerate(hdr) if h}
    rev = {(s, sn): sl for (s, _t, sn), sl in slot.items() if s == n}
    rev_team = {(s, t, sn): sl for (s, t, sn), sl in slot.items() if s == n}
    for r in wb["Player Stats"].iter_rows(min_row=2, values_only=True):
        if not r[0]:
            continue
        alias = STAT_ALIASES[n].get(str(r[0]).strip().lower())
        if alias and "@" in alias:
            nm, tm = alias.split("@")
            slug = next(sl for (s, t, sn), sl in rev_team.items()
                        if sn == norm(nm) and norm(tm) in t)
        else:
            slug = rev.get((n, norm(alias or r[0])))
        if not slug:
            sys.exit(f"S{n}: no person for stat row {r[0]!r}")

        def g(name):
            i = col.get(name)
            if i is None or i >= len(r) or r[i] in (None, ""):
                return None
            try:
                return int(float(r[i]))
            except (TypeError, ValueError):
                return None

        stats.append(dict(slug=slug, gp=g("games played"), pts=g("points"),
                          throws=g("throws attempted"), hits=g("table hits"),
                          catches=g("catches"), fg=g("field goals"), dinks=g("dinks"),
                          sinks=g("sinks"), fifa=g("fifa"), special=g("special points"),
                          laps=g("naked laps"), selfsink=g("self sink"), mvps=g("mvps")))

    # Each column of the bracket sheet holding two or more team names is a
    # round; left to right is first round to last.
    ws = wb["Playoff Bracket"]
    grid = [["" if v is None else str(v).strip() for v in row]
            for row in ws.iter_rows(min_row=1, max_row=ws.max_row, values_only=True)]
    rounds = []
    for ci in range(ws.max_column):
        seq = [find(row[ci]) for row in grid if ci < len(row) and row[ci]]
        seq = [t for t in seq if t]
        if len(seq) >= 2:
            rounds.append(seq)
    return teams, games, stats, rounds, find


# ------------------------------------------------------------------- MVPs
def resolve_mvp(raw, game, people):
    """The sheet records an MVP however the scorekeeper felt like it:
    a first name, a surname, a nickname, a first-initial-plus-surname
    portmanteau ("Solt" for Sam Olt, "Jertel" for John Ertel), or a
    clipped surname ("Monty", "Bernie").

    Matching is scoped to the four men who actually played that game, so
    even a bare "Peter" resolves. Anything still ambiguous is left unset
    rather than guessed -- an MVP is an award, and a wrong one is worse
    than a missing one.
    """
    tag = norm(raw).replace(" ", "")
    if not tag:
        return None, None

    def score(p):
        first, last, nick = norm(p["first"]), norm(p["last"]), norm(p["nick"])
        last = last.replace(" ", "")
        tags = {t for t in (first, last, nick.replace(" ", ""),
                            (first[:1] + last) if first and last else "") if t}
        best = 0.0
        for t in tags:
            if t == tag:
                return 1.0
            # A true prefix: "Rog" for Rogers, "Monty" for Montgomery.
            # Three characters is safe because it must prefix the whole
            # field, and the uniqueness margin below still has to hold.
            if len(tag) >= 3 and (t.startswith(tag) or tag.startswith(t)):
                best = max(best, 0.95)
            if len(tag) >= 4 and len(t) >= 4 and (t.startswith(tag[:4]) or tag.startswith(t[:4])):
                best = max(best, 0.9)
            best = max(best, difflib.SequenceMatcher(None, tag, t).ratio())
        return best

    ranked = sorted(
        ((score(people[sl]), sl)
         for t in (game["home"], game["away"]) for sl in t["members"]),
        key=lambda x: -x[0])
    if ranked and ranked[0][0] >= 0.75 and (
            len(ranked) == 1 or ranked[0][0] - ranked[1][0] >= 0.08):
        return ranked[0][1], None
    top = ranked[0][0] if ranked else 0
    return None, f"{raw!r} (best {top:.2f})"


# -------------------------------------------------------------------- SQL
HEADER = """\
-- =============================================================
-- {mig} — BBDL Season {n} ({termname} {year})
--
-- GENERATED by scripts/import/extract.py from
--   "{src}"
-- Re-run the script rather than editing this file by hand.
--
-- {teams} teams, {games} games ({finals} played, {cancels} with no score
-- recorded in the sheet), {stats} players' season totals, {rounds}
-- playoff rounds.
--
-- What the sheet could not tell us, and this file therefore does not say:
{caveats}
-- =============================================================

"""


def emit(n, cfg, teams, games, stats, rounds, people, mvp_notes, caveats, status_of):
    L = []
    finals = [g for g in games if g["status"] == "final"]
    L.append(HEADER.format(
        mig=cfg["out"].replace(".sql", ""), n=n, year=cfg["year"],
        termname=cfg["term"].title(), src=cfg["file"], teams=len(teams),
        games=len(games), finals=len(finals), cancels=len(games) - len(finals),
        stats=len(stats), rounds=len(rounds),
        caveats="\n".join(f"--   * {c}" for c in caveats)))

    sslug = f"season-{n}"
    L.append("-- ---------- the season ----------")
    L.append(f"""insert into public.seasons (number, name, slug, year, term, status, regular_weeks)
values ({n}, 'BBDL Season {n}', '{sslug}', {cfg['year']}, '{cfg['term']}', 'completed', {cfg['rivalry_week']})
on conflict (number) do nothing;\n""")

    L.append("-- ---------- people ----------")
    L.append("-- on conflict (slug) do nothing: a man already on the site keeps his")
    L.append("-- existing row, so his career spans both seasons instead of forking.")
    L.append("-- league_status is a starting guess: anyone who played the most recent")
    L.append("-- imported season is 'player', everyone else 'alumni'. Fix from /admin/people.")
    L.append("insert into public.people (first_name, last_name, nickname, slug, league_status) values")
    rows = [f"  ({q(p['first'])}, {qs(p['last'])}, {q(p['nick'])}, {q(p['slug'])}, "
            f"{q(status_of(p['slug']))})"
            for p in sorted(people.values(), key=lambda x: x["slug"])]
    L.append(",\n".join(rows) + "\non conflict (slug) do nothing;\n")

    L.append("-- ---------- teams ----------")
    L.append("""insert into public.teams (season_id, name, slug, approved)
select s.id, v.name, v.slug, true
  from public.seasons s, (values""")
    L.append(",\n".join(f"    ({q(t['name'])}, {q(t['slug'])})" for t in teams))
    L.append(f"""  ) as v(name, slug)
 where s.slug = '{sslug}'
on conflict (season_id, slug) do nothing;\n""")

    L.append("-- ---------- rosters ----------")
    L.append("""insert into public.team_members (team_id, person_id, role)
select t.id, p.id, 'starter'
  from public.seasons s
  join public.teams t on t.season_id = s.id
  join (values""")
    pairs = [(t["slug"], m) for t in teams for m in t["members"]]
    L.append(",\n".join(f"    ({q(a)}, {q(b)})" for a, b in pairs))
    L.append(f"""  ) as v(team_slug, person_slug) on v.team_slug = t.slug
  join public.people p on p.slug = v.person_slug
 where s.slug = '{sslug}'
on conflict (team_id, person_id) do nothing;\n""")

    L.append("-- ---------- games ----------")
    L.append("-- winner_team_id is set here rather than left to maybe_finalize_game():")
    L.append("-- that trigger fires on confirmations, and a game played in 2025 has")
    L.append("-- nobody left to confirm it.")
    L.append("""insert into public.games
       (season_id, kind, week, home_team_id, away_team_id, status,
        home_score, away_score, winner_team_id)
select s.id, v.kind::game_kind, v.week, h.id, a.id, v.status::game_status,
       v.hs, v.as_,
       case when v.status <> 'final' then null
            when v.hs > v.as_ then h.id
            when v.as_ > v.hs then a.id end
  from public.seasons s
 cross join (values""")
    L.append(",\n".join(
        f"    ({q(g['kind'])}, {g['week']}, {q(g['home']['slug'])}, "
        f"{q(g['away']['slug'])}, {q(g['status'])}, {g['hs']}, {g['as_']})"
        for g in games))
    L.append(f"""  ) as v(kind, week, home_slug, away_slug, status, hs, as_)
  join public.teams h on h.season_id = s.id and h.slug = v.home_slug
  join public.teams a on a.season_id = s.id and a.slug = v.away_slug
 where s.slug = '{sslug}';\n""")

    L.append("-- ---------- who played ----------")
    L.append("-- Each team has exactly two men, so this yields the four the")
    L.append("-- game_participants guard requires. Canceled games get nobody.")
    L.append(f"""insert into public.game_participants (game_id, person_id, team_id)
select g.id, tm.person_id, tm.team_id
  from public.games g
  join public.seasons s on s.id = g.season_id and s.slug = '{sslug}'
  join public.team_members tm
    on tm.team_id in (g.home_team_id, g.away_team_id)
 where g.status = 'final'
on conflict (game_id, person_id) do nothing;\n""")

    mvps = [(g, s) for g, s in mvp_notes if s]
    if mvps:
        L.append(f"-- ---------- recorded MVPs ({len(mvps)}) ----------")
        L.append("""update public.games g
   set imported_mvp_person_id = p.id
  from public.seasons s, public.teams h, public.teams a,
       public.people p, (values""")
        L.append(",\n".join(
            f"    ({g['week']}, {q(g['home']['slug'])}, {q(g['away']['slug'])}, {q(slug)})"
            for g, slug in mvps))
        L.append(f"""  ) as v(week, home_slug, away_slug, person_slug)
 where s.slug = '{sslug}' and g.season_id = s.id
   and h.id = g.home_team_id and a.id = g.away_team_id
   and g.week = v.week and h.slug = v.home_slug and a.slug = v.away_slug
   and p.slug = v.person_slug;\n""")

    L.append(f"-- ---------- season totals from the sheet ({len(stats)} players) ----------")
    L.append("-- Aggregates, not a throw log — see 0012. games_played here is the")
    L.append("-- sheet's own figure, kept for provenance and NOT used for stats:")
    L.append("-- tracking was abandoned partway through, so it undercounts.")
    L.append("""insert into public.imported_player_season_stats
       (season_id, person_id, total_points, throws, table_hits, catches,
        field_goals, dinks, sinks, fifas, special_points, naked_laps,
        self_sinks, mvps, source_games_played, source)
-- Explicit casts: a VALUES column that is null in every row -- and in
-- Season 6 several are, since the sheet never recorded a self sink --
-- is inferred as text and will not go into an integer column.
select s.id, p.id, v.pts::integer, v.throws::integer, v.hits::integer,
       v.catches::integer, v.fg::integer, v.dinks::integer,
       v.sinks::integer, v.fifa::integer, v.special::integer,
       v.laps::integer, v.selfsink::integer, v.mvps::integer, v.gp::integer,""")
    L.append(f"       {q(cfg['file'])}\n  from public.seasons s\n cross join (values")
    L.append(",\n".join(
        "    ({}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {})".format(
            q(x["slug"]), num(x["pts"]), num(x["throws"]), num(x["hits"]),
            num(x["catches"]), num(x["fg"]), num(x["dinks"]), num(x["sinks"]),
            num(x["fifa"]), num(x["special"]), num(x["laps"]), num(x["selfsink"]),
            num(x["mvps"]), num(x["gp"])) for x in stats))
    L.append(f"""  ) as v(person_slug, pts, throws, hits, catches, fg, dinks, sinks,
          fifa, special, laps, selfsink, mvps, gp)
  join public.people p on p.slug = v.person_slug
 where s.slug = '{sslug}'
on conflict (season_id, person_id) do nothing;\n""")

    if rounds:
        L.append("-- ---------- playoffs ----------")
        # 'completed', not 'complete': season_champions filters on the
        # exact string, so the wrong one leaves the champion invisible.
        L.append(f"""insert into public.playoffs (season_id, name, status)
select s.id, 'BBDL Season {n} Playoffs', 'completed'
  from public.seasons s where s.slug = '{sslug}';\n""")
        L.append("""insert into public.playoff_matches
       (playoff_id, round_number, match_number, team1_id, team2_id, winner_id, status)
select po.id, v.rnd, v.mtch, t1.id, t2.id, w.id,
       case when w.id is null then 'pending' else 'complete' end
  from public.playoffs po
  join public.seasons s on s.id = po.season_id
 cross join (values""")
        res = PLAYOFF_RESULTS.get(n, dict(winners={}, extra=[]))
        vals = []
        for ri, seq in enumerate(rounds, 1):
            nxt = rounds[ri] if ri < len(rounds) else None
            for mi in range(0, len(seq) - 1, 2):
                t1, t2 = seq[mi], seq[mi + 1]
                mn = mi // 2 + 1
                # Who advanced is normally read off the next round. The
                # last round has no next round, so its result is supplied.
                win = res["winners"].get((ri, mn))
                if win is None and nxt:
                    adv = {t["slug"] for t in nxt}
                    hit = [t["slug"] for t in (t1, t2) if t["slug"] in adv]
                    win = hit[0] if len(hit) == 1 else None
                vals.append(f"    ({ri}, {mn}, {q(t1['slug'])}, "
                            f"{q(t2['slug'])}, {q(win)})")
        for e in res["extra"]:
            vals.append(f"    ({e['rnd']}, {e['mtch']}, {q(e['t1'])}, "
                        f"{q(e['t2'])}, {q(e['win'])})")
        L.append(",\n".join(vals))
        L.append(f"""  ) as v(rnd, mtch, t1_slug, t2_slug, win_slug)
  join public.teams t1 on t1.season_id = s.id and t1.slug = v.t1_slug
  left join public.teams t2 on t2.season_id = s.id and t2.slug = v.t2_slug
  left join public.teams w on w.season_id = s.id and w.slug = v.win_slug
 where s.slug = '{sslug}'
on conflict (playoff_id, round_number, match_number) do nothing;\n""")

    (MIGRATIONS / cfg["out"]).write_text("\n".join(L))
    return len(finals)


def main():
    people, slot = load_roster()
    print(f"roster: {len(people)} people\n")

    loaded = {n: load_season(n, slot) for n in SEASONS}
    # Whoever played the most recent imported season is presumed still
    # around; everyone else is an alum. Both are editable in /admin/people.
    latest = max(loaded)
    current = {m for t in loaded[latest][0] for m in t["members"]}

    def status_of(slug):
        return "player" if slug in current else "alumni"

    for n, cfg in SEASONS.items():
        teams, games, stats, rounds, _ = loaded[n]
        # Only the men who actually played this season belong in this
        # season's migration.
        mine = {m for t in teams for m in t["members"]}
        season_people = {k: v for k, v in people.items() if k in mine}

        notes, unresolved = [], []
        for g in games:
            slug, why = resolve_mvp(g["mvp"], g, people)
            notes.append((g, slug))
            if g["mvp"] and not slug:
                unresolved.append(why)

        caveats = []
        cancels = [g for g in games if g["status"] != "final"]
        if cancels:
            caveats.append(f"{len(cancels)} games have no score in the sheet; "
                           "they import as 'canceled'.")
        if n == 7:
            caveats.append("Season 7's other finalist is unknown: whoever won "
                           "Peas n' Pickles vs Dog Eaters. Set it from /playoffs.")
        if n == 6:
            caveats.append("Two men played as 'Peter M'. Which team each was on "
                           "is a GUESS: swap them from /admin/teams if wrong.")
        if unresolved:
            caveats.append(f"{len(unresolved)} MVP entries matched no player in "
                           "that game (all of them read 'Forefeit') and are unset.")

        played = emit(n, cfg, teams, games, stats, rounds, season_people,
                      notes, caveats, status_of)
        got = sum(1 for _, sl in notes if sl)
        print(f"S{n}: {len(teams)} teams, {len(season_people)} people, {len(games)} games "
              f"({played} played), {len(stats)} stat rows, {len(rounds)} rounds, "
              f"{got}/{sum(1 for g in games if g['mvp'])} MVPs -> {cfg['out']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
