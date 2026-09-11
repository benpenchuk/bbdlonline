import { test } from "node:test";
import assert from "node:assert/strict";
import { generateSchedule, maxRoundsFor, autoPairLeftovers } from "./schedule.ts";

const sizes = [4, 6, 8, 25, 26, 31, 35];

function ids(n: number) {
  return Array.from({ length: n }, (_, i) => `t${i}`);
}

test("no matchup ever repeats within a season", () => {
  for (const n of sizes) {
    const { pairings } = generateSchedule(ids(n), 5);
    const seen = new Set<string>();
    for (const p of pairings) {
      const key = [p.homeTeamId, p.awayTeamId].sort().join("|");
      assert.ok(!seen.has(key), `${n} teams: ${key} scheduled twice`);
      seen.add(key);
    }
  }
});

test("a team never plays twice in the same week", () => {
  for (const n of sizes) {
    const { pairings } = generateSchedule(ids(n), 5);
    const byWeek = new Map<number, Set<string>>();
    for (const p of pairings) {
      const week = byWeek.get(p.week) ?? new Set<string>();
      for (const t of [p.homeTeamId, p.awayTeamId]) {
        assert.ok(!week.has(t), `${n} teams: ${t} plays twice in week ${p.week}`);
        week.add(t);
      }
      byWeek.set(p.week, week);
    }
  }
});

test("every team is accounted for each week, by a game or a bye", () => {
  for (const n of sizes) {
    const weeks = Math.min(5, maxRoundsFor(n));
    const { pairings, byes } = generateSchedule(ids(n), 5);
    for (let w = 1; w <= weeks; w++) {
      const playing = pairings.filter((p) => p.week === w).length * 2;
      const resting = byes.filter((b) => b.week === w).length;
      assert.equal(playing + resting, n, `${n} teams, week ${w}`);
    }
  }
});

test("an odd roster gives exactly one bye per week", () => {
  const { byes } = generateSchedule(ids(25), 5);
  for (let w = 1; w <= 5; w++) {
    assert.equal(byes.filter((b) => b.week === w).length, 1);
  }
});

test("too few teams caps the season rather than repeating matchups", () => {
  // 4 teams cannot fill 5 non-repeating rounds; it should stop at 3.
  const { pairings } = generateSchedule(ids(4), 5);
  assert.equal(Math.max(...pairings.map((p) => p.week)), 3);
});

test("rivalry leftovers pair up, with at most one team left over", () => {
  for (const n of [2, 3, 8, 9]) {
    const { pairs, unpaired } = autoPairLeftovers(ids(n));
    assert.equal(pairs.length * 2 + unpaired.length, n);
    assert.ok(unpaired.length <= 1);
  }
});
