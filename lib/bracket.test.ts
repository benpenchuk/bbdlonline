import { test } from "node:test";
import assert from "node:assert/strict";
import { buildBracket, seedOrder, roundName } from "./bracket.ts";

test("seed order keeps the top two apart until the final", () => {
  assert.deepEqual(seedOrder(2), [1, 2]);
  assert.deepEqual(seedOrder(4), [1, 4, 2, 3]);
  assert.deepEqual(seedOrder(8), [1, 8, 4, 5, 2, 7, 3, 6]);
});

test("a power-of-two field has no byes", () => {
  for (const n of [2, 4, 8, 16]) {
    const { byes, rounds } = buildBracket(n);
    assert.equal(byes.length, 0, `${n} teams`);
    assert.equal(rounds, Math.log2(n));
  }
});

test("an awkward field gives byes to the top seeds", () => {
  const { byes } = buildBracket(6);
  // 6 teams in an 8 bracket: seeds 1 and 2 sit out round one
  assert.deepEqual(byes.sort((a, b) => a - b), [1, 2]);
});

test("13 teams — the top half of a 26-team league — builds cleanly", () => {
  const { matches, rounds, byes } = buildBracket(13);
  assert.equal(rounds, 4, "16-team bracket");
  assert.equal(byes.length, 3, "16 - 13 = 3 byes");
  // every seed appears exactly once in round one
  const seeds = matches
    .filter((m) => m.round === 1)
    .flatMap((m) => [m.team1Seed, m.team2Seed])
    .filter((s): s is number => s !== null);
  assert.equal(new Set(seeds).size, 13);
});

test("each round halves the number of matches", () => {
  const { matches, rounds } = buildBracket(16);
  for (let r = 1; r <= rounds; r++) {
    const count = matches.filter((m) => m.round === r).length;
    assert.equal(count, 16 / 2 ** r);
  }
});

test("rounds are named from the end, not the start", () => {
  assert.equal(roundName(4, 4), "Final");
  assert.equal(roundName(3, 4), "Semifinals");
  assert.equal(roundName(2, 4), "Quarterfinals");
  assert.equal(roundName(1, 4), "Round 1");
  assert.equal(roundName(1, 1), "Final");
});
