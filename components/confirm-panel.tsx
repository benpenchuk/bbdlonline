import { confirmGame, forceFinal } from "@/app/(app)/track/[id]/actions";
import { CheckCircle2, Clock } from "lucide-react";

type TeamRef = { id: string; name: string };

/**
 * A game isn't official until one rep from each team signs off. The second
 * confirmation flips it to final via a database trigger, so no application
 * code decides when a result counts.
 */
export function ConfirmPanel({
  gameId,
  home,
  away,
  confirmedTeamIds,
  myTeamIds,
  isCommissioner,
}: {
  gameId: string;
  home: TeamRef;
  away: TeamRef;
  confirmedTeamIds: string[];
  myTeamIds: string[];
  isCommissioner: boolean;
}) {
  const teams = [away, home];
  const outstanding = teams.filter((t) => !confirmedTeamIds.includes(t.id));

  return (
    <div className="rounded-lg border border-pink-500/30 bg-pink-500/5 px-4 py-3">
      <h3 className="mb-1 font-display text-sm font-bold text-navy-800">
        Waiting on approval
      </h3>
      <p className="mb-3 text-xs text-ash-600">
        One player from each team confirms the result before it counts toward the
        standings.
      </p>

      <ul className="mb-3 space-y-1.5">
        {teams.map((t) => {
          const done = confirmedTeamIds.includes(t.id);
          const mine = myTeamIds.includes(t.id);

          return (
            <li key={t.id} className="flex items-center gap-2 text-sm">
              {done ? (
                <CheckCircle2 size={14} className="text-win" />
              ) : (
                <Clock size={14} className="text-ash-400" />
              )}
              <span className={done ? "text-ash-500" : "text-ash-900"}>{t.name}</span>

              {!done && (mine || isCommissioner) && (
                <form action={confirmGame} className="ml-auto">
                  <input type="hidden" name="game_id" value={gameId} />
                  <input type="hidden" name="team_id" value={t.id} />
                  <button className="rounded bg-pink-500 px-2.5 py-1 font-display text-xs font-semibold text-white hover:bg-pink-600">
                    {mine ? "Confirm" : "Confirm for them"}
                  </button>
                </form>
              )}
            </li>
          );
        })}
      </ul>

      {isCommissioner && outstanding.length > 0 && (
        <form action={forceFinal}>
          <input type="hidden" name="game_id" value={gameId} />
          <button className="font-mono text-[10px] text-ash-500 underline hover:text-loss">
            override and make final
          </button>
        </form>
      )}
    </div>
  );
}
