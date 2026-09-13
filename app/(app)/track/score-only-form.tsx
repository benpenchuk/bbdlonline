"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { submitScoreOnly, type ThrowResult } from "./[id]/actions";
import { PLAYERS_PER_SIDE } from "@/lib/lineup";

const initial: ThrowResult = { ok: false };

type Member = { id: string; name: string };

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

/**
 * One team's side of the lineup. Two rostered players are simply who played,
 * sent as hidden fields. More than two means a sub exists, so the person
 * logging the score picks — the whole roster is never assumed.
 */
function TeamLineup({ teamName, members }: { teamName: string; members: Member[] }) {
  if (members.length <= PLAYERS_PER_SIDE) {
    return (
      <>
        {members.map((m) => (
          <input key={m.id} type="hidden" name="lineup" value={m.id} />
        ))}
      </>
    );
  }

  return (
    <fieldset className="mb-3">
      <legend className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-ash-500">
        Who played for {teamName}? Pick {PLAYERS_PER_SIDE}.
      </legend>
      <div className="flex flex-wrap gap-2">
        {members.map((m) => (
          <label
            key={m.id}
            className="flex cursor-pointer items-center gap-1.5 rounded border border-ash-300 bg-white px-2 py-1 text-xs has-[:checked]:border-pink-500 has-[:checked]:bg-pink-500/10"
          >
            <input type="checkbox" name="lineup" value={m.id} className="accent-pink-500" />
            {m.name}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** For nights nobody wants to track. The game counts for the standings and
 *  for each player's record, but not for throw stats — there are no throws. */
export function ScoreOnlyForm({
  gameId,
  homeName,
  awayName,
  homeRoster,
  awayRoster,
}: {
  gameId: string;
  homeName: string;
  awayName: string;
  homeRoster: Member[];
  awayRoster: Member[];
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
      <p className="mb-3 text-xs text-ash-500">
        No throw log, so this won&apos;t count toward accuracy or sinks — only the
        standings and each player&apos;s record.
      </p>

      <TeamLineup teamName={awayName} members={awayRoster} />
      <TeamLineup teamName={homeName} members={homeRoster} />

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
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-ash-500">
          Cancel
        </button>
      </div>
      {state.message && !state.ok && (
        <p className="mt-2 text-xs text-loss">{state.message}</p>
      )}
    </form>
  );
}
