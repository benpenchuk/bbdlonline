"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Shield } from "lucide-react";
import { createTeam, type TeamResult } from "./actions";
import type { Person } from "@/lib/supabase/types";

const initial: TeamResult = { ok: false };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="w-full rounded-lg bg-pink-500 px-4 py-2.5 font-display text-sm font-semibold text-white hover:bg-pink-600 disabled:opacity-60"
    >
      {pending ? "Creating…" : "Create team"}
    </button>
  );
}

export function NewTeamForm({ people }: { people: Person[] }) {
  const [state, action] = useActionState(createTeam, initial);

  return (
    <div className="rounded-lg border border-ash-200 bg-white p-5">
      <h3 className="mb-1 flex items-center gap-2 font-display text-base font-bold text-navy-800">
        <Shield size={16} /> Add a team
      </h3>
      <p className="mb-4 text-xs text-ash-500">
        Pairs are fixed for the season. Anything you create here is approved
        straight away.
      </p>

      <form action={action} className="space-y-3">
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <input
            name="name"
            required
            placeholder="Team name"
            className="rounded-lg border border-ash-300 px-3 py-2 text-sm outline-none focus:border-pink-500"
          />
          <input
            name="abbreviation"
            placeholder="ABV"
            maxLength={4}
            className="w-20 rounded-lg border border-ash-300 px-3 py-2 text-center text-sm uppercase outline-none focus:border-pink-500"
          />
        </div>

        <select
          name="player_1"
          required
          defaultValue=""
          className="w-full rounded-lg border border-ash-300 px-3 py-2 text-sm"
        >
          <option value="" disabled>
            First player…
          </option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.first_name} {p.last_name}
            </option>
          ))}
        </select>

        <select
          name="player_2"
          required
          defaultValue=""
          className="w-full rounded-lg border border-ash-300 px-3 py-2 text-sm"
        >
          <option value="" disabled>
            Second player…
          </option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.first_name} {p.last_name}
            </option>
          ))}
        </select>

        <Submit />
      </form>

      {state.message && (
        <p className={`mt-3 text-xs ${state.ok ? "text-win" : "text-loss"}`} role="status">
          {state.message}
        </p>
      )}
    </div>
  );
}
