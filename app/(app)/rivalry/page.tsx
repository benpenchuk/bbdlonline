import { requirePerson, displayName } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getActiveSeason, getTeams, getRosters, shortName } from "@/lib/queries";
import { EmptyState } from "@/components/empty-state";
import { issueChallenge, answerChallenge } from "./actions";
import { Swords } from "lucide-react";

export const metadata = { title: "Rivalry week · BBDL" };

export default async function RivalryPage() {
  const me = await requirePerson();
  const season = await getActiveSeason();
  if (!season) return <EmptyState title="No active season" />;

  const supabase = await createClient();
  const [teams, rosters, { data: challenges }] = await Promise.all([
    getTeams(season.id),
    getRosters(season.id),
    supabase.from("rivalry_challenges").select("*").eq("season_id", season.id),
  ]);

  const teamById = new Map(teams.map((t) => [t.id, t]));
  const all = challenges ?? [];

  // my team this season
  let myTeamId: string | null = null;
  for (const [teamId, roster] of rosters) {
    if (roster.some((p) => p.id === me.id)) myTeamId = teamId;
  }

  if (!myTeamId) {
    return (
      <EmptyState
        title="You're not on a team this season"
        body="Rivalry week is for teams in the league."
      />
    );
  }

  const incoming = all.filter(
    (c) => c.challenged_team_id === myTeamId && c.status === "pending",
  );
  const outgoing = all.filter((c) => c.challenger_team_id === myTeamId);
  const spokenFor = new Set(
    all
      .filter((c) => c.status === "accepted")
      .flatMap((c) => [c.challenger_team_id, c.challenged_team_id]),
  );

  const alreadyAsked = new Set(outgoing.map((c) => c.challenged_team_id));
  const available = teams.filter(
    (t) => t.id !== myTeamId && !spokenFor.has(t.id) && !alreadyAsked.has(t.id),
  );

  const rosterLine = (id: string) =>
    (rosters.get(id) ?? []).map(shortName).join(" · ");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight text-navy-800">
          <Swords size={22} className="text-pink-500" /> Rivalry week
        </h1>
        <p className="text-sm text-ash-500">
          Week {season.regular_weeks} — call someone out. Anyone nobody challenges
          gets paired at random when the commissioner closes it.
        </p>
      </header>

      {incoming.length > 0 && (
        <section>
          <h2 className="mb-2 font-display text-base font-bold text-navy-800">
            You&apos;ve been called out
          </h2>
          <div className="space-y-2">
            {incoming.map((c) => (
              <div
                key={c.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-pink-500/40 bg-pink-500/5 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-display font-bold text-navy-800">
                    {teamById.get(c.challenger_team_id)?.name}
                  </div>
                  <div className="text-xs text-ash-500">
                    {rosterLine(c.challenger_team_id)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <form action={answerChallenge}>
                    <input type="hidden" name="challenge_id" value={c.id} />
                    <input type="hidden" name="answer" value="accepted" />
                    <button className="rounded-lg bg-pink-500 px-4 py-2 font-display text-sm font-semibold text-white hover:bg-pink-600">
                      Accept
                    </button>
                  </form>
                  <form action={answerChallenge}>
                    <input type="hidden" name="challenge_id" value={c.id} />
                    <input type="hidden" name="answer" value="declined" />
                    <button className="rounded-lg border border-ash-300 px-4 py-2 font-display text-sm font-semibold text-ash-600">
                      Decline
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {outgoing.length > 0 && (
        <section>
          <h2 className="mb-2 font-display text-base font-bold text-navy-800">
            Your challenges
          </h2>
          <div className="overflow-hidden rounded-lg border border-ash-200 bg-white">
            {outgoing.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 border-b border-ash-100 px-4 py-2.5 last:border-0"
              >
                <span className="min-w-0 flex-1 truncate text-sm text-navy-800">
                  {teamById.get(c.challenged_team_id)?.name}
                </span>
                <span
                  className={`font-mono text-[10px] uppercase tracking-wide ${
                    c.status === "accepted"
                      ? "text-win"
                      : c.status === "declined"
                        ? "text-loss"
                        : "text-ash-400"
                  }`}
                >
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-2 font-display text-base font-bold text-navy-800">
          Call someone out
        </h2>
        {available.length === 0 ? (
          <EmptyState title="Nobody left to challenge" />
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {available.map((t) => (
              <form
                key={t.id}
                action={issueChallenge}
                className="flex items-center gap-3 rounded-lg border border-ash-200 bg-white px-4 py-3"
              >
                <input type="hidden" name="challenged_team_id" value={t.id} />
                <input type="hidden" name="challenger_team_id" value={myTeamId} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-navy-800">{t.name}</div>
                  <div className="truncate text-xs text-ash-500">{rosterLine(t.id)}</div>
                </div>
                <button className="shrink-0 rounded-lg border border-pink-500 px-3 py-1.5 font-display text-xs font-semibold text-pink-500 hover:bg-pink-500 hover:text-white">
                  Challenge
                </button>
              </form>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
