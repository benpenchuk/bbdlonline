#!/usr/bin/env python3
"""
Emits roster.tsv — the sheet-name-to-human mapping the Season 6 import
cannot infer on its own.

public.people needs a real first and last name plus a unique slug, but
the Season 6 master sheet identifies players as "First L", and four as a
bare surname. Worse, two different men are both "Peter M".

Three sources are combined here, best first:

  1. The Season 7 master sheet, whose Google Form collected full names,
     and whose roster overlaps Season 6 heavily. This is also what makes
     career stats work at all -- a Season 6 player must resolve to the
     SAME person row as his Season 7 self, not a duplicate.
  2. The Season 6 Statistical Leaders tab, which spells some names out.
  3. The Season 6 Week 1 MVP column, whose surnames corroborate several
     of the above (Kinnie, Hemery, Scogna, Cirelli, Solt, Froomberg).

Whatever is left is genuinely not in either spreadsheet, and a human
fills it in. Nothing is guessed.
"""
import csv, sys
from pathlib import Path
import openpyxl

ROOT = Path(__file__).resolve().parents[3] / "Old League Trackers"
S6 = ROOT / "BBDL Season 6 Master Sheet.xlsx"
S7 = ROOT / "Copy of BBDL Season 7 Master Sheet.xlsx"
OUT = Path(__file__).resolve().parent / "roster.tsv"

# Spelled out on the Season 6 Statistical Leaders tab, where Season 7
# has only a first name or nothing at all.
S6_LEADERS = {
    "Yossi B": "Yossi Yang Bernal Zhou",
    "James N": "James Nicholas",
}

# From the Season 7 Google Form, which carries names the Player Stats
# tab shortens away.
S7_FORM = {
    "Sabner": "Sam Abner",     # "Sabner and Turner" is Abner + Turner
    "Turner": "Liam Turner",
    "Bryan F": "Bryan Floyd",  # form free-text + the Week 2 MVP "Floyd"
}

# Two men named Peter M played Season 6, on The Queefers and on Toe
# Ticklers. The Player Stats tab separates them as "Peter Mil." and
# "Peter Mut." but never says which team either played for, and only
# Peter Miller appears in Season 7. A human has to say which is which.
AMBIGUOUS_NOTE = "two different men named Peter M — say which team Peter Miller played for"


def s7_full_names() -> list[str]:
    wb = openpyxl.load_workbook(S7, data_only=True)
    pool: set[str] = set()
    for r in wb["Form Responses 1"].iter_rows(min_row=2, values_only=True):
        for v in (r[1], r[2]):
            if v:
                pool.add(str(v).strip())
    for r in wb["Player Stats"].iter_rows(min_row=2, values_only=True):
        if r[0]:
            pool.add(str(r[0]).strip())
    # A "surname" of one letter is the same placeholder Season 6 uses
    # ("Adam w", "Chris H"). It resolves nothing, so it is not a match.
    return [p for p in pool
            if len(p.split()) >= 2 and len(p.split()[-1].rstrip(".")) > 1]


def rosters() -> list[tuple[int, str, str]]:
    """(season, team, sheet_name) for both seasons.

    The two sheets put the team name in different columns -- Season 6 has
    it in B with the players in C/D, Season 7 has the players in B/C and
    the team in D -- so the column map is per season, not shared."""
    out = []
    for season, path, team_col, player_cols in (
        (6, S6, 1, (2, 3)),
        (7, S7, 3, (1, 2)),
    ):
        wb = openpyxl.load_workbook(path, data_only=True)
        for r in wb["Teams and Rosters"].iter_rows(min_row=2, max_col=4, values_only=True):
            team = (r[team_col] or "").strip()
            if not team:
                continue
            for c in player_cols:
                if r[c]:
                    out.append((season, team, str(r[c]).strip()))
    return out


def resolve(sheet_name: str, pool: list[str]) -> list[str]:
    """Season 7 names whose first name matches and whose surname starts
    with the Season 6 initial. Case-insensitive; the sheets are not
    consistent about capitalisation ('john ertel' vs 'John Ertel')."""
    parts = sheet_name.split()
    first = parts[0].lower()
    initial = parts[1].rstrip(".").lower() if len(parts) > 1 else None
    hits = []
    for cand in pool:
        cp = cand.split()
        if cp[0].lower() != first:
            continue
        if initial and not " ".join(cp[1:]).lower().startswith(initial):
            continue
        hits.append(cand)
    # collapse pure case-duplicates ('John Cirelli' / 'john cirelli')
    seen, uniq = set(), []
    for h in hits:
        if h.lower() not in seen:
            seen.add(h.lower())
            uniq.append(h)
    return uniq


def titlecase(name: str) -> tuple[str, str]:
    parts = name.split()
    first = parts[0][:1].upper() + parts[0][1:]
    last = " ".join(p[:1].upper() + p[1:] for p in parts[1:])
    return first, last


def main() -> int:
    pool = s7_full_names()
    roster = rosters()
    # Ambiguity is per season: "Peter M" is two men within Season 6, but
    # the same sheet_name across seasons is the same man.
    counts: dict[tuple[int, str], int] = {}
    for season, _, name in roster:
        counts[(season, name)] = counts.get((season, name), 0) + 1
    dupes = {k for k, v in counts.items() if v > 1}

    rows, resolved = [], 0
    for season, team, name in roster:
        first = last = ""
        source = ""
        note = ""

        if name in S6_LEADERS:
            first, last = titlecase(S6_LEADERS[name])
            source = "s6-leaders"
        elif name in S7_FORM:
            first, last = titlecase(S7_FORM[name])
            source = "s7-form"
        else:
            hits = resolve(name, pool)
            if len(hits) == 1 and (season, name) not in dupes:
                first, last = titlecase(hits[0])
                source = "s7-roster"
            elif (season, name) in dupes:
                note = AMBIGUOUS_NOTE
            elif hits:
                note = "multiple matches: " + ", ".join(hits)

        if first and last:
            resolved += 1
        else:
            note = note or "not in either spreadsheet — needs a surname"

        rows.append([season, team, name, first, last, "", source, note])

    # ---- cross-season link pass ----
    # A man must resolve to ONE person row or his career stats split in
    # two. The sheets spell him differently between seasons ("Yossi B"
    # in 6, "Yossi" in 7), so anything still unresolved is matched by
    # first name against what the other season already resolved -- but
    # only when that produces exactly one candidate. "Justin" stays
    # unresolved on purpose: Hemery and Leach both played.
    by_first: dict[str, set[str]] = {}
    for r in rows:
        if r[3] and r[4]:
            by_first.setdefault(r[2].split()[0].lower(), set()).add(f"{r[3]} {r[4]}")

    for r in rows:
        if r[3]:
            continue
        cands = by_first.get(r[2].split()[0].lower(), set())
        if len(cands) == 1:
            r[3], r[4] = titlecase(next(iter(cands)))
            r[5] = r[2] if r[2] != f"{r[3]} {r[4]}" else ""
            r[6] = "cross-season"
            r[7] = ""
            resolved += 1

    # Same name together, so a human filling the gaps can see at a glance
    # when two rows are one person.
    rows.sort(key=lambda r: (r[2].split()[0].lower(), r[2], r[0]))

    with OUT.open("w", newline="") as fh:
        w = csv.writer(fh, delimiter="\t")
        w.writerow(["season", "team", "sheet_name", "first_name", "last_name",
                    "nickname", "source", "note"])
        w.writerows(rows)

    print(f"wrote {OUT}")
    print(f"  {len(rows)} players — {resolved} resolved, {len(rows) - resolved} need a human")
    return 0


if __name__ == "__main__":
    sys.exit(main())
