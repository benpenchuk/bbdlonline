import Link from "next/link";
import { gameLabel } from "@/lib/game-label";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { displayName } from "@/lib/auth";
import { EmptyState } from "@/components/empty-state";

export const metadata = { title: "Team · BBDL" };

export default async function TeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: team } = await supabase.from("teams").select("*").eq("id", id).maybeSingle();
  if (!team) notFound();

  const [{ data: standing }, { data: members }, { data: people }, { data: results }, { data: season }] =
    await Promise.all([
      supabase.from("standings").select("*").eq("team_id", id).maybeSingle(),
      supabase.from("team_members").select("*").eq("team_id", id).is("left_at", null),
      supabase.from("people").select("*"),
      supabase.from("team_game_results").select("*").eq("team_id", id),
      supabase.from("seasons").select("*").eq("id", team.season_id).maybeSingle(),
    ]);

  const peopleById = new Map((people ?? []).map((p) => [p.id, p]));
  const roster = (members ?? [])
    .map((m) => ({ member: m, person: peopleById.get(m.person_id) }))
    .filter((r) => r.person);

  const gameIds = (results ?? []).map((r) => r.game_id!).filter(Boolean);
  const { data: games } = gameIds.length
    ? await supabase.from("games").select("*").in("id", gameIds)
    : { data: [] };
  const gameById = new Map((games ?? []).map((g) => [g.id, g]));

  const { data: allTeams } = await supabase.from("teams").select("id, name");
  const teamById = new Map((allTeams ?? []).map((t) => [t.id, t]));

  const schedule = (results ?? [])
    .map((r) => ({ r, game: gameById.get(r.game_id!) }))
    .filter((x) => x.game)
    .sort((a, b) => (a.game!.week ?? 0) - (b.game!.week ?? 0));

  return (
    <div className="space-y-6">
      <Link href="/standings" className="text-sm text-ash-500 hover:text-pink-500">
        ← Standings
      </Link>

      <header className="rounded-lg bg-navy-800 px-5 py-5 text-white">
        <div className="eyebrow mb-1 text-navy-200">{season?.name}</div>
        <h1 className="font-display text-2xl font-bold tracking-tight">{team.name}</h1>
        <p className="mt-1 text-sm text-navy-100">
          {roster.map((r) => displayName(r.person!)).join(" · ")}
        </p>
        {standing && (
          <div className="mt-4 flex flex-wrap gap-5 font-mono text-sm tabular-nums">
            <span>
              <span className="text-navy-300">Record </span>
              {standing.wins}–{standing.losses}
            </span>
            <span>
              <span className="text-navy-300">Rank </span>#{standing.rank}
            </span>
            <span>
              <span className="text-navy-300">PF </span>
              {standing.points_for}
            </span>
            <span>
              <span className="text-navy-300">PA </span>
              {standing.points_against}
            </span>
            <span>
              <span className="text-navy-300">Diff </span>
              {(standing.point_differential ?? 0) > 0 ? "+" : ""}
              {standing.point_differential}
            </span>
          </div>
        )}
      </header>

      <section>
        <h2 className="mb-2 font-display text-base font-bold text-navy-800">Schedule</h2>
        {schedule.length === 0 ? (
          <EmptyState title="No games yet" />
        ) : (
          <div className="overflow-hidden rounded-lg border border-ash-200 bg-white">
            {schedule.map(({ r, game }) => {
              const opponent = teamById.get(r.opponent_id!);
              const final = game!.status === "final";
              const won = r.winner_team_id === id;

              return (
                <Link
                  key={game!.id}
                  href={`/games/${game!.id}`}
                  className="flex items-center gap-3 border-b border-ash-100 px-3 py-2.5 last:border-0 hover:bg-ash-50"
                >
                  <span className="w-14 shrink-0 font-mono text-[10px] uppercase tracking-wider text-ash-400">
                    {gameLabel(game!, true)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-navy-800">
                    {opponent?.name ?? "—"}
                  </span>
                  {final ? (
                    <span className="shrink-0 font-mono text-sm tabular-nums">
                      <span className={won ? "font-bold text-win" : "text-loss"}>
                        {won ? "W" : "L"}
                      </span>{" "}
                      <span className="text-ash-600">
                        {r.points_for}–{r.points_against}
                      </span>
                    </span>
                  ) : (
                    <span className="shrink-0 font-mono text-[11px] text-ash-400">
                      {game!.scheduled_at
                        ? format(new Date(game!.scheduled_at), "MMM d")
                        : "TBD"}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
