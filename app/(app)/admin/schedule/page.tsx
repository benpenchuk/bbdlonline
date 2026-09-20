import { createClient } from "@/lib/supabase/server";
import { requireCommissioner } from "@/lib/auth";
import { setGameSchedule, deleteGame, setGameScore } from "./actions";
import { Lock } from "lucide-react";
import { GenerateButtons } from "./generate-buttons";
import { pickSeason, SeasonPicker } from "../season-picker";

export const metadata = { title: "Schedule · Admin" };

function localInputValue(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function AdminSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>;
}) {
  await requireCommissioner();
  const supabase = await createClient();

  const { season: picked } = await searchParams.then((sp) => sp);
  const { season, seasons } = await pickSeason(supabase, picked);

  if (!season) {
    return (
      <p className="rounded-lg border border-loss/30 bg-loss/5 px-4 py-3 text-sm text-loss">
        No seasons yet.
      </p>
    );
  }

  const [{ data: teams }, { data: games }] = await Promise.all([
    supabase.from("teams").select("*").eq("season_id", season.id),
    supabase
      .from("games")
      .select("*")
      .eq("season_id", season.id)
      .order("week")
      .order("scheduled_at", { nullsFirst: false }),
  ]);

  const teamById = new Map((teams ?? []).map((t) => [t.id, t]));
  const approved = (teams ?? []).filter((t) => t.approved);
  const gameList = games ?? [];

  const weeks = [...new Set(gameList.map((g) => g.week ?? 0))].sort((a, b) => a - b);
  const rivalryWeek = season.regular_weeks;

  return (
    <div className="space-y-8">
      <SeasonPicker seasons={seasons} current={season} basePath="/admin/schedule" />
      {season.locked && (
        <p className="flex items-center gap-2 rounded-lg border border-ash-300 bg-ash-50 px-4 py-2.5 text-sm text-ash-700">
          <Lock size={14} className="shrink-0" />
          <span>
            {season.name} is locked, so nothing here can be changed. Unlock it
            on the <a href="/admin/seasons" className="font-semibold text-pink-600 underline">seasons page</a> first.
          </span>
        </p>
      )}
      <div className="flex flex-wrap items-baseline gap-3">
        <h2 className="font-display text-lg font-bold text-navy-800">
          {season.name} schedule
        </h2>
        <span className="font-mono text-xs text-ash-500">
          {approved.length} approved teams · {gameList.length} games
        </span>
      </div>

      <GenerateButtons
        teamCount={approved.length}
        regularWeeks={season.regular_weeks}
        hasGames={gameList.length > 0}
      />

      {weeks.length === 0 ? (
        <p className="rounded-lg border border-dashed border-ash-300 px-4 py-8 text-center text-sm text-ash-500">
          Nothing scheduled yet.
        </p>
      ) : (
        <div className="space-y-6">
          {weeks.map((w) => {
            const inWeek = gameList.filter((g) => (g.week ?? 0) === w);
            return (
              <section key={w}>
                <div className="mb-2 flex items-baseline gap-2">
                  <h3 className="font-display text-base font-bold text-navy-800">
                    Week {w}
                  </h3>
                  {w === rivalryWeek && (
                    <span className="rounded bg-pink-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-pink-500">
                      rivalry
                    </span>
                  )}
                  <span className="font-mono text-[11px] text-ash-500">
                    {inWeek.length} games
                  </span>
                </div>

                <div className="overflow-hidden rounded-lg border border-ash-200 bg-white">
                  {inWeek.map((g) => {
                    const home = teamById.get(g.home_team_id);
                    const away = teamById.get(g.away_team_id);
                    // A tracked game's score is the sum of its throws, so
                    // resync_game_score() would overwrite anything typed
                    // here. Those get the tracker, not a score box.
                    const played = g.status !== "scheduled";
                    const scoreEditable = !season.locked && !g.is_tracked;

                    return (
                      <form
                        key={g.id}
                        action={setGameSchedule}
                        className="flex flex-wrap items-center gap-3 border-b border-ash-100 px-3 py-2 last:border-0"
                      >
                        <input type="hidden" name="game_id" value={g.id} />

                        <span className="min-w-0 flex-1 text-sm">
                          <span className="font-semibold text-ash-900">
                            {home?.name ?? "?"}
                          </span>
                          <span className="mx-1.5 text-ash-400">vs</span>
                          <span className="font-semibold text-ash-900">
                            {away?.name ?? "?"}
                          </span>
                          {played && (
                            <span className="ml-2 font-mono text-[10px] tabular-nums text-ash-500">
                              {g.status === "canceled"
                                ? "no score recorded"
                                : `${g.home_score}–${g.away_score} ${g.status}`}
                              {g.is_tracked && " · tracked"}
                            </span>
                          )}
                        </span>

                        {scoreEditable && (
                          <span className="flex items-center gap-1">
                            <input
                              name="home_score"
                              inputMode="numeric"
                              defaultValue={g.status === "canceled" ? "" : g.home_score}
                              aria-label={`${home?.name ?? "Home"} score`}
                              className="w-11 rounded border border-ash-300 px-1.5 py-1 text-center text-xs tabular-nums"
                            />
                            <span className="text-ash-400">–</span>
                            <input
                              name="away_score"
                              inputMode="numeric"
                              defaultValue={g.status === "canceled" ? "" : g.away_score}
                              aria-label={`${away?.name ?? "Away"} score`}
                              className="w-11 rounded border border-ash-300 px-1.5 py-1 text-center text-xs tabular-nums"
                            />
                            <button
                              formAction={setGameScore}
                              className="font-mono text-[10px] text-pink-500 hover:underline"
                            >
                              score
                            </button>
                          </span>
                        )}

                        <input
                          type="datetime-local"
                          name="scheduled_at"
                          defaultValue={localInputValue(g.scheduled_at)}
                          className="rounded border border-ash-300 px-2 py-1 text-xs"
                        />
                        <input
                          name="location"
                          defaultValue={g.location ?? ""}
                          placeholder="Location"
                          className="w-28 rounded border border-ash-300 px-2 py-1 text-xs"
                        />
                        <button className="font-mono text-[10px] text-pink-500 hover:underline">
                          save
                        </button>
                        {!played && !season.locked && (
                          <button
                            formAction={deleteGame}
                            className="font-mono text-[10px] text-ash-400 hover:text-loss hover:underline"
                          >
                            delete
                          </button>
                        )}
                      </form>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
