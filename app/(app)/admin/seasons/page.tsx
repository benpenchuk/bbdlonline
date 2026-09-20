import { createClient } from "@/lib/supabase/server";
import { requireCommissioner } from "@/lib/auth";
import {
  activateSeason,
  setSeasonStatus,
  setSeasonLock,
  updateSeasonRules,
} from "./actions";
import { Lock, Unlock } from "lucide-react";
import { NewSeasonForm } from "./new-season-form";

export const metadata = { title: "Seasons · Admin" };

const STATUS_STYLE: Record<string, string> = {
  active: "bg-win/10 text-win",
  upcoming: "bg-ash-100 text-ash-600",
  completed: "bg-navy-100 text-navy-700",
  archived: "bg-ash-100 text-ash-400",
};

function Field({
  label,
  name,
  value,
  hint,
  placeholder,
}: {
  label: string;
  name: string;
  value: number | null;
  hint?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-ash-500">
        {label}
      </span>
      <input
        name={name}
        type="number"
        defaultValue={value ?? ""}
        placeholder={placeholder}
        className="w-full rounded border border-ash-300 px-2 py-1.5 text-sm tabular-nums outline-none focus:border-pink-500"
      />
      {hint && <span className="mt-0.5 block text-[11px] text-ash-500">{hint}</span>}
    </label>
  );
}

export default async function AdminSeasonsPage() {
  await requireCommissioner();
  const supabase = await createClient();

  const { data: seasons } = await supabase
    .from("seasons")
    .select("*")
    .order("year", { ascending: false })
    .order("term");

  const list = seasons ?? [];
  const active = list.find((s) => s.status === "active");

  return (
    <div className="space-y-8">
      {!active && (
        <div className="rounded-lg border border-loss/30 bg-loss/5 px-4 py-3 text-sm text-loss">
          No season is active. Games, teams and standings all hang off the active
          season, so nothing works until you activate one.
        </div>
      )}

      <section className="max-w-md">
        <NewSeasonForm />
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-lg font-bold text-navy-800">All seasons</h2>

        {list.length === 0 && (
          <p className="rounded-lg border border-dashed border-ash-300 px-4 py-6 text-center text-sm text-ash-500">
            No seasons yet.
          </p>
        )}

        {list.map((s) => (
          <div key={s.id} className="rounded-lg border border-ash-200 bg-white">
            <div className="flex flex-wrap items-center gap-3 border-b border-ash-100 px-4 py-3">
              <h3 className="font-display text-base font-bold text-navy-800">
                {s.name}
              </h3>
              <span
                className={`rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${
                  STATUS_STYLE[s.status] ?? STATUS_STYLE.upcoming
                }`}
              >
                {s.status}
              </span>

              {s.locked && (
                <span className="inline-flex items-center gap-1 rounded bg-ash-100 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-ash-600">
                  <Lock size={10} /> locked
                </span>
              )}

              <div className="ml-auto flex items-center gap-2">
                {/* Unlocking is what makes a finished season correctable.
                    RLS refuses every write to a locked season, so this is
                    the only way in — and locking it again afterwards is
                    what stops a stray click rewriting 2025. */}
                <form action={setSeasonLock}>
                  <input type="hidden" name="season_id" value={s.id} />
                  <input type="hidden" name="locked" value={s.locked ? "false" : "true"} />
                  <button
                    className={
                      s.locked
                        ? "inline-flex items-center gap-1.5 rounded border border-pink-500 px-3 py-1.5 font-display text-xs font-semibold text-pink-600 hover:bg-pink-50"
                        : "inline-flex items-center gap-1.5 rounded border border-ash-300 px-3 py-1.5 font-display text-xs font-semibold text-ash-700 hover:border-navy-800"
                    }
                  >
                    {s.locked ? <Unlock size={12} /> : <Lock size={12} />}
                    {s.locked ? "Unlock to edit" : "Lock"}
                  </button>
                </form>
                {s.status !== "active" && (
                  <form action={activateSeason}>
                    <input type="hidden" name="season_id" value={s.id} />
                    <button className="rounded bg-pink-500 px-3 py-1.5 font-display text-xs font-semibold text-white hover:bg-pink-600">
                      Make active
                    </button>
                  </form>
                )}
                <form action={setSeasonStatus} className="flex items-center gap-1">
                  <input type="hidden" name="season_id" value={s.id} />
                  <select
                    name="status"
                    defaultValue={s.status}
                    className="rounded border border-ash-300 px-2 py-1 text-xs"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                  <button className="font-mono text-[10px] text-pink-500 hover:underline">
                    set
                  </button>
                </form>
              </div>
            </div>

            <form action={updateSeasonRules} className="px-4 py-4">
              <input type="hidden" name="season_id" value={s.id} />
              <p className="eyebrow mb-3 text-ash-500">Rules for this season</p>
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
                <Field label="Weeks" name="regular_weeks" value={s.regular_weeks} />
                <Field label="Play to" name="point_target" value={s.point_target} />
                <Field label="Win by" name="win_by" value={s.win_by} />
                <Field
                  label="Point cap"
                  name="point_cap"
                  value={s.point_cap}
                  placeholder="none"
                  hint="blank = win-by-2 runs on"
                />
                <Field label="Semis to" name="semi_point_target" value={s.semi_point_target} />
                <Field label="Final to" name="final_point_target" value={s.final_point_target} />
                <Field
                  label="Final series"
                  name="final_series_length"
                  value={s.final_series_length}
                  hint="3 = best of 3"
                />
              </div>
              <button className="mt-4 rounded-lg bg-navy-800 px-4 py-2 font-display text-sm font-semibold text-white hover:bg-navy-700">
                Save rules
              </button>
            </form>
          </div>
        ))}
      </section>
    </div>
  );
}
