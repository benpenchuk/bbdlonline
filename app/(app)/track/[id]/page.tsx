import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requirePerson, displayName } from "@/lib/auth";
import { shortName } from "@/lib/queries";
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
  if (game.status === "final") redirect(`/games/${id}`);

  const [{ data: teams }, { data: season }, { data: members }, { data: people }, { data: throws }] =
    await Promise.all([
      supabase.from("teams").select("*").in("id", [game.home_team_id, game.away_team_id]),
      supabase.from("seasons").select("*").eq("id", game.season_id).maybeSingle(),
      supabase.from("team_members").select("*").in("team_id", [game.home_team_id, game.away_team_id]).is("left_at", null),
      supabase.from("people").select("*"),
      supabase.from("throws").select("*").eq("game_id", id).order("seq"),
    ]);

  const teamById = new Map((teams ?? []).map((t) => [t.id, t]));
  const peopleById = new Map((people ?? []).map((p) => [p.id, p]));
  const home = teamById.get(game.home_team_id);
  const away = teamById.get(game.away_team_id);

  if (!home || !away || !season) notFound();

  const players = (members ?? [])
    .map((m) => {
      const p = peopleById.get(m.person_id);
      if (!p) return null;
      return {
        id: p.id,
        name: shortName(p),
        full: displayName(p),
        teamId: m.team_id,
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  // Stats follow participation, not roster membership — record who is actually
  // playing before the first throw, so a sub never inherits someone else's game.
  const existing = new Set(
    ((await supabase.from("game_participants").select("person_id").eq("game_id", id)).data ?? [])
      .map((r) => r.person_id),
  );
  const missing = players.filter((p) => !existing.has(p.id));
  if (missing.length > 0) {
    await supabase.from("game_participants").insert(
      missing.map((p) => ({ game_id: id, person_id: p.id, team_id: p.teamId })),
    );
  }

  if (players.length < 4) {
    return (
      <p className="rounded-lg border border-loss/30 bg-loss/5 px-4 py-3 text-sm text-loss">
        Both teams need two players on the roster before this game can be tracked.
      </p>
    );
  }

  return (
    <Tracker
      gameId={id}
      home={{ id: home.id, name: home.name }}
      away={{ id: away.id, name: away.name }}
      players={players}
      rules={{
        target: game.kind === "playoff" ? season.semi_point_target : season.point_target,
        winBy: season.win_by,
        cap: season.point_cap,
      }}
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
