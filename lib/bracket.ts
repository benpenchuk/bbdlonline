/**
 * Single-elimination bracket construction.
 *
 * Top half of the league makes the playoffs. Seeds are standard 1-vs-N pairing,
 * and when the field isn't a power of two the top seeds get first-round byes
 * rather than padding the bracket with fake teams.
 */

export type BracketMatch = {
  round: number;
  match: number;
  team1Seed: number | null;
  team2Seed: number | null;
};

/** 1v8, 4v5, 2v7, 3v6 — the order that keeps 1 and 2 apart until the final. */
export function seedOrder(size: number): number[] {
  let order = [1, 2];
  while (order.length < size) {
    const n = order.length * 2 + 1;
    order = order.flatMap((s) => [s, n - s]);
  }
  return order;
}

export function buildBracket(teamCount: number): {
  matches: BracketMatch[];
  rounds: number;
  byes: number[];
} {
  if (teamCount < 2) return { matches: [], rounds: 0, byes: [] };

  const size = 2 ** Math.ceil(Math.log2(teamCount));
  const order = seedOrder(size);
  const byes: number[] = [];
  const matches: BracketMatch[] = [];

  // round 1: a seed above the real team count is a bye for its opponent
  let matchNo = 0;
  for (let i = 0; i < order.length; i += 2) {
    const a = order[i] <= teamCount ? order[i] : null;
    const b = order[i + 1] <= teamCount ? order[i + 1] : null;
    if (a !== null && b === null) byes.push(a);
    if (b !== null && a === null) byes.push(b);
    matches.push({ round: 1, match: matchNo++, team1Seed: a, team2Seed: b });
  }

  const rounds = Math.log2(size);
  for (let r = 2; r <= rounds; r++) {
    const count = size / 2 ** r;
    for (let m = 0; m < count; m++) {
      matches.push({ round: r, match: m, team1Seed: null, team2Seed: null });
    }
  }

  return { matches, rounds, byes };
}

export function roundName(round: number, totalRounds: number): string {
  const fromEnd = totalRounds - round;
  if (fromEnd === 0) return "Final";
  if (fromEnd === 1) return "Semifinals";
  if (fromEnd === 2) return "Quarterfinals";
  return `Round ${round}`;
}
