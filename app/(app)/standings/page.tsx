import Link from "next/link";
import { getActiveSeason, getStandings, getRosters, getSeasonGames, shortName, streakFrom } from "@/lib/queries";
import { EmptyState } from "@/components/empty-state";

export const metadata = { title: "Standings · BBDL" };

export default async function StandingsPage() {
  const season = await getActiveSeason();
  if (!season) {
    return <EmptyState title="No active season" body="The commissioner hasn't started one yet." />;
  }

  const [standings, rosters, games] = await Promise.all([
    getStandings(season.id),
    getRosters(season.id),
    getSeasonGames(season.id),
  ]);

  if (standings.length === 0) {
    return <EmptyState title="No teams yet" body={`${season.name} doesn't have any approved teams.`} />;
  }

  // recent form, newest first, per team
  const finals = games
    .filter((g) => g.status === "final")
    .sort((a, b) => (b.scheduled_at ?? "").localeCompare(a.scheduled_at ?? ""));

  const formFor = (teamId: string) =>
    finals
      .filter((g) => g.home_team_id === teamId || g.away_team_id === teamId)
      .map((g) => g.winner_team_id === teamId);

  return (
    <div>
      <header className="mb-5">
        <h1 className="font-display text-2xl font-bold tracking-tight text-navy-800">
          Standings
        </h1>
        <p className="text-sm text-ash-500">
          {season.name} · ties broken by point differential
        </p>
      </header>

      <div className="overflow-x-auto rounded-lg border border-ash-200 bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-ash-200 bg-navy-800 text-white">
              <th className="px-3 py-2.5 text-left font-mono text-[10px] uppercase tracking-wider">#</th>
              <th className="px-3 py-2.5 text-left font-mono text-[10px] uppercase tracking-wider">Team</th>
              <th className="px-3 py-2.5 text-right font-mono text-[10px] uppercase tracking-wider">W</th>
              <th className="px-3 py-2.5 text-right font-mono text-[10px] uppercase tracking-wider">L</th>
              <th className="px-3 py-2.5 text-right font-mono text-[10px] uppercase tracking-wider">Pct</th>
              <th className="px-3 py-2.5 text-right font-mono text-[10px] uppercase tracking-wider">PF</th>
              <th className="px-3 py-2.5 text-right font-mono text-[10px] uppercase tracking-wider">PA</th>
              <th className="px-3 py-2.5 text-right font-mono text-[10px] uppercase tracking-wider">Diff</th>
              <th className="px-3 py-2.5 text-right font-mono text-[10px] uppercase tracking-wider">Strk</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row) => {
              const roster = rosters.get(row.team_id ?? "") ?? [];
              const diff = row.point_differential ?? 0;
              const playoffLine = Math.ceil(standings.length / 2);

              return (
                <tr
                  key={row.team_id}
                  className={`border-b border-ash-100 last:border-0 ${
                    (row.rank ?? 0) === playoffLine ? "border-b-2 border-b-pink-500/40" : ""
                  }`}
                >
                  <td className="px-3 py-2.5 font-mono text-xs tabular-nums text-ash-500">
                    {row.rank}
                  </td>
                  <td className="px-3 py-2.5">
                    <Link
                      href={`/teams/${row.team_id}`}
                      className="font-semibold text-navy-800 hover:text-pink-500"
                    >
                      {row.name}
                    </Link>
                    {roster.length > 0 && (
                      <div className="text-[11px] text-ash-500">
                        {roster.map(shortName).join(" · ")}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-ash-900">{row.wins}</td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-ash-600">{row.losses}</td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-ash-600">
                    {row.win_pct === null ? "—" : `${row.win_pct}%`}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-ash-600">{row.points_for}</td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-ash-600">{row.points_against}</td>
                  <td
                    className={`px-3 py-2.5 text-right font-mono tabular-nums ${
                      diff > 0 ? "text-win" : diff < 0 ? "text-loss" : "text-ash-500"
                    }`}
                  >
                    {diff > 0 ? `+${diff}` : diff}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-ash-600">
                    {streakFrom(formFor(row.team_id ?? ""))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-xs text-ash-500">
        The line marks the playoff cut — top half of the league makes it.
      </p>
    </div>
  );
}
