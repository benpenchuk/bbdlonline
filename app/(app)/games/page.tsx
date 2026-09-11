import Link from "next/link";
import { format } from "date-fns";
import {
  getActiveSeason,
  getSeasonGames,
  getTeams,
  getRosters,
  shortName,
} from "@/lib/queries";
import { EmptyState } from "@/components/empty-state";
import { ScoreLine } from "@/components/score-line";

export const metadata = { title: "Games · BBDL" };

export default async function GamesPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const season = await getActiveSeason();
  if (!season) {
    return <EmptyState title="No active season" body="Nothing scheduled yet." />;
  }

  const [games, teams, rosters] = await Promise.all([
    getSeasonGames(season.id),
    getTeams(season.id),
    getRosters(season.id),
  ]);

  if (games.length === 0) {
    return (
      <EmptyState
        title="Nothing scheduled"
        body={`${season.name} has no games yet. The commissioner generates the schedule from the admin panel.`}
      />
    );
  }

  const teamById = new Map(teams.map((t) => [t.id, t]));
  const weeks = [...new Set(games.map((g) => g.week ?? 0))].sort((a, b) => a - b);

  // default to the latest week that has a played game, else the first week
  const lastPlayed = Math.max(
    ...games.filter((g) => g.status === "final").map((g) => g.week ?? 0),
    0,
  );
  const { week } = await searchParams;
  const requested = Number(week);
  const current =
    weeks.includes(requested) ? requested : lastPlayed || weeks[0];

  const inWeek = games.filter((g) => (g.week ?? 0) === current);

  const sideFor = (teamId: string, score: number) => {
    const team = teamById.get(teamId);
    const roster = rosters.get(teamId) ?? [];
    return {
      id: teamId,
      name: team?.name ?? "Unknown",
      score,
      roster: roster.length ? roster.map(shortName).join(" · ") : undefined,
    };
  };

  return (
    <div>
      <header className="mb-4">
        <h1 className="font-display text-2xl font-bold tracking-tight text-navy-800">
          Games
        </h1>
        <p className="text-sm text-ash-500">{season.name}</p>
      </header>

      <nav className="mb-4 flex gap-1 overflow-x-auto">
        {weeks.map((w) => {
          const isRivalry = w === season.regular_weeks;
          return (
            <Link
              key={w}
              href={`/games?week=${w}`}
              className={`shrink-0 rounded-md px-3 py-1.5 font-display text-sm font-semibold transition ${
                w === current
                  ? "bg-navy-800 text-white"
                  : "bg-white text-ash-600 hover:text-navy-800"
              }`}
            >
              {isRivalry ? "Rivalry" : `Week ${w}`}
            </Link>
          );
        })}
      </nav>

      <div className="overflow-hidden rounded-lg border border-ash-200 bg-white">
        {inWeek.map((g) => (
          <ScoreLine
            key={g.id}
            gameId={g.id}
            home={sideFor(g.home_team_id, g.home_score)}
            away={sideFor(g.away_team_id, g.away_score)}
            status={g.status}
            tracked={g.is_tracked}
            when={
              g.scheduled_at ? format(new Date(g.scheduled_at), "EEE MMM d, h:mm a") : null
            }
          />
        ))}
        {inWeek.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-ash-500">
            Nothing scheduled for this week.
          </p>
        )}
      </div>
    </div>
  );
}
