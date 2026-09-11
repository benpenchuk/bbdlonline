import { createClient } from "@/lib/supabase/server";
import { requireCommissioner, displayName } from "@/lib/auth";
import {
  setTeamApproval,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
} from "./actions";
import { NewTeamForm } from "./new-team-form";
import { CheckCircle2, Clock } from "lucide-react";

export const metadata = { title: "Teams · Admin" };

export default async function AdminTeamsPage() {
  await requireCommissioner();
  const supabase = await createClient();

  const { data: season } = await supabase
    .from("seasons")
    .select("*")
    .eq("status", "active")
    .maybeSingle();

  if (!season) {
    return (
      <p className="rounded-lg border border-loss/30 bg-loss/5 px-4 py-3 text-sm text-loss">
        No active season. Teams belong to a season, so activate one first.
      </p>
    );
  }

  const [{ data: teams }, { data: members }, { data: people }, { data: games }] =
    await Promise.all([
      supabase.from("teams").select("*").eq("season_id", season.id).order("name"),
      supabase.from("team_members").select("*"),
      supabase
        .from("people")
        .select("*")
        .in("league_status", ["player", "alumni"])
        .order("last_name"),
      supabase.from("games").select("id, home_team_id, away_team_id").eq("season_id", season.id),
    ]);

  const teamList = teams ?? [];
  const memberList = members ?? [];
  const peopleList = people ?? [];
  const gameList = games ?? [];

  const peopleById = new Map(peopleList.map((p) => [p.id, p]));
  const rosterFor = (teamId: string) =>
    memberList.filter((m) => m.team_id === teamId && !m.left_at);
  const hasPlayed = (teamId: string) =>
    gameList.some((g) => g.home_team_id === teamId || g.away_team_id === teamId);

  const rostered = new Set(memberList.map((m) => m.person_id));
  const unrostered = peopleList.filter(
    (p) => p.league_status === "player" && !rostered.has(p.id),
  );

  const pending = teamList.filter((t) => !t.approved);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-baseline gap-3">
        <h2 className="font-display text-lg font-bold text-navy-800">
          {season.name} teams
        </h2>
        <span className="font-mono text-xs text-ash-500">
          {teamList.length} teams · {rostered.size} players rostered
          {unrostered.length > 0 && ` · ${unrostered.length} without a team`}
        </span>
      </div>

      {pending.length > 0 && (
        <div className="rounded-lg border border-pink-500/30 bg-pink-500/5 px-4 py-3 text-sm text-navy-800">
          <strong>{pending.length}</strong> team{pending.length > 1 ? "s" : ""}{" "}
          registered by players and waiting on you. They don&apos;t appear in
          standings or get scheduled until approved.
        </div>
      )}

      <section className="max-w-md">
        <NewTeamForm people={peopleList} />
      </section>

      <section className="space-y-3">
        {teamList.length === 0 && (
          <p className="rounded-lg border border-dashed border-ash-300 px-4 py-6 text-center text-sm text-ash-500">
            No teams yet this season.
          </p>
        )}

        {teamList.map((t) => {
          const roster = rosterFor(t.id);
          const played = hasPlayed(t.id);

          return (
            <div key={t.id} className="rounded-lg border border-ash-200 bg-white">
              <div className="flex flex-wrap items-center gap-3 border-b border-ash-100 px-4 py-3">
                <h3 className="font-display text-base font-bold text-navy-800">
                  {t.name}
                </h3>
                {t.abbreviation && (
                  <span className="font-mono text-[10px] text-ash-400">
                    {t.abbreviation}
                  </span>
                )}
                {t.approved ? (
                  <span className="inline-flex items-center gap-1 text-xs text-win">
                    <CheckCircle2 size={13} /> approved
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-pink-500">
                    <Clock size={13} /> awaiting approval
                  </span>
                )}

                <div className="ml-auto flex items-center gap-2">
                  <form action={setTeamApproval}>
                    <input type="hidden" name="team_id" value={t.id} />
                    <input
                      type="hidden"
                      name="approved"
                      value={t.approved ? "false" : "true"}
                    />
                    <button className="rounded border border-ash-300 px-2.5 py-1 font-display text-xs font-semibold text-ash-700 hover:border-pink-500">
                      {t.approved ? "Un-approve" : "Approve"}
                    </button>
                  </form>
                  {!played && (
                    <form action={deleteTeam}>
                      <input type="hidden" name="team_id" value={t.id} />
                      <button className="font-mono text-[10px] text-loss hover:underline">
                        delete
                      </button>
                    </form>
                  )}
                </div>
              </div>

              <div className="px-4 py-3">
                <ul className="mb-3 space-y-1">
                  {roster.map((m) => {
                    const person = peopleById.get(m.person_id);
                    return (
                      <li key={m.id} className="flex items-center gap-2 text-sm">
                        <span className="text-ash-900">
                          {person ? displayName(person) : "Unknown"}
                        </span>
                        {m.role === "sub" && (
                          <span className="rounded bg-ash-100 px-1.5 py-0.5 font-mono text-[10px] text-ash-500">
                            sub
                          </span>
                        )}
                        <form action={removeTeamMember} className="ml-auto">
                          <input type="hidden" name="member_id" value={m.id} />
                          <button className="font-mono text-[10px] text-ash-400 hover:text-loss hover:underline">
                            remove
                          </button>
                        </form>
                      </li>
                    );
                  })}
                  {roster.length === 0 && (
                    <li className="text-xs text-loss">
                      Empty roster — this team can&apos;t play.
                    </li>
                  )}
                </ul>

                <form action={addTeamMember} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="team_id" value={t.id} />
                  <select
                    name="person_id"
                    defaultValue=""
                    className="rounded border border-ash-300 px-2 py-1 text-xs"
                  >
                    <option value="">Add someone…</option>
                    {peopleList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.first_name} {p.last_name}
                      </option>
                    ))}
                  </select>
                  <select
                    name="role"
                    defaultValue="sub"
                    className="rounded border border-ash-300 px-2 py-1 text-xs"
                  >
                    <option value="sub">as sub</option>
                    <option value="starter">as starter</option>
                  </select>
                  <button className="font-mono text-[10px] text-pink-500 hover:underline">
                    add
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </section>

      {unrostered.length > 0 && (
        <section>
          <h3 className="mb-2 font-display text-sm font-bold text-navy-800">
            Players without a team
          </h3>
          <p className="text-sm text-ash-600">
            {unrostered.map((p) => `${p.first_name} ${p.last_name}`).join(", ")}
          </p>
        </section>
      )}
    </div>
  );
}
