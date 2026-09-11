import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveSeason, getPlayerSeasonStats } from "@/lib/queries";
import { displayName } from "@/lib/auth";
import { EmptyState } from "@/components/empty-state";

export const metadata = { title: "Stats · BBDL" };

/** Rate stats need a floor, or one lucky tracked game tops the table forever. */
const MIN_TRACKED_GAMES = 2;
const MIN_THROWS = 20;

type Row = { personId: string; value: number; detail: string };

function Board({
  title,
  note,
  rows,
  nameOf,
  format,
}: {
  title: string;
  note?: string;
  rows: Row[];
  nameOf: (id: string) => { name: string; slug: string } | null;
  format: (v: number) => string;
}) {
  return (
    <div className="rounded-lg border border-ash-200 bg-white">
      <div className="border-b border-ash-100 px-3 py-2">
        <h3 className="font-display text-sm font-bold text-navy-800">{title}</h3>
        {note && <p className="font-mono text-[10px] text-ash-400">{note}</p>}
      </div>
      {rows.length === 0 ? (
        <p className="px-3 py-5 text-center text-xs text-ash-400">Not enough data yet.</p>
      ) : (
        <ol>
          {rows.map((r, i) => {
            const person = nameOf(r.personId);
            return (
              <li
                key={r.personId}
                className="flex items-baseline gap-2.5 border-b border-ash-50 px-3 py-2 last:border-0"
              >
                <span className="w-4 shrink-0 font-mono text-[10px] tabular-nums text-ash-400">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">
                  {person ? (
                    <Link
                      href={`/players/${person.slug}`}
                      className="text-navy-800 hover:text-pink-500"
                    >
                      {person.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                  <span className="ml-1.5 font-mono text-[10px] text-ash-400">
                    {r.detail}
                  </span>
                </span>
                <span className="shrink-0 font-mono text-sm font-bold tabular-nums text-navy-800">
                  {format(r.value)}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

export default async function StatsPage() {
  const season = await getActiveSeason();
  if (!season) return <EmptyState title="No active season" />;

  const supabase = await createClient();
  const [stats, { data: people }] = await Promise.all([
    getPlayerSeasonStats(season.id),
    supabase.from("people").select("*"),
  ]);

  if (stats.length === 0) {
    return (
      <EmptyState
        title="No stats yet"
        body="Stats appear once games have been played and confirmed."
      />
    );
  }

  const peopleById = new Map((people ?? []).map((p) => [p.id, p]));
  const nameOf = (id: string) => {
    const p = peopleById.get(id);
    return p ? { name: displayName(p), slug: p.slug } : null;
  };

  const top = (
    pick: (s: (typeof stats)[number]) => number | null,
    detail: (s: (typeof stats)[number]) => string,
    filter: (s: (typeof stats)[number]) => boolean = () => true,
  ): Row[] =>
    stats
      .filter((s) => s.person_id && filter(s) && pick(s) !== null)
      .map((s) => ({ personId: s.person_id!, value: pick(s)!, detail: detail(s) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

  const qualified = (s: (typeof stats)[number]) =>
    (s.games_tracked ?? 0) >= MIN_TRACKED_GAMES && (s.throws ?? 0) >= MIN_THROWS;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight text-navy-800">
          League leaders
        </h1>
        <p className="text-sm text-ash-500">{season.name}</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Board
          title="Wins"
          rows={top((s) => s.wins, (s) => `${s.games_played} GP`)}
          nameOf={nameOf}
          format={(v) => String(v)}
        />
        <Board
          title="Total points"
          rows={top((s) => s.total_points, (s) => `${s.points_per_game ?? 0}/gm`)}
          nameOf={nameOf}
          format={(v) => String(v)}
        />
        <Board
          title="Accuracy"
          note={`min ${MIN_TRACKED_GAMES} tracked games, ${MIN_THROWS} throws`}
          rows={top((s) => s.accuracy_pct, (s) => `${s.table_hits}/${s.throws}`, qualified)}
          nameOf={nameOf}
          format={(v) => `${v}%`}
        />
        <Board
          title="Sinks"
          rows={top((s) => s.sinks, (s) => `${s.throws} throws`)}
          nameOf={nameOf}
          format={(v) => String(v)}
        />
        <Board
          title="Fifas"
          note="points won on defense"
          rows={top((s) => s.fifas, (s) => `${s.defensive_points} def pts`)}
          nameOf={nameOf}
          format={(v) => String(v)}
        />
        <Board
          title="Win rate"
          note={`min ${MIN_TRACKED_GAMES} games`}
          rows={top(
            (s) => s.win_pct,
            (s) => `${s.wins}–${s.losses}`,
            (s) => (s.games_played ?? 0) >= MIN_TRACKED_GAMES,
          )}
          nameOf={nameOf}
          format={(v) => `${v}%`}
        />
      </div>

      <p className="text-xs text-ash-500">
        Throw stats come only from games somebody tracked. Score-only games count
        toward records but not toward accuracy, sinks or fifas.
      </p>
    </div>
  );
}
