import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requirePerson } from "@/lib/auth";

export const metadata = { title: "Home" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const person = await requirePerson();
  const { denied } = await searchParams;
  const supabase = await createClient();

  // Every query below runs as this member, so RLS decides what comes back.
  const { data: season } = await supabase
    .from("seasons")
    .select("*")
    .eq("status", "active")
    .maybeSingle();

  const [{ data: standings }, { data: games }] = await Promise.all([
    supabase
      .from("standings")
      .select("*")
      .eq("season_id", season?.id ?? "")
      .order("rank", { ascending: true }),
    supabase
      .from("games")
      .select("id, week, status, home_score, away_score, is_tracked, home_team_id, away_team_id")
      .eq("season_id", season?.id ?? "")
      .order("week", { ascending: false })
      .limit(8),
  ]);

  const teamName = new Map(
    (standings ?? []).map((s) => [s.team_id, s.name ?? "—"]),
  );

  return (
    <div className="space-y-6">
      {denied === "admin" && (
        <div className="flex items-center gap-2 rounded-lg bg-pink-50 px-4 py-3 text-sm text-pink-700">
          <ShieldAlert size={16} />
          That area is commissioner only.
        </div>
      )}

      <div>
        <p className="eyebrow text-ash-500">{season?.name ?? "No active season"}</p>
        <h1 className="text-2xl font-bold text-navy-800">
          Welcome back, {person.nickname || person.first_name}
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        {/* ---------- standings ---------- */}
        <section className="overflow-hidden rounded-xl border border-ash-200 bg-white">
          <header className="flex items-center justify-between border-b border-ash-200 px-4 py-3">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-navy-800">
              Standings
            </h2>
            <Link href="/standings" className="text-xs font-semibold text-pink-500 hover:underline">
              Full table
            </Link>
          </header>

          {standings?.length ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ash-200 text-ash-500">
                  <th className="eyebrow px-4 py-2 text-left font-semibold">Team</th>
                  <th className="eyebrow px-2 py-2 text-right font-semibold">W</th>
                  <th className="eyebrow px-2 py-2 text-right font-semibold">L</th>
                  <th className="eyebrow px-2 py-2 text-right font-semibold">PF</th>
                  <th className="eyebrow px-2 py-2 text-right font-semibold">PA</th>
                  <th className="eyebrow px-4 py-2 text-right font-semibold">Diff</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((row) => (
                  <tr key={row.team_id} className="border-b border-ash-100 last:border-0">
                    <td className="px-4 py-2.5 font-semibold text-ash-900">
                      <span className="mr-2 font-mono text-xs text-ash-400">{row.rank}</span>
                      {row.name}
                    </td>
                    <td className="px-2 py-2.5 text-right font-mono text-xs">{row.wins}</td>
                    <td className="px-2 py-2.5 text-right font-mono text-xs">{row.losses}</td>
                    <td className="px-2 py-2.5 text-right font-mono text-xs">{row.points_for}</td>
                    <td className="px-2 py-2.5 text-right font-mono text-xs">{row.points_against}</td>
                    <td
                      className={`px-4 py-2.5 text-right font-mono text-xs font-bold ${
                        (row.point_differential ?? 0) > 0
                          ? "text-win"
                          : (row.point_differential ?? 0) < 0
                            ? "text-loss"
                            : "text-ash-400"
                      }`}
                    >
                      {(row.point_differential ?? 0) > 0 ? "+" : ""}
                      {row.point_differential}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="px-4 py-8 text-center text-sm text-ash-500">
              No games played yet this season.
            </p>
          )}
        </section>

        {/* ---------- scores ---------- */}
        <section className="overflow-hidden rounded-xl border border-ash-200 bg-white">
          <header className="flex items-center justify-between border-b border-ash-200 px-4 py-3">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-navy-800">
              Scores
            </h2>
            <Link href="/games" className="text-xs font-semibold text-pink-500 hover:underline">
              All games
            </Link>
          </header>

          {games?.length ? (
            <ul>
              {games.map((g) => {
                const homeWon = g.home_score > g.away_score;
                return (
                  <li key={g.id} className="border-b border-ash-100 px-4 py-3 last:border-0">
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className="eyebrow text-ash-400">Week {g.week}</span>
                      <span className="eyebrow text-ash-400">
                        {g.status === "final" ? "Final" : g.status.replace(/_/g, " ")}
                      </span>
                      {g.is_tracked && (
                        <span className="eyebrow rounded bg-navy-50 px-1.5 py-0.5 text-navy-600">
                          Tracked
                        </span>
                      )}
                    </div>

                    <div className="flex items-baseline justify-between gap-3">
                      <span
                        className={`truncate text-sm ${homeWon ? "font-bold text-ash-900" : "text-ash-500"}`}
                      >
                        {teamName.get(g.home_team_id) ?? "—"}
                      </span>
                      <span className="font-mono text-sm font-bold">{g.home_score}</span>
                    </div>
                    <div className="flex items-baseline justify-between gap-3">
                      <span
                        className={`truncate text-sm ${!homeWon ? "font-bold text-ash-900" : "text-ash-500"}`}
                      >
                        {teamName.get(g.away_team_id) ?? "—"}
                      </span>
                      <span className="font-mono text-sm font-bold">{g.away_score}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-4 py-8 text-center text-sm text-ash-500">Nothing scheduled yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}
