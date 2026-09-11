/**
 * Whose throw is it?
 *
 * BBDL turn order, as actually played:
 *   - Teams alternate turns. A turn is two throws, one from each partner.
 *   - Within a turn, EITHER partner may lead, and it can change turn to turn.
 *     So B2→B1, then A2→A1, then B1→B2 is all legal.
 *   - A rethrow ("stayed on the table and called it") means the same guy
 *     throws again. It does not consume his slot in the turn.
 *
 * Only one thing is ever genuinely unknown: who leads a turn. Everything else
 * is forced, so the tracker asks exactly one question per turn and nothing more.
 */

export type LoggedThrow = {
  thrower_id: string;
  thrower_team_id: string;
  outcome: string;
};

export type TurnState = {
  /** whose turn it is */
  teamId: string;
  /** the forced thrower, or null when the tracker must pick who leads */
  throwerId: string | null;
  needsPick: boolean;
  /** 1 or 2 — which throw of this turn */
  slot: number;
  /** true when the previous throw was a rethrow and the same guy is still up */
  rethrow: boolean;
};

export function turnState(
  throws: LoggedThrow[],
  startTeamId: string,
  otherTeamId: string,
  rosterOf: (teamId: string) => string[],
): TurnState {
  let teamId = startTeamId;
  let done: string[] = [];

  for (const t of throws) {
    if (t.outcome === "rethrow") continue; // slot not consumed
    done.push(t.thrower_id);
    if (done.length === 2) {
      teamId = teamId === startTeamId ? otherTeamId : startTeamId;
      done = [];
    }
  }

  const last = throws[throws.length - 1];
  if (last && last.outcome === "rethrow") {
    return {
      teamId,
      throwerId: last.thrower_id,
      needsPick: false,
      slot: done.length + 1,
      rethrow: true,
    };
  }

  if (done.length === 0) {
    return { teamId, throwerId: null, needsPick: true, slot: 1, rethrow: false };
  }

  const partner = rosterOf(teamId).find((p) => p !== done[0]) ?? null;
  return { teamId, throwerId: partner, needsPick: false, slot: 2, rethrow: false };
}

/** Fifa ladder: a team's Nth fifa of the game needs N kicks before the catch. */
export function fifaKicksFor(throws: LoggedThrow[], defendingTeamId: string, scoringTeamOf: (t: LoggedThrow) => string | null): number {
  return (
    throws.filter((t) => t.outcome === "fifa" && scoringTeamOf(t) === defendingTeamId)
      .length + 1
  );
}

export const OUTCOME_POINTS: Record<string, number> = {
  point: 1,
  dink: 2,
  sink: 3,
  field_goal: 2,
  fifa: 1,
  caught: 0,
  missed: 0,
  rethrow: 0,
};

/** Accuracy denominator rule: a die that stayed on the table never completed
 *  the throw, so it is a throw but not a table hit. */
export const COUNTS_AS_HIT = new Set(["point", "dink", "sink", "field_goal", "caught"]);

export function isGameOver(
  homeScore: number,
  awayScore: number,
  target: number,
  winBy: number,
  cap: number | null,
): boolean {
  const hi = Math.max(homeScore, awayScore);
  const lo = Math.min(homeScore, awayScore);
  if (cap !== null && hi >= cap) return true;
  return hi >= target && hi - lo >= winBy;
}
