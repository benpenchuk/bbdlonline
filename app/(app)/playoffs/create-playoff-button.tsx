"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createPlayoff, type PlayoffResult } from "./actions";

const initial: PlayoffResult = { ok: false };

function Go() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="rounded-lg bg-pink-500 px-5 py-3 font-display font-semibold text-white hover:bg-pink-600 disabled:opacity-60"
    >
      {pending ? "Seeding…" : "Seed the bracket"}
    </button>
  );
}

export function CreatePlayoffButton() {
  const [state, action] = useActionState(createPlayoff, initial);

  return (
    <div className="rounded-lg border border-ash-200 bg-white p-5">
      <h2 className="mb-1 font-display text-base font-bold text-navy-800">
        Build the playoff bracket
      </h2>
      <p className="mb-4 text-sm text-ash-500">
        Takes the top half of the standings and seeds them 1-vs-last. Semis and
        the final use this season&apos;s point targets, so change those under
        Seasons first if you want them different.
      </p>
      <form action={action}>
        <Go />
      </form>
      {state.message && (
        <p className={`mt-3 text-sm ${state.ok ? "text-win" : "text-loss"}`} role="status">
          {state.message}
        </p>
      )}
    </div>
  );
}
