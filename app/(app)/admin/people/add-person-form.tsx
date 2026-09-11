"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { UserPlus } from "lucide-react";
import { addPerson, type ActionResult } from "./actions";

const initial: ActionResult = { ok: false };

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-navy-800 px-4 py-2.5 font-display text-sm font-semibold text-white transition hover:bg-navy-700 disabled:opacity-60"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}

export function AddPersonForm() {
  const [state, action] = useActionState(addPerson, initial);

  return (
    <div className="rounded-lg border border-ash-200 bg-white p-5">
      <h3 className="mb-1 flex items-center gap-2 font-display text-base font-bold text-navy-800">
        <UserPlus size={16} /> Add a person
      </h3>
      <p className="mb-4 text-xs text-ash-500">
        For someone with no account — a guy who graduated before the site existed,
        or a new player you want on a roster now. He can claim the row later with
        an invite.
      </p>

      <form action={action} className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <input
            name="first_name"
            required
            placeholder="First name"
            className="rounded-lg border border-ash-300 px-3 py-2 text-sm outline-none focus:border-pink-500"
          />
          <input
            name="last_name"
            required
            placeholder="Last name"
            className="rounded-lg border border-ash-300 px-3 py-2 text-sm outline-none focus:border-pink-500"
          />
        </div>
        <input
          name="email"
          type="email"
          placeholder="Email (optional)"
          className="w-full rounded-lg border border-ash-300 px-3 py-2 text-sm outline-none focus:border-pink-500"
        />
        <select
          name="league_status"
          defaultValue="player"
          className="w-full rounded-lg border border-ash-300 px-3 py-2 text-sm"
        >
          <option value="player">Player — appears on rosters</option>
          <option value="alumni">Alumni — keeps history, not active</option>
          <option value="spectator">Spectator — can watch, doesn&apos;t play</option>
        </select>
        <Submit label="Add person" />
      </form>

      {state.message && (
        <p
          className={`mt-3 text-xs ${state.ok ? "text-win" : "text-loss"}`}
          role="status"
        >
          {state.message}
        </p>
      )}
    </div>
  );
}
