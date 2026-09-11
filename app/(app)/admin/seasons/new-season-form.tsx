"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CalendarPlus } from "lucide-react";
import { createSeason, type SeasonResult } from "./actions";

const initial: SeasonResult = { ok: false };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="w-full rounded-lg bg-pink-500 px-4 py-2.5 font-display text-sm font-semibold text-white hover:bg-pink-600 disabled:opacity-60"
    >
      {pending ? "Creating…" : "Create season"}
    </button>
  );
}

export function NewSeasonForm() {
  const [state, action] = useActionState(createSeason, initial);
  const thisYear = new Date().getFullYear();

  return (
    <div className="rounded-lg border border-ash-200 bg-white p-5">
      <h3 className="mb-1 flex items-center gap-2 font-display text-base font-bold text-navy-800">
        <CalendarPlus size={16} /> Start a season
      </h3>
      <p className="mb-4 text-xs text-ash-500">
        One per term. Creating it doesn&apos;t activate it — you can set the teams
        up first and flip it live when play starts.
      </p>

      <form action={action} className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <select
            name="term"
            defaultValue="fall"
            className="rounded-lg border border-ash-300 px-3 py-2 text-sm"
          >
            <option value="fall">Fall</option>
            <option value="spring">Spring</option>
          </select>
          <input
            name="year"
            type="number"
            defaultValue={thisYear}
            className="rounded-lg border border-ash-300 px-3 py-2 text-sm tabular-nums outline-none focus:border-pink-500"
          />
        </div>
        <label className="block">
          <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-ash-500">
            Regular season weeks
          </span>
          <input
            name="regular_weeks"
            type="number"
            defaultValue={6}
            min={1}
            className="w-full rounded-lg border border-ash-300 px-3 py-2 text-sm tabular-nums outline-none focus:border-pink-500"
          />
        </label>
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
