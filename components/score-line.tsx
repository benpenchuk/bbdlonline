import Link from "next/link";

type Side = { id: string; name: string; score: number; roster?: string };

/** One game as a row: two teams, two scores, winner in bold. The shape every
 *  sports site uses, because it reads at a glance on a phone. */
export function ScoreLine({
  gameId,
  home,
  away,
  status,
  when,
  tracked,
}: {
  gameId: string;
  home: Side;
  away: Side;
  status: string;
  when?: string | null;
  tracked?: boolean;
}) {
  const final = status === "final";
  const homeWon = final && home.score > away.score;
  const awayWon = final && away.score > home.score;

  const Row = ({ side, won }: { side: Side; won: boolean }) => (
    <div className="flex items-baseline gap-2">
      <span
        className={`min-w-0 flex-1 truncate text-sm ${
          won ? "font-bold text-navy-800" : final ? "text-ash-500" : "text-ash-800"
        }`}
      >
        {side.name}
        {side.roster && (
          <span className="ml-1.5 text-[11px] font-normal text-ash-400">{side.roster}</span>
        )}
      </span>
      <span
        className={`font-mono text-base tabular-nums ${
          won ? "font-bold text-navy-800" : final ? "text-ash-400" : "text-ash-300"
        }`}
      >
        {final ? side.score : "—"}
      </span>
    </div>
  );

  return (
    <Link
      href={`/games/${gameId}`}
      className="block border-b border-ash-100 px-3 py-2.5 transition last:border-0 hover:bg-ash-50"
    >
      <div className="mb-1 flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-ash-400">
          {final ? "Final" : status === "in_progress" ? "Live" : (when ?? "Scheduled")}
        </span>
        {tracked && (
          <span className="rounded bg-pink-500/10 px-1.5 font-mono text-[9px] uppercase tracking-wide text-pink-500">
            tracked
          </span>
        )}
      </div>
      <div className="space-y-0.5">
        <Row side={away} won={awayWon} />
        <Row side={home} won={homeWon} />
      </div>
    </Link>
  );
}
