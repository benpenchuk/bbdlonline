import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requirePerson, displayName } from "@/lib/auth";
import { EmptyState } from "@/components/empty-state";
import { Trophy, Flame } from "lucide-react";

export const metadata = { title: "Records · BBDL" };

/** Which way each record sorts, and how it reads. */
const RECORDS = [
  { key: "biggest_blowout", label: "Biggest blowout", unit: "pt margin", dir: "desc" },
  { key: "highest_scoring", label: "Highest scoring game", unit: "total pts", dir: "desc" },
  { key: "closest_finish", label: "Closest finish", unit: "pt margin", dir: "asc" },
  { key: "most_points_in_a_game", label: "Most points, one game", unit: "pts", dir: "desc" },
  { key: "most_sinks_in_a_game", label: "Most sinks, one game", unit: "sinks", dir: "desc" },
  { key: "best_accuracy_in_a_game", label: "Best accuracy, one game", unit: "%", dir: "desc" },
] as const;

export default async function RecordsPage() {
  await requirePerson();
  const supabase = await createClient();

  const [
    { data: records },
    { data: streaks },
    { data: careers },
    { data: champions },
    { data: teams },
    { data: people },
    { data: seasons },
  ] = await Promise.all([
    supabase.from("game_records").select("*"),
    supabase.from("team_streaks").select("*").eq("won", true).order("length", { ascending: false }).limit(5),
    supabase.from("player_career_stats").select("*").order("wins", { ascending: false }).limit(5),
    supabase.from("season_champions").select("*"),
    supabase.from("teams").select("*"),
    supabase.from("people").select("*"),
    supabase.from("seasons").select("*"),
  ]);

  const teamById = new Map((teams ?? []).map((t) => [t.id, t]));
  const peopleById = new Map((people ?? []).map((p) => [p.id, p]));
  const seasonById = new Map((seasons ?? []).map((s) => [s.id, s]));
  const all = records ?? [];

  const bestOf = (key: string, dir: "asc" | "desc") => {
    const rows = all.filter((r) => r.record === key && r.value !== null);
    if (rows.length === 0) return null;
    return rows.sort((a, b) =>
      dir === "desc" ? Number(b.value) - Number(a.value) : Number(a.value) - Number(b.value),
    )[0];
  };

  const hasAnything = all.length > 0 || (careers ?? []).length > 0;
  if (!hasAnything) {
    return (
      <EmptyState
        title="No records yet"
        body="These fill in as games get played. Check back after a few weeks."
      />
    );
  }

  return (
    <div className="space-y-7">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight text-navy-800">
          Record book
        </h1>
        <p className="text-sm text-ash-500">All time, every season.</p>
      </header>

      {(champions ?? []).length > 0 && (
        <section>
          <h2 className="mb-2 flex items-center gap-2 font-display text-base font-bold text-navy-800">
            <Trophy size={16} className="text-pink-500" /> Champions
          </h2>
          <div className="overflow-hidden rounded-lg border border-ash-200 bg-white">
            {(champions ?? []).map((c) => (
              <div
                key={c.playoff_id}
                className="flex items-center gap-3 border-b border-ash-100 px-4 py-2.5 last:border-0"
              >
                <span className="w-24 shrink-0 font-mono text-xs text-ash-500">
                  {seasonById.get(c.season_id!)?.name}
                </span>
                <Link
                  href={`/teams/${c.team_id}`}
                  className="font-display font-bold text-navy-800 hover:text-pink-500"
                >
                  {teamById.get(c.team_id!)?.name ?? "—"}
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-2 font-display text-base font-bold text-navy-800">
          Single-game records
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {RECORDS.map((r) => {
            const best = bestOf(r.key, r.dir);
            const person = best?.person_id ? peopleById.get(best.person_id) : null;
            const team = best?.team_id ? teamById.get(best.team_id) : null;

            return (
              <div key={r.key} className="rounded-lg border border-ash-200 bg-white p-3">
                <div className="eyebrow mb-1 text-ash-500">{r.label}</div>
                {best ? (
                  <>
                    <div className="font-display text-xl font-bold tabular-nums text-navy-800">
                      {Number(best.value)}
                      <span className="ml-1 font-mono text-[11px] font-normal text-ash-400">
                        {r.unit}
                      </span>
                    </div>
                    <div className="text-xs text-ash-600">
                      {person ? (
                        <Link href={`/players/${person.slug}`} className="hover:text-pink-500">
                          {displayName(person)}
                        </Link>
                      ) : (
                        team?.name
                      )}
                      {best.game_id && (
                        <Link
                          href={`/games/${best.game_id}`}
                          className="ml-1.5 font-mono text-[10px] text-ash-400 hover:text-pink-500"
                        >
                          view game
                        </Link>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-ash-400">Not set yet.</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-5 sm:grid-cols-2">
        <section>
          <h2 className="mb-2 flex items-center gap-2 font-display text-base font-bold text-navy-800">
            <Flame size={16} className="text-pink-500" /> Longest win streaks
          </h2>
          <div className="overflow-hidden rounded-lg border border-ash-200 bg-white">
            {(streaks ?? []).length === 0 ? (
              <p className="px-4 py-5 text-center text-xs text-ash-400">None yet.</p>
            ) : (
              (streaks ?? []).map((s, i) => (
                <div
                  key={`${s.team_id}-${i}`}
                  className="flex items-center gap-3 border-b border-ash-100 px-4 py-2 last:border-0"
                >
                  <span className="w-4 font-mono text-[10px] tabular-nums text-ash-400">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-navy-800">
                    {teamById.get(s.team_id!)?.name ?? "—"}
                    <span className="ml-1.5 font-mono text-[10px] text-ash-400">
                      {seasonById.get(s.season_id!)?.name}
                    </span>
                  </span>
                  <span className="font-mono text-sm font-bold tabular-nums text-navy-800">
                    {s.length}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-2 font-display text-base font-bold text-navy-800">
            Career wins
          </h2>
          <div className="overflow-hidden rounded-lg border border-ash-200 bg-white">
            {(careers ?? []).map((c, i) => {
              const person = c.person_id ? peopleById.get(c.person_id) : null;
              return (
                <div
                  key={c.person_id}
                  className="flex items-center gap-3 border-b border-ash-100 px-4 py-2 last:border-0"
                >
                  <span className="w-4 font-mono text-[10px] tabular-nums text-ash-400">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {person ? (
                      <Link
                        href={`/players/${person.slug}`}
                        className="text-navy-800 hover:text-pink-500"
                      >
                        {displayName(person)}
                      </Link>
                    ) : (
                      "—"
                    )}
                    <span className="ml-1.5 font-mono text-[10px] text-ash-400">
                      {c.seasons} season{c.seasons === 1 ? "" : "s"}
                    </span>
                  </span>
                  <span className="font-mono text-sm font-bold tabular-nums text-navy-800">
                    {c.wins}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
