"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCommissioner } from "@/lib/auth";
import type { TablesUpdate } from "@/lib/supabase/types";

export type SeasonResult = { ok: boolean; message?: string };

function num(form: FormData, key: string, fallback: number): number {
  const raw = String(form.get(key) ?? "").trim();
  if (raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

export async function createSeason(
  _prev: SeasonResult,
  formData: FormData,
): Promise<SeasonResult> {
  await requireCommissioner();

  const term = String(formData.get("term") ?? "fall");
  const year = num(formData, "year", new Date().getFullYear());
  const weeks = num(formData, "regular_weeks", 6);
  const number = num(formData, "number", 0);

  if (term !== "fall" && term !== "spring") {
    return { ok: false, message: "Term must be fall or spring." };
  }
  if (year < 2000 || year > 2100) {
    return { ok: false, message: "That year doesn't look right." };
  }
  if (number < 1) {
    return { ok: false, message: "A season needs its number — BBDL Season 9, and so on." };
  }

  // The number is the name. Year and term still record when it happened.
  const name = `BBDL Season ${number}`;
  const slug = `season-${number}`;

  const supabase = await createClient();
  const { error } = await supabase.from("seasons").insert({
    name,
    slug,
    number,
    year,
    term,
    regular_weeks: weeks,
    status: "upcoming",
  });

  if (error) {
    // Two different unique constraints can fire here, and telling them
    // apart is the difference between a useful message and a shrug.
    const dupeNumber = /seasons_number_unique|seasons_slug_key/i.test(error.message);
    const dupeTerm = /seasons_year_term_key/i.test(error.message);
    return {
      ok: false,
      message: dupeNumber
        ? `${name} already exists.`
        : dupeTerm
          ? `There is already a season for ${term} ${year}.`
          : error.message,
    };
  }

  revalidatePath("/admin/seasons");
  return { ok: true, message: `Created ${name}.` };
}

/**
 * Activating a season deactivates whichever one was active. The database has a
 * partial unique index allowing only one active season, so doing this in two
 * steps is required rather than merely tidy.
 */
export async function activateSeason(formData: FormData): Promise<void> {
  await requireCommissioner();
  const id = String(formData.get("season_id") ?? "");
  if (!id) return;

  const supabase = await createClient();

  await supabase
    .from("seasons")
    .update({ status: "completed" })
    .eq("status", "active")
    .neq("id", id);

  await supabase.from("seasons").update({ status: "active" }).eq("id", id);

  revalidatePath("/admin/seasons");
  revalidatePath("/admin");
}

export async function setSeasonStatus(formData: FormData): Promise<void> {
  await requireCommissioner();
  const id = String(formData.get("season_id") ?? "");
  const status = String(formData.get("status") ?? "");
  const allowed = ["upcoming", "active", "completed", "archived"];
  if (!id || !allowed.includes(status)) return;

  const supabase = await createClient();
  if (status === "active") {
    await supabase
      .from("seasons")
      .update({ status: "completed" })
      .eq("status", "active")
      .neq("id", id);
  }
  await supabase
    .from("seasons")
    .update({ status: status as "upcoming" | "active" | "completed" | "archived" })
    .eq("id", id);

  revalidatePath("/admin/seasons");
}

/** The scoring rules live on the season so a future commissioner can change
 *  how BBDL is played without anyone editing code. */
export async function updateSeasonRules(formData: FormData): Promise<void> {
  await requireCommissioner();
  const id = String(formData.get("season_id") ?? "");
  if (!id) return;

  const rawCap = String(formData.get("point_cap") ?? "").trim();

  const patch: TablesUpdate<"seasons"> = {
    point_target: num(formData, "point_target", 11),
    win_by: num(formData, "win_by", 2),
    point_cap: rawCap === "" ? null : num(formData, "point_cap", 0) || null,
    semi_point_target: num(formData, "semi_point_target", 15),
    final_point_target: num(formData, "final_point_target", 15),
    final_series_length: num(formData, "final_series_length", 3),
    regular_weeks: num(formData, "regular_weeks", 6),
  };

  const supabase = await createClient();
  await supabase.from("seasons").update(patch).eq("id", id);

  revalidatePath("/admin/seasons");
}
