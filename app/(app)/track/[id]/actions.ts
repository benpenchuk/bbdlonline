"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePerson, requireCommissioner } from "@/lib/auth";
import { validateLineup } from "@/lib/lineup";
import type { ThrowOutcome } from "@/lib/supabase/types";

export type ThrowResult = { ok: boolean; id?: string; message?: string };

/**
 * Record who is actually playing. Exactly two per team, from that team's
 * roster — so a sub who sits out earns nothing, and a sub who plays earns
 * everything. Used by both tracked and score-only games; before this, one of
 * them credited the whole roster and the other credited nobody.
 *
 * The lineup can change freely until the first throw, then it locks.
 */
async function writeLineup(gameId: string, lineup: string[]): Promise<string | null> {
  const supabase = await createClient();

  const [{ data: game }, { count: thrown }] = await Promise.all([
    supabase.from("games").select("home_team_id, away_team_id").eq("id", gameId).maybeSingle(),
    supabase.from("throws").select("*", { count: "exact", head: true }).eq("game_id", gameId),
  ]);

  if (!game) return "That game doesn't exist.";
  if ((thrown ?? 0) > 0) return "The lineup locks once the first throw is logged.";

  const teamIds = [game.home_team_id, game.away_team_id];
  const { data: members } = await supabase
    .from("team_members")
    .select("person_id, team_id")
    .in("team_id", teamIds)
    .is("left_at", null);

  const roster = (members ?? []).map((m) => ({ id: m.person_id, teamId: m.team_id }));
  const problem = validateLineup(lineup, roster, teamIds);
  if (problem) return problem;

  const teamOf = new Map(roster.map((r) => [r.id, r.teamId]));

  await supabase.from("game_participants").delete().eq("game_id", gameId);
  const { error } = await supabase.from("game_participants").insert(
    lineup.map((personId) => ({
      game_id: gameId,
      person_id: personId,
      team_id: teamOf.get(personId)!,
    })),
  );

  return error ? error.message : null;
}

export async function setLineup(gameId: string, lineup: string[]): Promise<ThrowResult> {
  await requirePerson();
  const problem = await writeLineup(gameId, lineup);
  if (problem) return { ok: false, message: problem };
  return { ok: true };
}

/**
 * Record one throw. The database fills in the sequence number, which team the
 * points belong to (a fifa scores for the DEFENCE), and the fifa ladder
 * position — see prepare_throw() in migration 0003. The tracker is never
 * trusted with any of that.
 */
export async function logThrow(input: {
  gameId: string;
  throwerId: string;
  throwerTeamId: string;
  outcome: ThrowOutcome;
  defenderId?: string | null;
}): Promise<ThrowResult> {
  await requirePerson();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("throws")
    .insert({
      game_id: input.gameId,
      thrower_id: input.throwerId,
      thrower_team_id: input.throwerTeamId,
      outcome: input.outcome,
      defender_id: input.defenderId ?? null,
    })
    .select("id")
    .single();

  if (error) return { ok: false, message: error.message };
  return { ok: true, id: data.id };
}

export async function undoThrow(gameId: string): Promise<ThrowResult> {
  await requirePerson();
  const supabase = await createClient();

  const { data: last } = await supabase
    .from("throws")
    .select("id")
    .eq("game_id", gameId)
    .order("seq", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!last) return { ok: true };

  const { error } = await supabase.from("throws").delete().eq("id", last.id);
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

/** Mark the game played and waiting on both teams. The score itself is already
 *  correct — resync_game_score() keeps it in step with the throw log. */
export async function submitTrackedGame(gameId: string): Promise<ThrowResult> {
  const me = await requirePerson();
  const supabase = await createClient();

  const { error } = await supabase
    .from("games")
    .update({ status: "awaiting_confirmation", tracked_by: me.id })
    .eq("id", gameId);

  if (error) return { ok: false, message: error.message };

  revalidatePath(`/games/${gameId}`);
  revalidatePath("/games");
  return { ok: true };
}

/**
 * Enter a final score with no throw log, for a game nobody tracked. It counts
 * toward the standings but is excluded from stat leaderboards — is_tracked
 * stays false, and the stats views filter on it.
 */
export async function submitScoreOnly(
  _prev: ThrowResult,
  formData: FormData,
): Promise<ThrowResult> {
  await requirePerson();

  const gameId = String(formData.get("game_id") ?? "");
  const home = Number(formData.get("home_score"));
  const away = Number(formData.get("away_score"));

  if (!gameId) return { ok: false, message: "Missing game." };
  if (!Number.isInteger(home) || !Number.isInteger(away) || home < 0 || away < 0) {
    return { ok: false, message: "Scores must be whole numbers." };
  }
  if (home === away) {
    return { ok: false, message: "Dye games can't end level." };
  }

  // Without a lineup a score-only game used to credit nobody: the players
  // got no game played and no result. Record who played first.
  const lineup = formData.getAll("lineup").map(String).filter(Boolean);
  const problem = await writeLineup(gameId, lineup);
  if (problem) return { ok: false, message: problem };

  const supabase = await createClient();
  const { error } = await supabase
    .from("games")
    .update({
      home_score: home,
      away_score: away,
      status: "awaiting_confirmation",
      is_tracked: false,
    })
    .eq("id", gameId);

  if (error) return { ok: false, message: error.message };

  revalidatePath(`/games/${gameId}`);
  revalidatePath("/games");
  return { ok: true, message: "Submitted. It needs one approval from each team." };
}

/**
 * One rep from each team signs off. The second confirmation flips the game to
 * final via the maybe_finalize_game() trigger — no application code decides it.
 */
export async function confirmGame(formData: FormData): Promise<void> {
  const me = await requirePerson();
  const gameId = String(formData.get("game_id") ?? "");
  const teamId = String(formData.get("team_id") ?? "");
  if (!gameId || !teamId) return;

  const supabase = await createClient();
  await supabase.from("game_confirmations").insert({
    game_id: gameId,
    team_id: teamId,
    confirmed_by: me.id,
  });

  revalidatePath(`/games/${gameId}`);
  revalidatePath("/standings");
  revalidatePath("/games");
}

/** Commissioner override, for a disputed or abandoned game. */
export async function forceFinal(formData: FormData): Promise<void> {
  await requireCommissioner();
  const gameId = String(formData.get("game_id") ?? "");
  if (!gameId) return;

  const supabase = await createClient();
  const { data: game } = await supabase
    .from("games")
    .select("*")
    .eq("id", gameId)
    .maybeSingle();
  if (!game) return;

  await supabase
    .from("games")
    .update({
      status: "final",
      winner_team_id:
        game.home_score > game.away_score
          ? game.home_team_id
          : game.away_score > game.home_score
            ? game.away_team_id
            : null,
    })
    .eq("id", gameId);

  revalidatePath(`/games/${gameId}`);
  revalidatePath("/standings");
}
