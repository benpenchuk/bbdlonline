import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requirePerson, isCommissioner } from "@/lib/auth";
import { getRosters, shortName } from "@/lib/queries";
import { roundName } from "@/lib/bracket";
import { EmptyState } from "@/components/empty-state";
import { CreatePlayoffButton } from "./create-playoff-button";
import { advanceTeam, deletePlayoff } from "./actions";
import { pickSeason, SeasonPicker } from "../admin/season-picker";
import { Trophy } from "lucide-react";

export const metadata = { title: "Playoffs · BBDL" };

export default async function PlayoffsPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>;
}) {
  const me = await requirePerson();
  const admin = isCommissioner(me);

  const supabase = await createClient();
  // Imported seasons carry finished brackets, and Season 6's final was
  // never recorded — so this page has to reach any season, not just the
  // active one, or the champion can never be set.
  const { season: picked } = await searchParams.then((sp) => sp);
  const { season, seasons } = await pickSeason(supabase, picked);
  if (!season) return <EmptyState title="No seasons yet" />;

  const { data: playoff } = await supabase
    .from("playoffs")
    .select("*")
    .eq("season_id", season.id)
    .maybeSingle();

  if (!playoff) {
    return (
      <div className="space-y-5">
        <header>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight text-navy-800">
            <Trophy size={22} className="text-pink-500" /> Playoffs
          </h1>
          <p className="text-sm text-ash-500">{season.name}</p>
        </header>
        <SeasonPicker seasons={seasons} current={season} basePath="/playoffs" />
        {admin ? (
          <CreatePlayoffButton />
        ) : (
          <EmptyState
            title="Not seeded yet"
            body="The commissioner builds the bracket once the regular season finishes."
          />
        )}
      </div>
    );
  }

  const [{ data: matches }, { data: teams }, rosters] = await Promise.all([
    supabase
      .from("playoff_matches")
      .select("*")
      .eq("playoff_id", playoff.id)
      .order("round_number")
      .order("match_number"),
    supabase.from("teams").select("*").eq("season_id", season.id),
    getRosters(season.id),
  ]);

  const teamById = new Map((teams ?? []).map((t) => [t.id, t]));
  const bracket = matches ?? [];

  // the real games behind each match, oldest first, so a series reads in order
  const { data: games } = bracket.length
    ? await supabase
        .from("games")
        .select("*")
        .in("playoff_match_id", bracket.map((m) => m.id))
        .order("created_at")
    : { data: [] };
  const gamesFor = (matchId: string) =>
    (games ?? []).filter((g) => g.playoff_match_id === matchId && g.status !== "canceled");

  // once any playoff game is played, the bracket can't be deleted
  const anyPlayed = (games ?? []).some(
    (g) => g.status !== "scheduled" && g.status !== "canceled",
  );
  const rounds = [...new Set(bracket.map((m) => m.round_number))].sort((a, b) => a - b);
  const totalRounds = rounds.length;

  const champion = bracket.find(
    (m) => m.round_number === totalRounds && m.winner_id,
  )?.winner_id;

  const Side = ({
    teamId,
    matchId,
    winnerId,
    canAdvance,
    seriesWins,
  }: {
    teamId: string | null;
    matchId: string;
    winnerId: string | null;
    canAdvance: boolean;
    seriesWins?: number;
  }) => {
    if (!teamId) {
      return (
        <div className="px-3 py-2 text-sm text-ash-300">
          {winnerId ? "—" : "TBD"}
        </div>
      );
    }
    const team = teamById.get(teamId);
    const won = winnerId === teamId;
    const lost = winnerId !== null && !won;

    return (
      <div
        className={`flex items-center gap-2 px-3 py-2 ${lost ? "opacity-40" : ""}`}
      >
        <Link
          href={`/teams/${teamId}`}
          className={`min-w-0 flex-1 truncate text-sm ${
            won ? "font-bold text-navy-800" : "text-ash-800"
          }`}
        >
          {team?.name ?? "—"}
          <span className="ml-1.5 text-[10px] font-normal text-ash-400">
            {(rosters.get(teamId) ?? []).map(shortName).join(" · ")}
          </span>
        </Link>
        {seriesWins !== undefined && (
          <span className="shrink-0 font-mono text-xs tabular-nums text-ash-500">
            {seriesWins}
          </span>
        )}
        {canAdvance && !winnerId && (
          <form action={advanceTeam}>
            <input type="hidden" name="match_id" value={matchId} />
            <input type="hidden" name="winner_id" value={teamId} />
            <button
              title="Decide this match without a game — for a forfeit"
              className="shrink-0 font-mono text-[9px] text-ash-300 hover:text-pink-500 hover:underline"
            >
              override
            </button>
          </form>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight text-navy-800">
            <Trophy size={22} className="text-pink-500" /> {playoff.name}
          </h1>
          <p className="text-sm text-ash-500">
            Top half of the league · single elimination
          </p>
        </div>
        {admin && !anyPlayed && (
          <form action={deletePlayoff} className="ml-auto">
            <input type="hidden" name="playoff_id" value={playoff.id} />
            <button className="font-mono text-[10px] text-ash-400 hover:text-loss hover:underline">
              delete bracket
            </button>
          </form>
        )}
      </header>
      <SeasonPicker seasons={seasons} current={season} basePath="/playoffs" />

      {champion && (
        <div className="rounded-lg bg-navy-800 px-5 py-4 text-center text-white">
          <div className="eyebrow mb-1 text-pink-300">Champions</div>
          <div className="font-display text-2xl font-bold">
            {teamById.get(champion)?.name}
          </div>
          <div className="mt-1 text-sm text-navy-200">
            {(rosters.get(champion) ?? []).map((p) => `${p.first_name} ${p.last_name}`).join(" · ")}
          </div>
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-2">
        {rounds.map((r) => (
          <section key={r} className="w-64 shrink-0">
            <h2 className="mb-2 font-display text-sm font-bold text-navy-800">
              {roundName(r, totalRounds)}
            </h2>
            <div className="space-y-2">
              {bracket
                .filter((m) => m.round_number === r)
                .map((m) => {
                  const played = gamesFor(m.id);
                  const finals = played.filter((g) => g.status === "final");
                  const winsFor = (teamId: string | null) =>
                    teamId ? finals.filter((g) => g.winner_team_id === teamId).length : 0;
                  const live = played.find((g) => g.status !== "final");
                  const isSeries = m.series_length > 1;
                  const isBye = m.status === "bye";

                  return (
                    <div
                      key={m.id}
                      className="divide-y divide-ash-100 overflow-hidden rounded-lg border border-ash-200 bg-white"
                    >
                      <Side
                        teamId={m.team1_id}
                        matchId={m.id}
                        winnerId={m.winner_id}
                        canAdvance={admin && !!m.team1_id && !!m.team2_id}
                        seriesWins={isSeries && finals.length ? winsFor(m.team1_id) : undefined}
                      />
                      <Side
                        teamId={m.team2_id}
                        matchId={m.id}
                        winnerId={m.winner_id}
                        canAdvance={admin && !!m.team1_id && !!m.team2_id}
                        seriesWins={isSeries && finals.length ? winsFor(m.team2_id) : undefined}
                      />
                      <div className="flex items-center gap-2 bg-ash-50 px-3 py-1.5 font-mono text-[10px] text-ash-400">
                        {isBye ? (
                          <span className="text-win">bye — advanced</span>
                        ) : (
                          <span>
                            to {m.point_target}
                            {isSeries && ` · best of ${m.series_length}`}
                          </span>
                        )}
                        {live && (
                          <Link
                            href={`/track/${live.id}`}
                            className="ml-auto rounded bg-pink-500 px-2 py-0.5 font-display text-[10px] font-semibold text-white hover:bg-pink-600"
                          >
                            {isSeries ? `Track game ${played.length}` : "Track"}
                          </Link>
                        )}
                        {!live && finals.length > 0 && (
                          <Link
                            href={`/games/${finals[finals.length - 1].id}`}
                            className="ml-auto text-navy-500 hover:text-pink-500 hover:underline"
                          >
                            {finals.length > 1 ? `${finals.length} games` : "view game"}
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
