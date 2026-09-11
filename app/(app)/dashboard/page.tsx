import Link from "next/link";
import { format } from "date-fns";
import { requirePerson, displayName, isCommissioner } from "@/lib/auth";
import {
  getActiveSeason,
  getSeasonGames,
  getTeams,
  getStandings,
  getRosters,
  getPlayerSeasonStats,
  shortName,
} from "@/lib/queries";
import { EmptyState } from "@/components/empty-state";
import { ScoreLine } from "@/components/score-line";

export const metadata = { title: "BBDL" };

export default async function DashboardPage() {
  const person = await requirePerson();
  const season = await getActiveSeason();

  if (!season) {
    return (
      <EmptyState
        title={`Welcome, ${person.first_name}`}
        body={
          isCommissioner(person)
            ? "No season is active. Start one from the admin panel."
            : "No season is running right now. Check back when the commissioner starts one."
        }
      />
    );
  }

  const [games, teams, standings, rosters, stats] = await Promise.all([
    getSeasonGames(season.id),
    getTeams(season.id),
    getStandings(season.id),
    getRosters(season.id),
    getPlayerSeasonStats(season.id),
  ]);

  const teamById = new Map(teams.map((t) => [t.id, t]));

  const recent = games
    .filter((g) => g.status === "final")
    .sort((a, b) => (b.scheduled_at ?? "").localeCompare(a.scheduled_at ?? ""))
    .slice(0, 5);

  const upcoming = games
    .filter((g) => g.status === "scheduled")
    .sort((a, b) => (a.scheduled_at ?? "").localeCompare(b.scheduled_at ?? ""))
    .slice(0, 5);

  // the signed-in member's own team this season
  let myTeamId: string | null = null;
  for (const [teamId, roster] of rosters) {
    if (roster.some((p) => p.id === person.id)) myTeamId = teamId;
  }
  const myStanding = myTeamId ? standings.find((s) => s.team_id === myTeamId) : null;
  const myStats = stats.find((s) => s.person_id === person.id);

  const sideFor = (teamId: string, score: number) => ({
    id: teamId,
    name: teamById.get(teamId)?.name ?? "Unknown",
    score,
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight text-navy-800">
          {season.name}
        </h1>
        <p className="text-sm text-ash-500">
          Welcome back, {displayName(person)}.
        </p>
      </header>

      {myStanding && (
        <section className="rounded-lg bg-navy-800 px-5 py-4 text-white">
          <div className="eyebrow mb-1 text-navy-200">Your team</div>
          <Link
            href={`/teams/${myTeamId}`}
            className="font-display text-xl font-bold hover:text-pink-300"
          >
            {myStanding.name}
          </Link>
          <div className="mt-2 flex flex-wrap gap-5 font-mono text-sm tabular-nums">
            <span>
              <span className="text-navy-300">Record </span>
              {myStanding.wins}–{myStanding.losses}
            </span>
            <span>
              <span className="text-navy-300">Rank </span>#{myStanding.rank} of{" "}
              {standings.length}
            </span>
            {myStats && (
              <span>
                <span className="text-navy-300">Your points </span>
                {myStats.total_points}
              </span>
            )}
            {myStats?.accuracy_pct !== null && myStats?.accuracy_pct !== undefined && (
              <span>
                <span className="text-navy-300">Accuracy </span>
                {myStats.accuracy_pct}%
              </span>
            )}
          </div>
        </section>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="font-display text-base font-bold text-navy-800">
              Recent results
            </h2>
            <Link href="/games" className="text-xs text-pink-500 hover:underline">
              All games
            </Link>
          </div>
          <div className="overflow-hidden rounded-lg border border-ash-200 bg-white">
            {recent.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-ash-500">
                No games played yet.
              </p>
            ) : (
              recent.map((g) => (
                <ScoreLine
                  key={g.id}
                  gameId={g.id}
                  home={sideFor(g.home_team_id, g.home_score)}
                  away={sideFor(g.away_team_id, g.away_score)}
                  status={g.status}
                  tracked={g.is_tracked}
                />
              ))
            )}
          </div>

          {upcoming.length > 0 && (
            <>
              <h2 className="mb-2 mt-5 font-display text-base font-bold text-navy-800">
                Coming up
              </h2>
              <div className="overflow-hidden rounded-lg border border-ash-200 bg-white">
                {upcoming.map((g) => (
                  <ScoreLine
                    key={g.id}
                    gameId={g.id}
                    home={sideFor(g.home_team_id, g.home_score)}
                    away={sideFor(g.away_team_id, g.away_score)}
                    status={g.status}
                    when={
                      g.scheduled_at
                        ? format(new Date(g.scheduled_at), "EEE MMM d, h:mm a")
                        : null
                    }
                  />
                ))}
              </div>
            </>
          )}
        </section>

        <section>
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="font-display text-base font-bold text-navy-800">Standings</h2>
            <Link href="/standings" className="text-xs text-pink-500 hover:underline">
              Full table
            </Link>
          </div>
          <div className="overflow-hidden rounded-lg border border-ash-200 bg-white">
            {standings.slice(0, 8).map((s) => (
              <Link
                key={s.team_id}
                href={`/teams/${s.team_id}`}
                className={`flex items-baseline gap-2.5 border-b border-ash-100 px-3 py-2 last:border-0 hover:bg-ash-50 ${
                  s.team_id === myTeamId ? "bg-pink-500/5" : ""
                }`}
              >
                <span className="w-4 shrink-0 font-mono text-[10px] tabular-nums text-ash-400">
                  {s.rank}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-navy-800">
                  {s.name}
                  <span className="ml-1.5 text-[10px] text-ash-400">
                    {(rosters.get(s.team_id ?? "") ?? []).map(shortName).join(" · ")}
                  </span>
                </span>
                <span className="shrink-0 font-mono text-sm tabular-nums text-ash-700">
                  {s.wins}–{s.losses}
                </span>
              </Link>
            ))}
            {standings.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-ash-500">No teams yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
