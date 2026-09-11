"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { turnState, isGameOver, COUNTS_AS_HIT, type LoggedThrow } from "@/lib/turn-order";
import { logThrow, undoThrow, submitTrackedGame } from "./actions";
import type { ThrowOutcome } from "@/lib/supabase/types";

type Player = { id: string; name: string; full: string; teamId: string };
type Team = { id: string; name: string };

export type TrackerProps = {
  gameId: string;
  home: Team;
  away: Team;
  players: Player[];
  rules: { target: number; winBy: number; cap: number | null };
  initialThrows: (LoggedThrow & { id: string; points: number | null; scoring_team_id: string | null })[];
};

/** Eight outcomes. Fifa has its own button because misses are constant and
 *  fifas are rare — burying it behind "missed" would mean a prompt on every
 *  ordinary miss. Non-scoring buttons say what they do rather than "0". */
const OUTCOMES: {
  id: ThrowOutcome;
  label: string;
  sub: string;
  kind: "score" | "fifa" | "plain";
}[] = [
  { id: "point", label: "Point", sub: "+1", kind: "score" },
  { id: "dink", label: "Dink", sub: "+2", kind: "score" },
  { id: "sink", label: "Sink", sub: "+3", kind: "score" },
  { id: "field_goal", label: "Field goal", sub: "+2", kind: "score" },
  { id: "caught", label: "Caught", sub: "no point", kind: "plain" },
  { id: "missed", label: "Missed", sub: "no point", kind: "plain" },
  { id: "rethrow", label: "Stayed on table + called it", sub: "throw again", kind: "plain" },
  { id: "fifa", label: "Fifa", sub: "+1 defense", kind: "fifa" },
];

export function Tracker({ gameId, home, away, players, rules, initialThrows }: TrackerProps) {
  const router = useRouter();
  const [throws, setThrows] = useState(initialThrows);
  const [startTeam, setStartTeam] = useState<string | null>(
    initialThrows.length ? initialThrows[0].thrower_team_id : null,
  );
  const [leadPick, setLeadPick] = useState<string | null>(null);
  const [askDefender, setAskDefender] = useState<ThrowOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const rosterOf = useCallback(
    (teamId: string) => players.filter((p) => p.teamId === teamId).map((p) => p.id),
    [players],
  );
  const playerById = (id: string) => players.find((p) => p.id === id);

  const scoreOf = (teamId: string) =>
    throws.reduce((n, t) => n + (t.scoring_team_id === teamId ? (t.points ?? 0) : 0), 0);

  const homeScore = scoreOf(home.id);
  const awayScore = scoreOf(away.id);
  const over = isGameOver(homeScore, awayScore, rules.target, rules.winBy, rules.cap);

  const otherTeam = (id: string) => (id === home.id ? away.id : home.id);

  const ts = startTeam
    ? turnState(throws, startTeam, otherTeam(startTeam), rosterOf)
    : null;
  const currentThrower = ts ? (ts.needsPick ? leadPick : ts.throwerId) : null;

  const fifasBy = (teamId: string) =>
    throws.filter((t) => t.outcome === "fifa" && t.scoring_team_id === teamId).length;

  async function record(outcome: ThrowOutcome, defenderId?: string) {
    if (!currentThrower) return;
    const thrower = playerById(currentThrower);
    if (!thrower) return;

    setError(null);
    const result = await logThrow({
      gameId,
      throwerId: thrower.id,
      throwerTeamId: thrower.teamId,
      outcome,
      defenderId: defenderId ?? null,
    });

    if (!result.ok) {
      setError(result.message ?? "Couldn't save that throw.");
      return;
    }

    // mirror what the database computed, so the scoreboard matches the log
    const scoringTeam =
      outcome === "fifa"
        ? otherTeam(thrower.teamId)
        : ["point", "dink", "sink", "field_goal"].includes(outcome)
          ? thrower.teamId
          : null;
    const points: Record<string, number> = {
      point: 1, dink: 2, sink: 3, field_goal: 2, fifa: 1,
    };

    setThrows((prev) => [
      ...prev,
      {
        id: result.id!,
        thrower_id: thrower.id,
        thrower_team_id: thrower.teamId,
        outcome,
        points: points[outcome] ?? 0,
        scoring_team_id: scoringTeam,
      },
    ]);
    setLeadPick(null);
    setAskDefender(null);
  }

  function onOutcome(outcome: ThrowOutcome) {
    if (!currentThrower || over) return;
    if (outcome === "fifa" || outcome === "caught") {
      setAskDefender(outcome);
      return;
    }
    startTransition(() => void record(outcome));
  }

  function onUndo() {
    startTransition(async () => {
      const res = await undoThrow(gameId);
      if (!res.ok) return setError(res.message ?? "Undo failed.");
      setThrows((prev) => prev.slice(0, -1));
      setLeadPick(null);
    });
  }

  // ---------- setup ----------
  if (!startTeam) {
    return (
      <div className="mx-auto max-w-sm">
        <div className="rounded-t-xl bg-navy-800 px-5 py-5 text-white">
          <div className="eyebrow mb-1 text-navy-200">Before you start</div>
          <h1 className="font-display text-xl font-bold">
            {away.name} vs {home.name}
          </h1>
          <p className="mt-1 text-sm text-navy-100">
            Roll for it, then tell me who won. That&apos;s all I need.
          </p>
        </div>
        <div className="rounded-b-xl border border-t-0 border-ash-200 bg-white p-5">
          <div className="eyebrow mb-2 text-ash-500">Which team throws first?</div>
          <div className="grid grid-cols-2 gap-2">
            {[away, home].map((t) => (
              <button
                key={t.id}
                onClick={() => setStartTeam(t.id)}
                className="rounded-lg border-2 border-ash-200 px-3 py-4 font-display font-semibold text-navy-800 transition hover:border-pink-500"
              >
                {t.name}
                <span className="mt-1 block font-mono text-[10px] font-normal uppercase tracking-wide text-ash-400">
                  {players.filter((p) => p.teamId === t.id).map((p) => p.name).join(" · ")}
                </span>
              </button>
            ))}
          </div>
          <p className="mt-4 text-xs text-ash-500">
            Teams alternate turns, two throws each. You&apos;ll pick who leads at
            the top of every turn — nothing else.
          </p>
        </div>
      </div>
    );
  }

  const defenders = ts ? rosterOf(otherTeam(ts.teamId)).map(playerById) : [];

  return (
    <div className="mx-auto max-w-sm pb-8">
      {/* scoreboard */}
      <div className="rounded-t-xl bg-navy-800 px-4 py-3 text-white">
        <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-navy-300">
          <span>to {rules.target} · by {rules.winBy}</span>
          <span>{throws.length} throws</span>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          {[away, home].map((t, i) => (
            <div key={t.id} className={i === 1 ? "text-right" : ""}>
              <div className="truncate font-display text-sm font-semibold">{t.name}</div>
              <div className="font-display text-4xl font-bold tabular-nums">
                {t.id === home.id ? homeScore : awayScore}
              </div>
              <div className="font-mono text-[10px] text-navy-300">
                next fifa: {fifasBy(t.id) + 1} kick{fifasBy(t.id) === 0 ? "" : "s"}
              </div>
            </div>
          )).flatMap((el, i) =>
            i === 0 ? [el, <span key="dash" className="font-mono text-xs text-navy-400">vs</span>] : [el],
          )}
        </div>
        {over && (
          <div className="mt-3 rounded bg-win/20 px-3 py-2 text-center text-sm font-semibold text-white">
            Final — {homeScore > awayScore ? home.name : away.name} wins{" "}
            {Math.max(homeScore, awayScore)}–{Math.min(homeScore, awayScore)}
          </div>
        )}
      </div>

      <div className="rounded-b-xl border border-t-0 border-ash-200 bg-white p-4">
        {over ? (
          <button
            onClick={() =>
              startTransition(async () => {
                const res = await submitTrackedGame(gameId);
                if (!res.ok) return setError(res.message ?? "Couldn't submit.");
                router.push(`/games/${gameId}`);
              })
            }
            disabled={pending}
            className="w-full rounded-lg bg-pink-500 px-4 py-3.5 font-display font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Submitting…" : "Review & submit"}
          </button>
        ) : ts?.needsPick && !leadPick ? (
          <>
            <div className="eyebrow mb-2 text-ash-500">
              {(ts.teamId === home.id ? home : away).name}&apos;s turn — who&apos;s up?
            </div>
            <div className="grid grid-cols-2 gap-2">
              {rosterOf(ts.teamId).map((pid) => (
                <button
                  key={pid}
                  onClick={() => setLeadPick(pid)}
                  className="rounded-lg border-2 border-ash-200 px-3 py-4 font-display font-semibold text-navy-800 hover:border-pink-500"
                >
                  {playerById(pid)?.name}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="mb-3 rounded-lg border-2 border-pink-500 px-4 py-2.5">
              <span className="eyebrow block text-pink-500">
                {ts?.rethrow
                  ? "Rethrow — same guy"
                  : `${(ts?.teamId === home.id ? home : away).name} · throw ${ts?.slot} of 2`}
              </span>
              <span className="font-display text-lg font-bold text-navy-800">
                {currentThrower ? playerById(currentThrower)?.full : "—"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {OUTCOMES.map((o) => (
                <button
                  key={o.id}
                  onClick={() => onOutcome(o.id)}
                  disabled={pending || !currentThrower}
                  className={`flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-lg border-2 px-2 py-3 text-center font-display text-sm font-semibold leading-tight text-navy-800 transition active:scale-[0.98] disabled:opacity-40 ${
                    o.kind === "score"
                      ? "border-pink-500"
                      : o.kind === "fifa"
                        ? "border-navy-500"
                        : "border-ash-200"
                  }`}
                >
                  <span>{o.label}</span>
                  <span
                    className={`font-mono text-[10px] font-bold ${
                      o.kind === "score"
                        ? "text-pink-500"
                        : o.kind === "fifa"
                          ? "text-navy-500"
                          : "text-ash-400"
                    }`}
                  >
                    {o.sub}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="mt-3 flex gap-2">
          <button
            onClick={onUndo}
            disabled={throws.length === 0 || pending}
            className="flex-1 rounded-lg border border-ash-300 px-3 py-2.5 font-display text-sm font-semibold text-ash-700 disabled:opacity-40"
          >
            Undo last throw
          </button>
        </div>

        {error && <p className="mt-2 text-xs text-loss">{error}</p>}
      </div>

      {/* defender sheet */}
      {askDefender && ts && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy-950/60 p-0 sm:items-center sm:p-4">
          <div className="w-full max-w-sm rounded-t-xl bg-white p-5 sm:rounded-xl">
            <h3 className="font-display text-lg font-bold text-navy-800">
              {askDefender === "fifa" ? "Who caught it?" : "Who caught it?"}
            </h3>
            <p className="mb-4 text-sm text-ash-500">
              {askDefender === "fifa" ? (
                <>
                  Logged as a miss by {playerById(currentThrower!)?.name}. They needed{" "}
                  <span className="font-mono font-semibold text-pink-500">
                    {fifasBy(otherTeam(ts.teamId)) + 1} kick
                    {fifasBy(otherTeam(ts.teamId)) === 0 ? "" : "s"}
                  </span>{" "}
                  before the catch.
                </>
              ) : (
                "No points. Goes on their defensive record."
              )}
            </p>
            <div className="space-y-2">
              {defenders.map((d) => (
                <button
                  key={d!.id}
                  onClick={() => startTransition(() => void record(askDefender, d!.id))}
                  className="w-full rounded-lg bg-pink-500 px-4 py-3 font-display font-semibold text-white"
                >
                  {d!.name}
                </button>
              ))}
              <button
                onClick={() => setAskDefender(null)}
                className="w-full rounded-lg px-4 py-2 text-sm text-ash-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
