"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Pencil } from "lucide-react";
import { updateMyProfile, type ProfileResult } from "./actions";
import type { Person } from "@/lib/supabase/types";

const initial: ProfileResult = { ok: false };

function Save() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="rounded-lg bg-pink-500 px-4 py-2 font-display text-sm font-semibold text-white hover:bg-pink-600 disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save"}
    </button>
  );
}

/** Nickname, hometown and throwing hand are yours. Your real name and your role
 *  are the commissioner's — the database enforces that independently. */
export function ProfileEditor({ person }: { person: Person }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(updateMyProfile, initial);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-ash-300 px-3 py-1.5 font-display text-sm font-semibold text-ash-700 hover:border-pink-500"
      >
        <Pencil size={14} /> Edit profile
      </button>
    );
  }

  return (
    <form action={action} className="w-64 rounded-lg border border-ash-200 bg-white p-4">
      <label className="mb-3 block">
        <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-ash-500">
          Nickname
        </span>
        <input
          name="nickname"
          defaultValue={person.nickname ?? ""}
          placeholder="none"
          className="w-full rounded border border-ash-300 px-2 py-1.5 text-sm outline-none focus:border-pink-500"
        />
      </label>

      <label className="mb-3 block">
        <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-ash-500">
          Hometown
        </span>
        <input
          name="hometown_city"
          defaultValue={person.hometown_city ?? ""}
          className="w-full rounded border border-ash-300 px-2 py-1.5 text-sm outline-none focus:border-pink-500"
        />
      </label>

      <label className="mb-4 block">
        <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-ash-500">
          Throws
        </span>
        <select
          name="dominant_hand"
          defaultValue={person.dominant_hand ?? ""}
          className="w-full rounded border border-ash-300 px-2 py-1.5 text-sm"
        >
          <option value="">—</option>
          <option value="right">Right</option>
          <option value="left">Left</option>
        </select>
      </label>

      <div className="flex items-center gap-2">
        <Save />
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-ash-500 hover:text-ash-800"
        >
          Cancel
        </button>
      </div>

      {state.message && (
        <p className={`mt-2 text-xs ${state.ok ? "text-win" : "text-loss"}`} role="status">
          {state.message}
        </p>
      )}
    </form>
  );
}
