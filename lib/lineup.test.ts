import { test } from "node:test";
import assert from "node:assert/strict";
import { defaultLineup, needsChoosing, validateLineup } from "./lineup.ts";

const A = "teamA";
const B = "teamB";
const twoEach = [
  { id: "a1", teamId: A }, { id: "a2", teamId: A },
  { id: "b1", teamId: B }, { id: "b2", teamId: B },
];
const withSub = [...twoEach, { id: "a3", teamId: A }];

test("two-player rosters fill the lineup with no choosing", () => {
  assert.deepEqual(defaultLineup(twoEach, [A, B]).sort(), ["a1", "a2", "b1", "b2"]);
  assert.equal(needsChoosing(twoEach, A), false);
});

test("a team carrying a sub must be chosen, not defaulted", () => {
  // this is the bug: a sub must never be swept in automatically
  assert.deepEqual(defaultLineup(withSub, [A, B]).sort(), ["b1", "b2"]);
  assert.equal(needsChoosing(withSub, A), true);
  assert.equal(needsChoosing(withSub, B), false);
});

test("a valid lineup passes, including one that plays the sub", () => {
  assert.equal(validateLineup(["a1", "a2", "b1", "b2"], withSub, [A, B]), null);
  assert.equal(validateLineup(["a1", "a3", "b1", "b2"], withSub, [A, B]), null);
});

test("three on one side is refused", () => {
  assert.match(validateLineup(["a1", "a2", "a3", "b1", "b2"], withSub, [A, B])!, /exactly two/);
});

test("one on a side is refused", () => {
  assert.match(validateLineup(["a1", "b1", "b2"], twoEach, [A, B])!, /exactly two/);
});

test("someone from outside both rosters is refused", () => {
  assert.match(validateLineup(["a1", "x9", "b1", "b2"], twoEach, [A, B])!, /rosters/);
});

test("a duplicated player is refused", () => {
  assert.match(validateLineup(["a1", "a1", "b1", "b2"], twoEach, [A, B])!, /twice/);
});

test("a short roster is reported as the real problem", () => {
  const short = [{ id: "a1", teamId: A }, { id: "b1", teamId: B }, { id: "b2", teamId: B }];
  assert.match(validateLineup(["a1", "b1", "b2"], short, [A, B])!, /at least two/);
});
