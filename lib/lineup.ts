/**
 * Who actually plays a game.
 *
 * Dye is two-on-two, always. A team's roster can be longer — subs exist — but
 * exactly two of its players take part in any one game, and only those two
 * earn a game played, a result, and throw stats. The database enforces the
 * same rule; this is so the UI can explain a mistake before sending it.
 */

export type RosterEntry = { id: string; teamId: string };

export const PLAYERS_PER_SIDE = 2;

/** A team with exactly two rostered players needs no choosing. */
export function defaultLineup(roster: RosterEntry[], teamIds: string[]): string[] {
  return teamIds.flatMap((teamId) => {
    const members = roster.filter((r) => r.teamId === teamId);
    return members.length === PLAYERS_PER_SIDE ? members.map((m) => m.id) : [];
  });
}

export function needsChoosing(roster: RosterEntry[], teamId: string): boolean {
  return roster.filter((r) => r.teamId === teamId).length > PLAYERS_PER_SIDE;
}

export function validateLineup(
  lineup: string[],
  roster: RosterEntry[],
  teamIds: string[],
): string | null {
  const teamOf = new Map(roster.map((r) => [r.id, r.teamId]));

  if (new Set(lineup).size !== lineup.length) {
    return "The same player is in the lineup twice.";
  }
  if (lineup.some((id) => !teamOf.has(id))) {
    return "Everyone in the lineup has to be on one of the two rosters.";
  }

  for (const teamId of teamIds) {
    const onRoster = roster.filter((r) => r.teamId === teamId).length;
    if (onRoster < PLAYERS_PER_SIDE) {
      return "Each team needs at least two players on its roster.";
    }
    const picked = lineup.filter((id) => teamOf.get(id) === teamId).length;
    if (picked !== PLAYERS_PER_SIDE) {
      return "Pick exactly two players for each team.";
    }
  }

  return null;
}
