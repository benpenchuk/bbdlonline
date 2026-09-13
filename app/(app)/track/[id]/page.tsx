import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requirePerson, displayName } from "@/lib/auth";
import { shortName } from "@/lib/queries";
import { PLAYERS_PER_SIDE } from "@/lib/lineup";
import { Tracker } from "./tracker";

export const metadata = { title: "Tracking · BBDL" };

export default async function TrackGamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requirePerson();
  const supabase = await createClient();

  const { data: game } = await supabase.from("games").select("*").eq("id", id).maybeSingle();
  if (!game) notFound();
  if (game.status === "final" || game.status === "canceled") redirect(`/games/${id}`);

  const teamIds = [game.home_team_id, game.away_team_id];

  const [
    { data: teams },
    { data: season },
    { data: members },
    { data: people },
    { data: throws },
    { data: participants },
    { data: match },
  ] = await Promise.all([
    supabase.from("teams").select("*").in("id", teamIds),
    supabase.from("seasons").select("*").eq("id", game.season_id).maybeSingle(),
    supabase.from("team_members").select("*").in("team_id", teamIds).is("left_at", null),
    supabase.from("people").select("*"),
    supabase.from("throws").select("*").eq("game_id", id).order("seq"),
    supabase.from("game_participants").select("*").eq("game_id", id),
    game.playoff_match_id
      ? supabase.from("playoff_matches").select("*").eq("id", game.playoff_match_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const teamById = new Map((teams ?? []).map((t) => [t.id, t]));
  const peopleById = new Map((people ?? []).map((p) => [p.id, p]));
  const home = teamById.get(game.home_team_id);
  const away = teamById.get(game.away_team_id);
  if (!home || !away || !season) notFound();

  // The FULL roster, subs included. Nothing is recorded from this directly —
  // it's only the pool the tracker picks each team's two players from.
  // Previously every roster member was written as a participant on page load,
  // which is how a benched sub ended up with a game played and a result.
  const roster = (members ?? [])
    .map((m) => {
      const p = peopleById.get(m.person_id);
      if (!p) return null;
      return {
        id: p.id,
        name: shortName(p),
        full: displayName(p),
        teamId: m.team_id,
        isSub: m.role === "sub",
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  const short = teamIds.filter(
    (t) => roster.filter((r) => r.teamId === t).length < PLAYERS_PER_SIDE,
  );
  if (short.length > 0) {
    return (
      <p className="rounded-lg border border-loss/30 bg-loss/5 px-4 py-3 text-sm text-loss">
        {short.map((t) => teamById.get(t)?.name).join(" and ")}{" "}
        {short.length > 1 ? "need" : "needs"} at least two players on the roster
        before this game can be tracked.
      </p>
    );
  }

  // A lineup already chosen (e.g. the tracker reloaded mid-game) is locked in.
  const chosen = participants ?? [];
  const lockedLineup = teamIds.every(
    (t) => chosen.filter((p) => p.team_id === t).length === PLAYERS_PER_SIDE,
  )
    ? chosen.map((p) => p.person_id)
    : null;

  // Playoff games play to the match's own target, which comes from the
  // season's semi/final settings. Using the regular target here was wrong for
  // every playoff round.
  const target = match?.point_target ?? season.point_target;

  return (
    <Tracker
      gameId={id}
      home={{ id: home.id, name: home.name }}
      away={{ id: away.id, name: away.name }}
      roster={roster}
      lockedLineup={lockedLineup}
      rules={{ target, winBy: season.win_by, cap: season.point_cap }}
      initialThrows={(throws ?? []).map((t) => ({
        id: t.id,
        thrower_id: t.thrower_id,
        thrower_team_id: t.thrower_team_id,
        outcome: t.outcome,
        points: t.points,
        scoring_team_id: t.scoring_team_id,
      }))}
    />
  );
}
