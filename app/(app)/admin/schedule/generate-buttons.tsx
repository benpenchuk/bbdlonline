"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Shuffle, Swords } from "lucide-react";
import {
  generateRegularSeason,
  buildRivalryWeek,
  type ScheduleResult,
} from "./actions";
import { maxRoundsFor } from "@/lib/schedule";

const initial: ScheduleResult = { ok: false };

function Go({ label, busy }: { label: string; busy: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="rounded-lg bg-navy-800 px-4 py-2 font-display text-sm font-semibold text-white hover:bg-navy-700 disabled:opacity-60"
    >
      {pending ? busy : label}
    </button>
  );
}

export function GenerateButtons({
  teamCount,
  regularWeeks,
  hasGames,
}: {
  teamCount: number;
  regularWeeks: number;
  hasGames: boolean;
}) {
  const [regular, regularAction] = useActionState(generateRegularSeason, initial);
  const [rivalry, rivalryAction] = useActionState(buildRivalryWeek, initial);

  const wanted = Math.max(1, regularWeeks - 1);
  const possible = Math.min(wanted, maxRoundsFor(teamCount));
  const short = teamCount >= 2 && possible < wanted;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-lg border border-ash-200 bg-white p-4">
        <h3 className="mb-1 flex items-center gap-2 font-display text-sm font-bold text-navy-800">
          <Shuffle size={15} /> Weeks 1–{wanted}
        </h3>
        <p className="mb-3 text-xs text-ash-500">
          Random pairings, nobody plays the same team twice. Week {regularWeeks} is
          left for rivalry.
        </p>

        {short && (
          <p className="mb-3 rounded bg-pink-500/10 px-2.5 py-1.5 text-[11px] text-pink-600">
            {teamCount} teams only supports {possible} non-repeating week
            {possible === 1 ? "" : "s"}. You&apos;ll get {possible}.
          </p>
        )}

        <form action={regularAction}>
          <Go label={hasGames ? "Regenerate" : "Generate schedule"} busy="Building…" />
        </form>

        {regular.message && (
          <p
            className={`mt-2 text-xs ${regular.ok ? "text-win" : "text-loss"}`}
            role="status"
          >
            {regular.message}
          </p>
        )}
      </div>

      <div className="rounded-lg border border-ash-200 bg-white p-4">
        <h3 className="mb-1 flex items-center gap-2 font-display text-sm font-bold text-navy-800">
          <Swords size={15} /> Week {regularWeeks} — rivalry
        </h3>
        <p className="mb-3 text-xs text-ash-500">
          Turns accepted challenges into games, then pairs whoever nobody called
          out at random.
        </p>

        <form action={rivalryAction}>
          <Go label="Build rivalry week" busy="Pairing…" />
        </form>

        {rivalry.message && (
          <p
            className={`mt-2 text-xs ${rivalry.ok ? "text-win" : "text-loss"}`}
            role="status"
          >
            {rivalry.message}
          </p>
        )}
      </div>
    </div>
  );
}
