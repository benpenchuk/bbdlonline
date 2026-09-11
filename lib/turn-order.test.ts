import { test } from "node:test";
import assert from "node:assert/strict";
import { turnState, isGameOver, type LoggedThrow } from "./turn-order.ts";

const A = "teamA";
const B = "teamB";
const roster: Record<string, string[]> = { [A]: ["a1", "a2"], [B]: ["b1", "b2"] };
const rosterOf = (t: string) => roster[t];

function thrown(thrower: string, outcome = "missed"): LoggedThrow {
  return {
    thrower_id: thrower,
    thrower_team_id: thrower.startsWith("a") ? A : B,
    outcome,
  };
}

test("the first turn asks who leads", () => {
  const s = turnState([], B, A, rosterOf);
  assert.equal(s.teamId, B);
  assert.equal(s.needsPick, true);
  assert.equal(s.throwerId, null);
});

test("the second throw of a turn is forced to the partner", () => {
  const s = turnState([thrown("b2")], B, A, rosterOf);
  assert.equal(s.needsPick, false);
  assert.equal(s.throwerId, "b1");
  assert.equal(s.slot, 2);
});

test("after two throws the other team is up, and is asked who leads", () => {
  const s = turnState([thrown("b2"), thrown("b1")], B, A, rosterOf);
  assert.equal(s.teamId, A);
  assert.equal(s.needsPick, true);
});

test("either partner may lead a turn — order can differ turn to turn", () => {
  // B led with b2 first turn; now B leads with b1
  const history = [
    thrown("b2"), thrown("b1"),   // B's turn
    thrown("a2"), thrown("a1"),   // A's turn
  ];
  const s = turnState(history, B, A, rosterOf);
  assert.equal(s.teamId, B);
  assert.equal(s.needsPick, true, "B must be asked again, not forced back to b2");

  // tracker picks b1 this time; b2 is then forced
  const after = turnState([...history, thrown("b1")], B, A, rosterOf);
  assert.equal(after.throwerId, "b2");
});

test("a rethrow keeps the same guy up and does not burn his slot", () => {
  const s = turnState([thrown("b1", "rethrow")], B, A, rosterOf);
  assert.equal(s.throwerId, "b1");
  assert.equal(s.rethrow, true);
  assert.equal(s.slot, 1, "still the first throw of the turn");

  // he throws for real; his partner is now up
  const next = turnState([thrown("b1", "rethrow"), thrown("b1", "dink")], B, A, rosterOf);
  assert.equal(next.throwerId, "b2");
  assert.equal(next.slot, 2);
});

test("consecutive rethrows keep him up indefinitely", () => {
  const s = turnState(
    [thrown("b1", "rethrow"), thrown("b1", "rethrow"), thrown("b1", "rethrow")],
    B, A, rosterOf,
  );
  assert.equal(s.throwerId, "b1");
  assert.equal(s.slot, 1);
});

test("Ben's worked example replays exactly", () => {
  // B starts. B2 then B1. A2 then A1. B leads with B1 this time, rethrows,
  // then B2. Then A leads with A1, and A2 is forced next.
  const history: LoggedThrow[] = [];
  const expect = (team: string, thrower: string | null, needsPick: boolean) => {
    const s = turnState(history, B, A, rosterOf);
    assert.equal(s.teamId, team);
    assert.equal(s.needsPick, needsPick);
    if (!needsPick) assert.equal(s.throwerId, thrower);
  };

  expect(B, null, true);          history.push(thrown("b2", "point"));
  expect(B, "b1", false);         history.push(thrown("b1", "missed"));
  expect(A, null, true);          history.push(thrown("a2", "point"));
  expect(A, "a1", false);         history.push(thrown("a1", "missed"));
  expect(B, null, true);          history.push(thrown("b1", "rethrow"));
  expect(B, "b1", false);         history.push(thrown("b1", "dink"));
  expect(B, "b2", false);         history.push(thrown("b2", "missed"));
  expect(A, null, true);          history.push(thrown("a1", "point"));
  expect(A, "a2", false);
});

test("undo rewinds cleanly — state is a pure function of history", () => {
  const history = [thrown("b2"), thrown("b1"), thrown("a2")];
  const before = turnState(history.slice(0, 2), B, A, rosterOf);
  const afterUndo = turnState(history.slice(0, 2), B, A, rosterOf);
  assert.deepEqual(before, afterUndo);
});

test("game ends on target and win-by", () => {
  assert.equal(isGameOver(11, 9, 11, 2, null), true);
  assert.equal(isGameOver(11, 10, 11, 2, null), false, "must win by 2");
  assert.equal(isGameOver(13, 11, 11, 2, null), true);
  assert.equal(isGameOver(10, 3, 11, 2, null), false);
});

test("a point cap ends a runaway deuce", () => {
  assert.equal(isGameOver(15, 14, 11, 2, 15), true);
  assert.equal(isGameOver(15, 14, 11, 2, null), false);
});
