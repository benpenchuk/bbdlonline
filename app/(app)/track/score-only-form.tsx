"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { submitScoreOnly, type ThrowResult } from "./[id]/actions";

const initial: ThrowResult = { ok: false };

function Save() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="rounded-lg bg-navy-800 px-3 py-2 font-display text-sm font-semibold text-white disabled:opacity-60"
    >
      {pending ? "Saving…" : "Submit score"}
    </button>
  );
}

/** For nights nobody wants to track. The game counts for the standings but is
 *  excluded from stat leaderboards, because there are no throws behind it. */
export function ScoreOnlyForm({
  gameId,
  homeName,
  awayName,
}: {
  gameId: string;
  homeName: string;
  awayName: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(submitScoreOnly, initial);

  if (state.ok) {
    return <p className="text-xs text-win">{state.message}</p>;
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-ash-300 px-3 py-2 font-display text-sm font-semibold text-ash-600 hover:border-ash-400"
      >
        Just log the score
      </button>
    );
  }

  return (
    <form action={action} className="w-full rounded-lg bg-ash-50 p-3">
      <input type="hidden" name="game_id" value={gameId} />
      <p className="mb-2 text-xs text-ash-500">
        No throw log, so this won&apos;t count toward accuracy or sinks — only the
        standings.
      </p>
      <div className="mb-3 grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block truncate font-mono text-[10px] uppercase tracking-wider text-ash-500">
            {awayName}
          </span>
          <input
            name="away_score"
            type="number"
            min={0}
            required
            className="w-full rounded border border-ash-300 px-2 py-1.5 text-center font-mono tabular-nums"
          />
        </label>
        <label className="block">
          <span className="mb-1 block truncate font-mono text-[10px] uppercase tracking-wider text-ash-500">
            {homeName}
          </span>
          <input
            name="home_score"
            type="number"
            min={0}
            required
            className="w-full rounded border border-ash-300 px-2 py-1.5 text-center font-mono tabular-nums"
          />
        </label>
      </div>
      <div className="flex items-center gap-2">
        <Save />
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-ash-500"
        >
          Cancel
        </button>
      </div>
      {state.message && !state.ok && (
        <p className="mt-2 text-xs text-loss">{state.message}</p>
      )}
    </form>
  );
}
