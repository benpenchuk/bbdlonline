"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCommissioner } from "@/lib/auth";
import { generateSchedule, autoPairLeftovers, maxRoundsFor } from "@/lib/schedule";

export type ScheduleResult = { ok: boolean; message?: string };

async function activeSeason() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("seasons")
    .select("*")
    .eq("status", "active")
    .maybeSingle();
  return data;
}

/**
 * Build weeks 1..(regular_weeks - 1). The last week is rivalry week and is
 * filled by challenges instead, so it is deliberately left empty here.
 *
 * Refuses if any regular-season game already has a result, because
 * regenerating would delete played games and rewrite the standings.
 */
export async function generateRegularSeason(
  _prev: ScheduleResult,
  _formData: FormData,
): Promise<ScheduleResult> {
  await requireCommissioner();
  const supabase = await createClient();

  const season = await activeSeason();
  if (!season) return { ok: false, message: "No active season." };

  const { data: teams } = await supabase
    .from("teams")
    .select("id")
    .eq("season_id", season.id)
    .eq("approved", true);

  const teamIds = (teams ?? []).map((t) => t.id);
  if (teamIds.length < 2) {
    return { ok: false, message: "Approve at least two teams first." };
  }

  const { data: existing } = await supabase
    .from("games")
    .select("id, status")
    .eq("season_id", season.id)
    .eq("kind", "regular");

  const played = (existing ?? []).filter((g) => g.status !== "scheduled");
  if (played.length > 0) {
    return {
      ok: false,
      message: `${played.length} game${played.length > 1 ? "s have" : " has"} already been played. Clear or finish the season before regenerating.`,
    };
  }

  // safe: nothing has been played
  await supabase
    .from("games")
    .delete()
    .eq("season_id", season.id)
    .eq("kind", "regular");

  const regularWeeks = Math.max(1, season.regular_weeks - 1);
  const possible = maxRoundsFor(teamIds.length);
  const { pairings } = generateSchedule(teamIds, regularWeeks);

  const { error } = await supabase.from("games").insert(
    pairings.map((p) => ({
      season_id: season.id,
      kind: "regular" as const,
      week: p.week,
      home_team_id: p.homeTeamId,
      away_team_id: p.awayTeamId,
      status: "scheduled" as const,
    })),
  );

  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/schedule");
  revalidatePath("/games");

  const weeksMade = Math.min(regularWeeks, possible);
  const short =
    weeksMade < regularWeeks
      ? ` Only ${weeksMade} weeks are possible with ${teamIds.length} teams without repeating a matchup.`
      : "";

  return {
    ok: true,
    message: `Scheduled ${pairings.length} games across ${weeksMade} weeks.${short}`,
  };
}

/** Turns accepted challenges into games, then randomly pairs whoever is left. */
export async function buildRivalryWeek(
  _prev: ScheduleResult,
  _formData: FormData,
): Promise<ScheduleResult> {
  await requireCommissioner();
  const supabase = await createClient();

  const season = await activeSeason();
  if (!season) return { ok: false, message: "No active season." };

  const week = season.regular_weeks;

  const { data: existing } = await supabase
    .from("games")
    .select("id, status")
    .eq("season_id", season.id)
    .eq("kind", "rivalry");

  if ((existing ?? []).some((g) => g.status !== "scheduled")) {
    return { ok: false, message: "Rivalry games have already been played." };
  }
  await supabase.from("games").delete().eq("season_id", season.id).eq("kind", "rivalry");

  const [{ data: teams }, { data: challenges }] = await Promise.all([
    supabase.from("teams").select("id").eq("season_id", season.id).eq("approved", true),
    supabase
      .from("rivalry_challenges")
      .select("*")
      .eq("season_id", season.id)
      .eq("status", "accepted"),
  ]);

  const teamIds = (teams ?? []).map((t) => t.id);
  const accepted = challenges ?? [];

  const spoken = new Set<string>();
  const rows: {
    season_id: string;
    kind: "rivalry";
    week: number;
    home_team_id: string;
    away_team_id: string;
    status: "scheduled";
  }[] = [];

  for (const c of accepted) {
    if (spoken.has(c.challenger_team_id) || spoken.has(c.challenged_team_id)) continue;
    spoken.add(c.challenger_team_id);
    spoken.add(c.challenged_team_id);
    rows.push({
      season_id: season.id,
      kind: "rivalry",
      week,
      home_team_id: c.challenger_team_id,
      away_team_id: c.challenged_team_id,
      status: "scheduled",
    });
  }

  const leftovers = teamIds.filter((id) => !spoken.has(id));
  const { pairs, unpaired } = autoPairLeftovers(leftovers);

  for (const [a, b] of pairs) {
    rows.push({
      season_id: season.id,
      kind: "rivalry",
      week,
      home_team_id: a,
      away_team_id: b,
      status: "scheduled",
    });
  }

  if (rows.length === 0) {
    return { ok: false, message: "Nothing to schedule — no teams." };
  }

  const { error } = await supabase.from("games").insert(rows);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/schedule");
  revalidatePath("/games");

  const byeNote = unpaired.length
    ? ` One team has a bye — there's an odd number.`
    : "";

  return {
    ok: true,
    message: `Week ${week} set: ${rows.length} games, ${accepted.length} from challenges, ${pairs.length} auto-paired.${byeNote}`,
  };
}

export async function setGameSchedule(formData: FormData): Promise<void> {
  await requireCommissioner();
  const id = String(formData.get("game_id") ?? "");
  const when = String(formData.get("scheduled_at") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim() || null;
  if (!id) return;

  const supabase = await createClient();
  await supabase
    .from("games")
    .update({
      scheduled_at: when ? new Date(when).toISOString() : null,
      location,
    })
    .eq("id", id);

  revalidatePath("/admin/schedule");
}

export async function deleteGame(formData: FormData): Promise<void> {
  await requireCommissioner();
  const id = String(formData.get("game_id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("games").delete().eq("id", id).eq("status", "scheduled");
  revalidatePath("/admin/schedule");
}

/**
 * Correct a game's score from the admin schedule.
 *
 * The imported seasons need this: 16 games came over with no score
 * recorded, and Season 7's standings tab disagrees with its own schedule
 * for ten teams. Nobody is left to confirm a game from 2025, so the
 * commissioner sets the result and the winner directly rather than going
 * through the two-team confirmation flow.
 *
 * Blank scores mean "this was never played" and send the game back to
 * 'canceled', which keeps the fixture on record while leaving it out of
 * the standings.
 */
export async function setGameScore(formData: FormData): Promise<void> {
  await requireCommissioner();
  const id = String(formData.get("game_id") ?? "");
  if (!id) return;

  const rawHome = String(formData.get("home_score") ?? "").trim();
  const rawAway = String(formData.get("away_score") ?? "").trim();

  const supabase = await createClient();
  const { data: game } = await supabase
    .from("games")
    .select("id, home_team_id, away_team_id, is_tracked")
    .eq("id", id)
    .maybeSingle();
  if (!game) return;

  // A tracked game's score is the sum of its throws — resync_game_score()
  // would overwrite anything set here on the next throw, so refuse rather
  // than appear to work.
  if (game.is_tracked) return;

  if (rawHome === "" && rawAway === "") {
    await supabase
      .from("games")
      .update({ home_score: 0, away_score: 0, status: "canceled", winner_team_id: null })
      .eq("id", id);
    revalidatePath("/admin/schedule");
    revalidatePath("/standings");
    return;
  }

  const home = Number(rawHome);
  const away = Number(rawAway);
  if (!Number.isInteger(home) || !Number.isInteger(away) || home < 0 || away < 0) return;
  if (home === away) return; // dye games cannot end level

  await supabase
    .from("games")
    .update({
      home_score: home,
      away_score: away,
      status: "final",
      winner_team_id: home > away ? game.home_team_id : game.away_team_id,
    })
    .eq("id", id);

  revalidatePath("/admin/schedule");
  revalidatePath("/standings");
  revalidatePath("/records");
}
