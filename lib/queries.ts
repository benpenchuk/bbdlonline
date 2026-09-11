import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Person, Season, Team } from "@/lib/supabase/types";

/**
 * Shared reads. Everything is per-request cached so a page, its layout and its
 * components don't each hit the database for the same rows.
 *
 * Note what is NOT here: any notion of "load everything and filter in the
 * browser". v1 pulled all twelve tables into memory on every page load. These
 * queries are scoped, which is what makes 30-odd teams a non-event.
 */

export const getActiveSeason = cache(async (): Promise<Season | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("seasons")
    .select("*")
    .eq("status", "active")
    .maybeSingle();
  return data;
});

export const getSeasonBySlug = cache(async (slug: string): Promise<Season | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("seasons")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return data;
});

export const getSeasons = cache(async (): Promise<Season[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("seasons")
    .select("*")
    .order("year", { ascending: false })
    .order("term");
  return data ?? [];
});

export const getTeams = cache(async (seasonId: string): Promise<Team[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("teams")
    .select("*")
    .eq("season_id", seasonId)
    .eq("approved", true)
    .order("name");
  return data ?? [];
});

export const getStandings = cache(async (seasonId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("standings")
    .select("*")
    .eq("season_id", seasonId)
    .order("rank");
  return data ?? [];
});

export const getPeople = cache(async (): Promise<Person[]> => {
  const supabase = await createClient();
  const { data } = await supabase.from("people").select("*").order("last_name");
  return data ?? [];
});

/** team_id -> the people on it, for a season. One query, not one per team. */
export const getRosters = cache(async (seasonId: string) => {
  const supabase = await createClient();

  const { data: teams } = await supabase
    .from("teams")
    .select("id")
    .eq("season_id", seasonId);

  const teamIds = (teams ?? []).map((t) => t.id);
  if (teamIds.length === 0) return new Map<string, Person[]>();

  const [{ data: members }, { data: people }] = await Promise.all([
    supabase.from("team_members").select("*").in("team_id", teamIds).is("left_at", null),
    supabase.from("people").select("*"),
  ]);

  const peopleById = new Map((people ?? []).map((p) => [p.id, p]));
  const byTeam = new Map<string, Person[]>();

  for (const m of members ?? []) {
    const person = peopleById.get(m.person_id);
    if (!person) continue;
    const list = byTeam.get(m.team_id) ?? [];
    list.push(person);
    byTeam.set(m.team_id, list);
  }

  return byTeam;
});

export const getSeasonGames = cache(async (seasonId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("games")
    .select("*")
    .eq("season_id", seasonId)
    .order("week")
    .order("scheduled_at", { nullsFirst: false });
  return data ?? [];
});

export const getPlayerSeasonStats = cache(async (seasonId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("player_season_stats")
    .select("*")
    .eq("season_id", seasonId);
  return data ?? [];
});

/** A game's throws, in order, with names resolved for the play-by-play. */
export const getGameThrows = cache(async (gameId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("throws")
    .select("*")
    .eq("game_id", gameId)
    .order("seq");
  return data ?? [];
});

export function fullName(p: { first_name: string; last_name: string }) {
  return `${p.first_name} ${p.last_name}`;
}

export function shortName(p: { first_name: string; last_name: string }) {
  return `${p.first_name} ${p.last_name.charAt(0)}.`;
}

/** "W3" / "L2" from a team's most recent results, newest first. */
export function streakFrom(results: boolean[]): string {
  if (results.length === 0) return "—";
  const first = results[0];
  let n = 0;
  for (const r of results) {
    if (r !== first) break;
    n++;
  }
  return `${first ? "W" : "L"}${n}`;
}
