/** How a game is named in lists: "Week 3", "Rivalry", or "Playoffs". Playoff
 *  games carry no week number, which previously rendered as "Week null". */
export function gameLabel(game: { kind: string; week: number | null }, short = false): string {
  if (game.kind === "playoff") return "Playoffs";
  if (game.kind === "rivalry") return short ? "Rivalry" : "Rivalry week";
  if (game.week === null) return "—";
  return short ? `Wk ${game.week}` : `Week ${game.week}`;
}
