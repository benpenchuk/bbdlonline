"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Mail, KeyRound, CheckCircle2, AlertCircle } from "lucide-react";
import { requestMagicLink, type JoinState } from "./actions";

const initial: JoinState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-pink-500 px-4 py-3 font-display font-semibold text-white transition hover:bg-pink-600 disabled:opacity-60"
    >
      {pending ? "Sending…" : "Email me a link"}
    </button>
  );
}

export function JoinForm({ next, presetCode }: { next: string; presetCode?: string }) {
  const [state, formAction] = useActionState(requestMagicLink, initial);

  if (state.status === "sent") {
    return (
      <div className="rounded-xl border border-ash-200 bg-white p-6 text-center">
        <CheckCircle2 className="mx-auto mb-3 text-win" size={36} />
        <h2 className="mb-2 text-xl font-semibold text-navy-800">Check your email</h2>
        <p className="text-sm text-ash-600">
          We sent a sign-in link to <strong className="text-ash-900">{state.email}</strong>.
          It expires in an hour. No password to remember.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="rounded-xl border border-ash-200 bg-white p-6">
      <input type="hidden" name="next" value={next} />

      <label className="eyebrow mb-2 block text-ash-500" htmlFor="email">
        Email
      </label>
      <div className="relative mb-5">
        <Mail
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ash-400"
        />
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="w-full rounded-lg border border-ash-300 py-3 pl-9 pr-3 text-base outline-none focus:border-pink-500"
        />
      </div>

      <label className="eyebrow mb-2 block text-ash-500" htmlFor="invite_code">
        Invite code <span className="normal-case tracking-normal">— first time only</span>
      </label>
      <div className="relative mb-5">
        <KeyRound
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ash-400"
        />
        <input
          id="invite_code"
          name="invite_code"
          type="text"
          defaultValue={presetCode}
          placeholder="bbdl-…"
          className="w-full rounded-lg border border-ash-300 py-3 pl-9 pr-3 font-mono text-sm outline-none focus:border-pink-500"
        />
      </div>

      {state.status === "error" && (
        <div className="mb-4 flex gap-2 rounded-lg bg-pink-50 p-3 text-sm text-pink-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{state.message}</span>
        </div>
      )}

      <SubmitButton />

      <p className="mt-4 text-center text-xs leading-relaxed text-ash-500">
        BBDL is invite only. Already have an account? Leave the code blank.
      </p>
    </form>
  );
}
