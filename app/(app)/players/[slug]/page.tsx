import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getCurrentPerson, displayName } from "@/lib/auth";
import { getActiveSeason } from "@/lib/queries";
import { ProfileEditor } from "./profile-editor";

export const metadata = { title: "Player · BBDL" };

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-lg border border-ash-200 bg-white px-3 py-2.5">
      <div className="eyebrow text-ash-500">{label}</div>
      <div className="font-display text-xl font-bold tabular-nums text-navy-800">{value}</div>
      {sub && <div className="font-mono text-[10px] text-ash-400">{sub}</div>}
    </div>
  );
}

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: person } = await supabase
    .from("people")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!person) notFound();

  const [me, season] = await Promise.all([getCurrentPerson(), getActiveSeason()]);
  const isMe = me?.id === person.id;

  const [{ data: career }, { data: seasonStats }, { data: gameLog }, { data: seasons }] =
    await Promise.all([
      supabase.from("player_career_stats").select("*").eq("person_id", person.id).maybeSingle(),
      supabase.from("player_season_stats").select("*").eq("person_id", person.id),
      supabase
        .from("player_game_stats")
        .select("*")
        .eq("person_id", person.id)
        .eq("status", "final"),
      supabase.from("seasons").select("*"),
    ]);

  const seasonById = new Map((seasons ?? []).map((s) => [s.id, s]));

  const gameIds = (gameLog ?? []).map((g) => g.game_id!).filter(Boolean);
  const { data: games } = gameIds.length
    ? await supabase.from("games").select("*").in("id", gameIds)
    : { data: [] };

  const { data: teams } = await supabase.from("teams").select("*");
  const teamById = new Map((teams ?? []).map((t) => [t.id, t]));
  const gameById = new Map((games ?? []).map((g) => [g.id, g]));

  const log = (gameLog ?? [])
    .map((s) => ({ stat: s, game: gameById.get(s.game_id!) }))
    .filter((x) => x.game)
    .sort((a, b) =>
      (b.game!.scheduled_at ?? "").localeCompare(a.game!.scheduled_at ?? ""),
    );

  const thisSeason = season
    ? (seasonStats ?? []).find((s) => s.season_id === season.id)
    : null;

  return (
    <div className="space-y-6">
      <Link href="/players" className="text-sm text-ash-500 hover:text-pink-500">
        ← All players
      </Link>

      <header className="flex flex-wrap items-center gap-4">
        <div className="flex size-16 items-center justify-center rounded-full bg-navy-800 font-display text-xl font-bold text-white">
          {person.first_name.charAt(0)}
          {person.last_name.charAt(0)}
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-navy-800">
            {displayName(person)}
          </h1>
          <p className="text-sm text-ash-500">
            {person.league_status === "alumni" ? "Alumni" : "Player"}
            {person.hometown_city && ` · ${person.hometown_city}`}
            {person.dominant_hand && ` · ${person.dominant_hand}-handed`}
          </p>
        </div>
        {isMe && <div className="ml-auto"><ProfileEditor person={person} /></div>}
      </header>

      {thisSeason && season && (
        <section>
          <h2 className="eyebrow mb-2 text-ash-500">{season.name}</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Record" value={`${thisSeason.wins}–${thisSeason.losses}`} sub={`${thisSeason.win_pct ?? 0}%`} />
            <Stat label="Points" value={thisSeason.total_points ?? 0} sub={`${thisSeason.points_per_game ?? 0}/game`} />
            <Stat
              label="Accuracy"
              value={thisSeason.accuracy_pct === null ? "—" : `${thisSeason.accuracy_pct}%`}
              sub={`${thisSeason.table_hits}/${thisSeason.throws} throws`}
            />
            <Stat label="Sinks" value={thisSeason.sinks ?? 0} sub={`${thisSeason.fifas ?? 0} fifas`} />
          </div>
          {(thisSeason.games_tracked ?? 0) < (thisSeason.games_played ?? 0) && (
            <p className="mt-2 text-xs text-ash-500">
              {thisSeason.games_played! - thisSeason.games_tracked!} of{" "}
              {thisSeason.games_played} games weren&apos;t tracked, so throw stats
              cover only the tracked ones.
            </p>
          )}
        </section>
      )}

      {career && (career.games_played ?? 0) > 0 && (
        <section>
          <h2 className="eyebrow mb-2 text-ash-500">Career</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Seasons" value={career.seasons ?? 0} />
            <Stat label="Record" value={`${career.wins}–${career.losses}`} sub={`${career.win_pct ?? 0}%`} />
            <Stat label="Points" value={career.total_points ?? 0} />
            <Stat
              label="Accuracy"
              value={career.accuracy_pct === null ? "—" : `${career.accuracy_pct}%`}
            />
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-2 font-display text-base font-bold text-navy-800">Game log</h2>
        {log.length === 0 ? (
          <p className="rounded-lg border border-dashed border-ash-300 px-4 py-6 text-center text-sm text-ash-500">
            No completed games yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-ash-200 bg-white">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-ash-200 bg-ash-50">
                  {["Date", "Opponent", "Result", "Pts", "Acc", "Def"].map((h) => (
                    <th
                      key={h}
                      className={`px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-ash-500 ${
                        h === "Date" || h === "Opponent" ? "text-left" : "text-right"
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {log.map(({ stat, game }) => {
                  const oppId =
                    game!.home_team_id === stat.team_id
                      ? game!.away_team_id
                      : game!.home_team_id;
                  const mine =
                    game!.home_team_id === stat.team_id ? game!.home_score : game!.away_score;
                  const theirs =
                    game!.home_team_id === stat.team_id ? game!.away_score : game!.home_score;

                  return (
                    <tr key={stat.game_id} className="border-b border-ash-100 last:border-0">
                      <td className="px-3 py-2 font-mono text-xs text-ash-500">
                        {game!.scheduled_at
                          ? format(new Date(game!.scheduled_at), "MMM d")
                          : "—"}
                      </td>
                      <td className="px-3 py-2">
                        <Link
                          href={`/games/${game!.id}`}
                          className="text-navy-800 hover:text-pink-500"
                        >
                          {teamById.get(oppId)?.name ?? "—"}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums">
                        <span className={stat.won ? "font-bold text-win" : "text-loss"}>
                          {stat.won ? "W" : "L"}
                        </span>
                        <span className="ml-1.5 text-ash-500">
                          {mine}–{theirs}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-ash-700">
                        {stat.total_points}
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-ash-500">
                        {stat.accuracy_pct === null ? "—" : `${stat.accuracy_pct}%`}
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-ash-500">
                        {stat.defensive_points}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {(seasonStats ?? []).length > 1 && (
        <section>
          <h2 className="mb-2 font-display text-base font-bold text-navy-800">
            Season by season
          </h2>
          <div className="overflow-x-auto rounded-lg border border-ash-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ash-200 bg-ash-50">
                  {["Season", "GP", "W", "L", "Pts", "Acc"].map((h) => (
                    <th
                      key={h}
                      className={`px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-ash-500 ${
                        h === "Season" ? "text-left" : "text-right"
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(seasonStats ?? []).map((s) => (
                  <tr key={s.season_id} className="border-b border-ash-100 last:border-0">
                    <td className="px-3 py-2 text-navy-800">
                      {seasonById.get(s.season_id!)?.name ?? "—"}
                    </td>
                    {[s.games_played, s.wins, s.losses, s.total_points,
                      s.accuracy_pct === null ? "—" : `${s.accuracy_pct}%`].map((v, i) => (
                      <td key={i} className="px-3 py-2 text-right font-mono tabular-nums text-ash-600">
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
