import Link from "next/link";
import { format } from "date-fns";
import { requirePerson } from "@/lib/auth";
import { getActiveSeason, getSeasonGames, getTeams, getRosters, shortName } from "@/lib/queries";
import { EmptyState } from "@/components/empty-state";
import { ScoreOnlyForm } from "./score-only-form";
import { Radio } from "lucide-react";

export const metadata = { title: "Track a game · BBDL" };

export default async function TrackPage() {
  await requirePerson();
  const season = await getActiveSeason();
  if (!season) return <EmptyState title="No active season" />;

  const [games, teams, rosters] = await Promise.all([
    getSeasonGames(season.id),
    getTeams(season.id),
    getRosters(season.id),
  ]);

  const teamById = new Map(teams.map((t) => [t.id, t]));
  const open = games.filter((g) => g.status === "scheduled" || g.status === "in_progress");

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight text-navy-800">
          Track a game
        </h1>
        <p className="text-sm text-ash-500">
          Anyone can track — you don&apos;t have to be playing. One tap per throw.
        </p>
      </header>

      {open.length === 0 ? (
        <EmptyState title="Nothing to track" body="Every scheduled game has been played." />
      ) : (
        <div className="space-y-2">
          {open.map((g) => {
            const home = teamById.get(g.home_team_id);
            const away = teamById.get(g.away_team_id);
            const rosterFor = (id: string) =>
              (rosters.get(id) ?? []).map(shortName).join(" · ");

            return (
              <div
                key={g.id}
                className="rounded-lg border border-ash-200 bg-white p-3"
              >
                <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-ash-400">
                  <span>{g.kind === "rivalry" ? "Rivalry" : `Week ${g.week}`}</span>
                  {g.scheduled_at && (
                    <span>· {format(new Date(g.scheduled_at), "EEE MMM d")}</span>
                  )}
                  {g.status === "in_progress" && (
                    <span className="ml-auto flex items-center gap-1 text-pink-500">
                      <Radio size={11} /> in progress
                    </span>
                  )}
                </div>

                <div className="mb-3 text-sm">
                  <div className="font-semibold text-navy-800">{away?.name}</div>
                  <div className="text-[11px] text-ash-500">{rosterFor(g.away_team_id)}</div>
                  <div className="my-0.5 font-mono text-[10px] text-ash-300">vs</div>
                  <div className="font-semibold text-navy-800">{home?.name}</div>
                  <div className="text-[11px] text-ash-500">{rosterFor(g.home_team_id)}</div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/track/${g.id}`}
                    className="rounded-lg bg-pink-500 px-4 py-2 font-display text-sm font-semibold text-white hover:bg-pink-600"
                  >
                    {g.status === "in_progress" ? "Resume tracking" : "Track this game"}
                  </Link>
                  <ScoreOnlyForm
                    gameId={g.id}
                    homeName={home?.name ?? "Home"}
                    awayName={away?.name ?? "Away"}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
