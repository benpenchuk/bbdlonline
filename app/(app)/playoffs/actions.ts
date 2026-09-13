"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCommissioner } from "@/lib/auth";
import { buildBracket } from "@/lib/bracket";

export type PlayoffResult = { ok: boolean; message?: string };

/**
 * Seed the bracket from the standings: top half of the league, ordered by the
 * standings view (wins, then point differential — the chosen tiebreak).
 *
 * Series length and point target come from the season, so a commissioner who
 * wants best-of-three semis changes the season, not the code.
 */
export async function createPlayoff(
  _prev: PlayoffResult,
  _formData: FormData,
): Promise<PlayoffResult> {
  await requireCommissioner();
  const supabase = await createClient();

  const { data: season } = await supabase
    .from("seasons")
    .select("*")
    .eq("status", "active")
    .maybeSingle();
  if (!season) return { ok: false, message: "No active season." };

  const { data: existing } = await supabase
    .from("playoffs")
    .select("id, status")
    .eq("season_id", season.id);

  if ((existing ?? []).length > 0) {
    return {
      ok: false,
      message: "This season already has a playoff. Delete it first to rebuild.",
    };
  }

  const { data: standings } = await supabase
    .from("standings")
    .select("*")
    .eq("season_id", season.id)
    .order("rank");

  const table = standings ?? [];
  if (table.length < 2) return { ok: false, message: "Not enough teams." };

  const unplayed = table.filter((t) => (t.games_played ?? 0) === 0).length;
  if (unplayed > 0) {
    return {
      ok: false,
      message: `${unplayed} team${unplayed > 1 ? "s haven't" : " hasn't"} played yet — seeding would be arbitrary.`,
    };
  }

  const fieldSize = Math.max(2, Math.ceil(table.length / 2));
  const field = table.slice(0, fieldSize);
  const { matches, rounds } = buildBracket(field.length);

  const { data: playoff, error: playoffError } = await supabase
    .from("playoffs")
    .insert({
      season_id: season.id,
      name: `${season.name} Playoffs`,
      bracket_type: "single_elimination",
      status: "in_progress",
    })
    .select("id")
    .single();

  if (playoffError) return { ok: false, message: playoffError.message };

  // seed -> team id (seeds are 1-based)
  const teamForSeed = (seed: number | null) =>
    seed === null ? null : (field[seed - 1]?.team_id ?? null);

  const rows = matches.map((m) => {
    const isFinal = m.round === rounds;
    const isSemi = m.round === rounds - 1;
    return {
      playoff_id: playoff.id,
      round_number: m.round,
      match_number: m.match,
      team1_id: teamForSeed(m.team1Seed),
      team2_id: teamForSeed(m.team2Seed),
      point_target: isFinal
        ? season.final_point_target
        : isSemi
          ? season.semi_point_target
          : season.point_target,
      series_length: isFinal ? season.final_series_length : 1,
      status: "pending",
    };
  });

  const { error } = await supabase.from("playoff_matches").insert(rows);
  if (error) {
    await supabase.from("playoffs").delete().eq("id", playoff.id);
    return { ok: false, message: error.message };
  }

  // Byes advance on their own, and every match with two teams gets a real
  // game to track. Done in the database (start_playoff) so the rules live in
  // one place with the rest of the playoff engine.
  const { error: startError } = await supabase.rpc("start_playoff", {
    p_playoff: playoff.id,
  });
  if (startError) {
    await supabase.from("playoffs").delete().eq("id", playoff.id);
    return { ok: false, message: startError.message };
  }

  revalidatePath("/playoffs");
  return {
    ok: true,
    message: `${field.length} teams seeded across ${rounds} rounds.`,
  };
}

/**
 * Commissioner override: decide a match without a game — a forfeit, or a
 * series settled off the site. Normally this never runs; a playoff game going
 * final advances the winner on its own (resolve_playoff_game in 0010).
 *
 * The old version of this did the advancing in application code and could
 * not handle a bye, which froze any bracket that wasn't a power of two.
 */
export async function advanceTeam(formData: FormData): Promise<void> {
  await requireCommissioner();
  const matchId = String(formData.get("match_id") ?? "");
  const winnerId = String(formData.get("winner_id") ?? "");
  if (!matchId || !winnerId) return;

  const supabase = await createClient();
  await supabase.rpc("override_playoff_winner", {
    p_match: matchId,
    p_winner: winnerId,
  });

  revalidatePath("/playoffs");
}

export async function deletePlayoff(formData: FormData): Promise<void> {
  await requireCommissioner();
  const id = String(formData.get("playoff_id") ?? "");
  if (!id) return;

  const supabase = await createClient();

  // games.playoff_match_id is ON DELETE SET NULL, so deleting the bracket
  // alone would strand its games as orphaned "playoff" games on the schedule.
  const { data: matches } = await supabase
    .from("playoff_matches")
    .select("id")
    .eq("playoff_id", id);
  const matchIds = (matches ?? []).map((m) => m.id);

  if (matchIds.length > 0) {
    // Refuse once anything has been played. Games cascade to their throws, so
    // deleting a bracket mid-playoffs would silently erase tracked playoff
    // stats — the same reason a team that has played can't be deleted.
    const { count: played } = await supabase
      .from("games")
      .select("*", { count: "exact", head: true })
      .in("playoff_match_id", matchIds)
      .not("status", "in", "(scheduled,canceled)");

    if ((played ?? 0) > 0) return;

    await supabase.from("games").delete().in("playoff_match_id", matchIds);
  }

  await supabase.from("playoffs").delete().eq("id", id);
  revalidatePath("/playoffs");
  revalidatePath("/games");
}
