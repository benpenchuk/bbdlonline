/**
 * Regular-season schedule generation.
 *
 * Requirements from how BBDL actually runs:
 *   - every team plays exactly once a week
 *   - weeks 1..N are random, and no two teams meet twice
 *   - week 6 is rivalry week and is NOT generated here — teams call each
 *     other out, and unmatched teams get paired later
 *
 * Uses the circle method: pin one team, rotate the rest. That yields
 * (teams - 1) rounds with no pairing ever repeating, which is exactly the
 * guarantee we need. Shuffling the seats first makes each generated season
 * different without weakening the guarantee.
 */

export type Pairing = { week: number; homeTeamId: string; awayTeamId: string };

const BYE = "__bye__";

function shuffled<T>(items: T[], rng: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function maxRoundsFor(teamCount: number): number {
  if (teamCount < 2) return 0;
  // with an odd count a bye is added, giving `teamCount` rounds
  return teamCount % 2 === 0 ? teamCount - 1 : teamCount;
}

export function generateSchedule(
  teamIds: string[],
  weeks: number,
  rng: () => number = Math.random,
): { pairings: Pairing[]; byes: { week: number; teamId: string }[] } {
  if (teamIds.length < 2) return { pairings: [], byes: [] };

  const seats = shuffled(teamIds, rng);
  if (seats.length % 2 === 1) seats.push(BYE);

  const n = seats.length;
  const rounds = Math.min(weeks, n - 1);
  const pairings: Pairing[] = [];
  const byes: { week: number; teamId: string }[] = [];

  // seats[0] stays put; the rest rotate one position each round
  const rotating = seats.slice(1);

  for (let round = 0; round < rounds; round++) {
    const week = round + 1;
    const order = [seats[0], ...rotating];

    for (let i = 0; i < n / 2; i++) {
      const a = order[i];
      const b = order[n - 1 - i];

      if (a === BYE) {
        byes.push({ week, teamId: b });
        continue;
      }
      if (b === BYE) {
        byes.push({ week, teamId: a });
        continue;
      }

      // alternate home/away by round so nobody is always the home team
      const homeFirst = (round + i) % 2 === 0;
      pairings.push({
        week,
        homeTeamId: homeFirst ? a : b,
        awayTeamId: homeFirst ? b : a,
      });
    }

    rotating.unshift(rotating.pop()!);
  }

  return { pairings, byes };
}

/** Pairs up teams nobody challenged for rivalry week, at random. */
export function autoPairLeftovers(
  teamIds: string[],
  rng: () => number = Math.random,
): { pairs: [string, string][]; unpaired: string[] } {
  const pool = shuffled(teamIds, rng);
  const pairs: [string, string][] = [];

  while (pool.length >= 2) {
    pairs.push([pool.pop()!, pool.pop()!]);
  }

  return { pairs, unpaired: pool };
}
