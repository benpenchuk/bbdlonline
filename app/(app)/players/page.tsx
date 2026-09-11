import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveSeason, getPlayerSeasonStats, getRosters, getTeams } from "@/lib/queries";
import { displayName } from "@/lib/auth";
import { EmptyState } from "@/components/empty-state";

export const metadata = { title: "Players · BBDL" };

export default async function PlayersPage() {
  const season = await getActiveSeason();
  const supabase = await createClient();

  const { data: people } = await supabase
    .from("people")
    .select("*")
    .in("league_status", ["player", "alumni"])
    .order("last_name");

  if (!people || people.length === 0) {
    return <EmptyState title="No players yet" body="The commissioner adds people from the admin panel." />;
  }

  const [stats, rosters, teams] = season
    ? await Promise.all([
        getPlayerSeasonStats(season.id),
        getRosters(season.id),
        getTeams(season.id),
      ])
    : [[], new Map<string, never[]>(), []];

  const statsByPerson = new Map(stats.map((s) => [s.person_id, s]));
  const teamById = new Map(teams.map((t) => [t.id, t]));

  // person -> their team this season
  const teamOf = new Map<string, string>();
  for (const [teamId, roster] of rosters) {
    for (const p of roster) teamOf.set(p.id, teamId);
  }

  const active = people.filter((p) => p.league_status === "player");
  const alumni = people.filter((p) => p.league_status === "alumni");

  const Card = ({ person }: { person: (typeof people)[number] }) => {
    const s = statsByPerson.get(person.id);
    const teamId = teamOf.get(person.id);
    const team = teamId ? teamById.get(teamId) : null;

    return (
      <Link
        href={`/players/${person.slug}`}
        className="flex items-center gap-3 rounded-lg border border-ash-200 bg-white p-3 transition hover:border-pink-500"
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-navy-800 font-display text-sm font-bold text-white">
          {person.first_name.charAt(0)}
          {person.last_name.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold text-navy-800">
            {displayName(person)}
          </div>
          <div className="truncate text-xs text-ash-500">
            {team?.name ?? (person.league_status === "alumni" ? "Alumni" : "No team")}
          </div>
        </div>
        {s && (
          <div className="shrink-0 text-right">
            <div className="font-mono text-sm tabular-nums text-navy-800">
              {s.wins}–{s.losses}
            </div>
            <div className="font-mono text-[10px] text-ash-400">
              {s.accuracy_pct === null ? "—" : `${s.accuracy_pct}%`}
            </div>
          </div>
        )}
      </Link>
    );
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight text-navy-800">
          Players
        </h1>
        <p className="text-sm text-ash-500">
          {season ? season.name : "All time"} · {active.length} active
        </p>
      </header>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {active.map((p) => (
          <Card key={p.id} person={p} />
        ))}
      </div>

      {alumni.length > 0 && (
        <section>
          <h2 className="mb-2 font-display text-base font-bold text-navy-800">Alumni</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {alumni.map((p) => (
              <Card key={p.id} person={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
