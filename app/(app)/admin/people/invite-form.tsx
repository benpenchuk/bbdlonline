"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { KeyRound, Copy, Check } from "lucide-react";
import { createInvite, type ActionResult } from "./actions";
import type { Person } from "@/lib/supabase/types";

const initial: ActionResult = { ok: false };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-pink-500 px-4 py-2.5 font-display text-sm font-semibold text-white transition hover:bg-pink-600 disabled:opacity-60"
    >
      {pending ? "Creating…" : "Create invite"}
    </button>
  );
}

function CodeBox({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="mt-3 rounded-lg border border-win/30 bg-win/5 p-3">
      <p className="mb-2 text-xs text-ash-600">
        Send this code. They enter it at <span className="font-mono">/join</span>{" "}
        with their email.
      </p>
      <div className="flex items-center gap-2">
        <code className="flex-1 truncate rounded bg-white px-2 py-1.5 font-mono text-xs text-ash-900">
          {code}
        </code>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(code).then(
              () => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              },
              () => setCopied(false),
            );
          }}
          className="flex shrink-0 items-center gap-1 rounded bg-navy-800 px-2.5 py-1.5 font-display text-xs font-semibold text-white"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

export function InviteForm({ people }: { people: Person[] }) {
  const [state, action] = useActionState(createInvite, initial);

  // Only offer to pre-link people who haven't signed up yet — anyone already
  // bound to an account doesn't need an invite.
  const unclaimed = people.filter((p) => !p.auth_user_id);

  return (
    <div className="rounded-lg border border-ash-200 bg-white p-5">
      <h3 className="mb-1 flex items-center gap-2 font-display text-base font-bold text-navy-800">
        <KeyRound size={16} /> Create an invite
      </h3>
      <p className="mb-4 text-xs text-ash-500">
        Nobody gets in without one. Attach it to an existing person so they keep
        their stats, or leave it open as a code for the group chat.
      </p>

      <form action={action} className="space-y-3">
        <label className="block">
          <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-ash-500">
            Attach to someone
          </span>
          <select
            name="person_id"
            defaultValue=""
            className="w-full rounded-lg border border-ash-300 px-3 py-2 text-sm"
          >
            <option value="">Nobody — anyone with the code</option>
            {unclaimed.map((p) => (
              <option key={p.id} value={p.id}>
                {p.first_name} {p.last_name}
              </option>
            ))}
          </select>
        </label>

        <input
          name="email"
          type="email"
          placeholder="Email (optional, for your records)"
          className="w-full rounded-lg border border-ash-300 px-3 py-2 text-sm outline-none focus:border-pink-500"
        />

        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-ash-500">
              Grants role
            </span>
            <select
              name="grants_role"
              defaultValue="member"
              className="w-full rounded-lg border border-ash-300 px-3 py-2 text-sm"
            >
              <option value="member">Member</option>
              <option value="commissioner">Commissioner</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-ash-500">
              Uses
            </span>
            <input
              name="max_uses"
              type="number"
              min={1}
              defaultValue={1}
              placeholder="blank = unlimited"
              className="w-full rounded-lg border border-ash-300 px-3 py-2 text-sm outline-none focus:border-pink-500"
            />
          </label>
        </div>

        <input type="hidden" name="grants_status" value="player" />
        <Submit />
      </form>

      {state.ok && state.code && <CodeBox code={state.code} />}
      {state.message && !state.ok && (
        <p className="mt-3 text-xs text-loss" role="status">
          {state.message}
        </p>
      )}
    </div>
  );
}
