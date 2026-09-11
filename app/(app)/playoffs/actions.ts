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

  revalidatePath("/playoffs");
  return {
    ok: true,
    message: `${field.length} teams seeded across ${rounds} rounds.`,
  };
}

/** Record a winner and carry them into the next round. */
export async function advanceTeam(formData: FormData): Promise<void> {
  await requireCommissioner();
  const matchId = String(formData.get("match_id") ?? "");
  const winnerId = String(formData.get("winner_id") ?? "");
  if (!matchId || !winnerId) return;

  const supabase = await createClient();

  const { data: match } = await supabase
    .from("playoff_matches")
    .select("*")
    .eq("id", matchId)
    .maybeSingle();
  if (!match) return;

  await supabase
    .from("playoff_matches")
    .update({ winner_id: winnerId, status: "completed" })
    .eq("id", matchId);

  // the winner of match N in round R feeds slot N/2 of round R+1
  const { data: next } = await supabase
    .from("playoff_matches")
    .select("*")
    .eq("playoff_id", match.playoff_id)
    .eq("round_number", match.round_number + 1)
    .eq("match_number", Math.floor(match.match_number / 2))
    .maybeSingle();

  if (next) {
    // even-numbered matches feed the top slot of the next match, odd the bottom
    const patch =
      match.match_number % 2 === 0
        ? { team1_id: winnerId }
        : { team2_id: winnerId };
    await supabase.from("playoff_matches").update(patch).eq("id", next.id);
  } else {
    // no next round: that was the final
    await supabase
      .from("playoffs")
      .update({ status: "completed" })
      .eq("id", match.playoff_id);
  }

  revalidatePath("/playoffs");
}

export async function deletePlayoff(formData: FormData): Promise<void> {
  await requireCommissioner();
  const id = String(formData.get("playoff_id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("playoffs").delete().eq("id", id);
  revalidatePath("/playoffs");
}
