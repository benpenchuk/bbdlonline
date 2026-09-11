import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getGameThrows, shortName, fullName } from "@/lib/queries";
import type { ThrowOutcome } from "@/lib/supabase/types";

export const metadata = { title: "Game · BBDL" };

/** How each outcome reads in a play-by-play line. */
const OUTCOME_TEXT: Record<ThrowOutcome, string> = {
  point: "point",
  dink: "dink",
  sink: "sink",
  field_goal: "field goal",
  fifa: "fifa",
  caught: "caught",
  missed: "missed",
  rethrow: "stayed on, called it",
};

export default async function GamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: game } = await supabase.from("games").select("*").eq("id", id).maybeSingle();
  if (!game) notFound();

  const [
    { data: teams },
    { data: stats },
    { data: participants },
    { data: people },
    { data: mvp },
    throws,
  ] = await Promise.all([
    supabase.from("teams").select("*").in("id", [game.home_team_id, game.away_team_id]),
    supabase.from("player_game_stats").select("*").eq("game_id", id),
    supabase.from("game_participants").select("*").eq("game_id", id),
    supabase.from("people").select("*"),
    supabase.from("game_mvp").select("*").eq("game_id", id).maybeSingle(),
    getGameThrows(id),
  ]);

  const teamById = new Map((teams ?? []).map((t) => [t.id, t]));
  const peopleById = new Map((people ?? []).map((p) => [p.id, p]));
  const home = teamById.get(game.home_team_id);
  const away = teamById.get(game.away_team_id);
  const final = game.status === "final";

  const statsFor = (teamId: string) =>
    (stats ?? []).filter((s) => s.team_id === teamId);

  const rosterFor = (teamId: string) =>
    (participants ?? [])
      .filter((p) => p.team_id === teamId)
      .map((p) => peopleById.get(p.person_id))
      .filter(Boolean);

  return (
    <div className="space-y-6">
      <Link href="/games" className="text-sm text-ash-500 hover:text-pink-500">
        ← All games
      </Link>

      <div className="rounded-lg bg-navy-800 px-5 py-5 text-white">
        <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-navy-200">
          <span>
            {game.kind === "rivalry" ? "Rivalry week" : `Week ${game.week ?? "—"}`}
          </span>
          {game.scheduled_at && (
            <span>· {format(new Date(game.scheduled_at), "MMM d, yyyy")}</span>
          )}
          {game.location && <span>· {game.location}</span>}
          <span className="ml-auto">{final ? "Final" : game.status}</span>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div>
            <div className="font-display text-lg font-bold">{away?.name}</div>
            <div className="text-xs text-navy-200">
              {rosterFor(game.away_team_id).map((p) => shortName(p!)).join(" · ")}
            </div>
          </div>
          <div className="font-display text-3xl font-bold tabular-nums">
            {game.away_score}
            <span className="mx-2 text-navy-300">–</span>
            {game.home_score}
          </div>
          <div className="text-right">
            <div className="font-display text-lg font-bold">{home?.name}</div>
            <div className="text-xs text-navy-200">
              {rosterFor(game.home_team_id).map((p) => shortName(p!)).join(" · ")}
            </div>
          </div>
        </div>
      </div>

      {mvp?.person_id && (
        <div className="rounded-lg border border-pink-500/30 bg-pink-500/5 px-4 py-3">
          <span className="eyebrow text-pink-500">Game MVP</span>
          <p className="font-display text-base font-bold text-navy-800">
            {fullName(peopleById.get(mvp.person_id)!)}
            <span className="ml-2 font-mono text-xs font-normal text-ash-500">
              {mvp.total_points} pts · {mvp.accuracy_pct ?? "—"}% accuracy
            </span>
          </p>
        </div>
      )}

      {game.is_tracked ? (
        <>
          <section>
            <h2 className="mb-2 font-display text-base font-bold text-navy-800">
              Box score
            </h2>
            <div className="overflow-x-auto rounded-lg border border-ash-200 bg-white">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-ash-200 bg-ash-50">
                    {["Player", "Thr", "Hits", "Acc", "Pt", "Dk", "Sk", "FG", "Def", "Total"].map(
                      (h) => (
                        <th
                          key={h}
                          className={`px-2.5 py-2 font-mono text-[10px] uppercase tracking-wider text-ash-500 ${
                            h === "Player" ? "text-left" : "text-right"
                          }`}
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                {[game.away_team_id, game.home_team_id].map((teamId) => (
                  <tbody key={teamId}>
                    <tr className="bg-ash-100">
                      <td
                        colSpan={10}
                        className="px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-ash-600"
                      >
                        {teamById.get(teamId)?.name}
                      </td>
                    </tr>
                    {statsFor(teamId).map((s) => {
                      const person = s.person_id ? peopleById.get(s.person_id) : null;
                      const cells = [
                        s.throws,
                        s.table_hits,
                        s.accuracy_pct === null ? "—" : `${s.accuracy_pct}%`,
                        s.points_plain,
                        s.dinks,
                        s.sinks,
                        s.field_goals,
                        s.defensive_points,
                        s.total_points,
                      ];
                      return (
                        <tr key={s.person_id} className="border-b border-ash-100">
                          <td className="px-2.5 py-2 font-semibold text-ash-900">
                            {person ? fullName(person) : "—"}
                          </td>
                          {cells.map((v, i) => (
                            <td
                              key={i}
                              className="px-2.5 py-2 text-right font-mono tabular-nums text-ash-600"
                            >
                              {v}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                ))}
              </table>
            </div>
          </section>

          <section>
            <h2 className="mb-2 font-display text-base font-bold text-navy-800">
              Play by play
              <span className="ml-2 font-mono text-xs font-normal text-ash-500">
                {throws.length} throws
              </span>
            </h2>
            <ol className="overflow-hidden rounded-lg border border-ash-200 bg-white">
              {throws.map((t) => {
                const thrower = peopleById.get(t.thrower_id);
                const defender = t.defender_id ? peopleById.get(t.defender_id) : null;
                const scoringTeam = t.scoring_team_id
                  ? teamById.get(t.scoring_team_id)
                  : null;

                return (
                  <li
                    key={t.id}
                    className="flex items-baseline gap-3 border-b border-ash-100 px-3 py-1.5 text-sm last:border-0"
                  >
                    <span className="w-6 shrink-0 font-mono text-[10px] tabular-nums text-ash-400">
                      {t.seq}
                    </span>
                    <span className="min-w-0 flex-1 text-ash-700">
                      {t.outcome === "fifa" && defender ? (
                        <>
                          <strong className="text-ash-900">{shortName(defender)}</strong> fifa&apos;d{" "}
                          {thrower ? shortName(thrower) : "?"}
                          <span className="text-ash-400"> ({t.fifa_kicks} kick{t.fifa_kicks === 1 ? "" : "s"})</span>
                        </>
                      ) : t.outcome === "caught" && defender ? (
                        <>
                          <strong className="text-ash-900">{thrower ? shortName(thrower) : "?"}</strong>{" "}
                          caught by {shortName(defender)}
                        </>
                      ) : (
                        <>
                          <strong className="text-ash-900">{thrower ? shortName(thrower) : "?"}</strong>{" "}
                          {OUTCOME_TEXT[t.outcome]}
                        </>
                      )}
                    </span>
                    <span className="shrink-0 font-mono text-xs tabular-nums">
                      {t.points ? (
                        <span className="font-bold text-pink-500">
                          +{t.points} {scoringTeam?.abbreviation ?? scoringTeam?.name}
                        </span>
                      ) : (
                        <span className="text-ash-300">—</span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>
        </>
      ) : (
        final && (
          <p className="rounded-lg border border-dashed border-ash-300 px-4 py-6 text-center text-sm text-ash-500">
            Nobody tracked this one, so there&apos;s only a final score. It counts
            for the standings but not for stat leaderboards.
          </p>
        )
      )}
    </div>
  );
}
