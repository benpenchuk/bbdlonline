import { createClient } from "@/lib/supabase/server";
import { requireCommissioner, displayName } from "@/lib/auth";
import { updatePerson, revokeInvite } from "./actions";
import { AddPersonForm } from "./add-person-form";
import { InviteForm } from "./invite-form";
import { CheckCircle2, CircleDashed } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { getSiteUrl } from "@/lib/site-url";
import { inviteLink } from "@/lib/invite-link";

export const metadata = { title: "People · Admin" };

const ROLE_LABEL: Record<string, string> = {
  member: "Member",
  commissioner: "Commissioner",
  superadmin: "Superadmin",
};

export default async function AdminPeoplePage() {
  const me = await requireCommissioner();
  const supabase = await createClient();
  const siteUrl = await getSiteUrl();

  const [{ data: people }, { data: invites }] = await Promise.all([
    supabase
      .from("people")
      .select("*")
      .order("league_status")
      .order("last_name"),
    supabase
      .from("invites")
      .select("*")
      .is("revoked_at", null)
      .order("created_at", { ascending: false }),
  ]);

  const roster = people ?? [];
  const openInvites = (invites ?? []).filter(
    (i) => i.max_uses === null || i.use_count < i.max_uses,
  );
  const peopleById = new Map(roster.map((p) => [p.id, p]));

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-display text-lg font-bold text-navy-800">
            Everyone in BBDL
          </h2>
          <span className="font-mono text-xs text-ash-500">
            {roster.length} people · {roster.filter((p) => p.auth_user_id).length} with
            accounts
          </span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-ash-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ash-200 bg-ash-50">
                <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-ash-500">
                  Name
                </th>
                <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-ash-500">
                  Account
                </th>
                <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-ash-500">
                  Status
                </th>
                <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-ash-500">
                  Role
                </th>
              </tr>
            </thead>
            <tbody>
              {roster.map((p) => {
                const isMe = p.id === me.id;
                return (
                  <tr key={p.id} className="border-b border-ash-100 last:border-0">
                    <td className="px-3 py-2">
                      <details>
                        <summary className="cursor-pointer list-none">
                          <span className="font-semibold text-ash-900 underline decoration-ash-300 decoration-dotted underline-offset-4">
                            {displayName(p)}
                          </span>
                          {!p.last_name?.trim() && (
                            <span className="ml-2 font-mono text-[10px] text-ash-400">
                              no surname
                            </span>
                          )}
                          {isMe && (
                            <span className="ml-2 font-mono text-[10px] text-pink-500">
                              you
                            </span>
                          )}
                        </summary>
                        <form
                          action={updatePerson}
                          className="mt-2 flex flex-wrap items-end gap-1.5"
                        >
                          <input type="hidden" name="person_id" value={p.id} />
                          <input type="hidden" name="field" value="name" />
                          <input
                            name="first_name"
                            defaultValue={p.first_name}
                            required
                            aria-label="First name"
                            className="w-24 rounded border border-ash-300 px-2 py-1 text-xs"
                          />
                          <input
                            name="last_name"
                            defaultValue={p.last_name ?? ""}
                            placeholder="unknown"
                            aria-label="Last name"
                            className="w-28 rounded border border-ash-300 px-2 py-1 text-xs"
                          />
                          <input
                            name="nickname"
                            defaultValue={p.nickname ?? ""}
                            placeholder="nickname"
                            aria-label="Nickname"
                            className="w-24 rounded border border-ash-300 px-2 py-1 text-xs"
                          />
                          <button className="rounded bg-navy-800 px-2 py-1 font-display text-xs font-semibold text-white hover:bg-navy-700">
                            Save
                          </button>
                        </form>
                      </details>
                      {p.email && (
                        <div className="font-mono text-[11px] text-ash-500">
                          {p.email}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {p.auth_user_id ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-win">
                          <CheckCircle2 size={13} /> signed up
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-ash-400">
                          <CircleDashed size={13} /> no account
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <form action={updatePerson}>
                        <input type="hidden" name="person_id" value={p.id} />
                        <input type="hidden" name="field" value="league_status" />
                        <select
                          name="value"
                          defaultValue={p.league_status}
                          className="rounded border border-ash-300 bg-white px-2 py-1 text-xs"
                        >
                          <option value="player">Player</option>
                          <option value="alumni">Alumni</option>
                          <option value="spectator">Spectator</option>
                        </select>
                        <button
                          type="submit"
                          className="ml-1.5 font-mono text-[10px] text-pink-500 hover:underline"
                        >
                          save
                        </button>
                      </form>
                    </td>
                    <td className="px-3 py-2">
                      {isMe ? (
                        <span className="text-xs text-ash-500">
                          {ROLE_LABEL[p.site_role]}
                          <span className="ml-1.5 font-mono text-[10px] text-ash-400">
                            can&apos;t demote yourself
                          </span>
                        </span>
                      ) : (
                        <form action={updatePerson}>
                          <input type="hidden" name="person_id" value={p.id} />
                          <input type="hidden" name="field" value="site_role" />
                          <select
                            name="value"
                            defaultValue={p.site_role}
                            className="rounded border border-ash-300 bg-white px-2 py-1 text-xs"
                          >
                            <option value="member">Member</option>
                            <option value="commissioner">Commissioner</option>
                            {me.site_role === "superadmin" && (
                              <option value="superadmin">Superadmin</option>
                            )}
                          </select>
                          <button
                            type="submit"
                            className="ml-1.5 font-mono text-[10px] text-pink-500 hover:underline"
                          >
                            save
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-ash-500">
          Promoting someone to Commissioner is how the title gets handed on. Do it
          before you graduate — nobody else can.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <AddPersonForm />
        <InviteForm people={roster} siteUrl={siteUrl} />
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-bold text-navy-800">
          Open invites
        </h2>
        {openInvites.length === 0 ? (
          <p className="rounded-lg border border-dashed border-ash-300 px-4 py-6 text-center text-sm text-ash-500">
            No invites outstanding. Create one above to let someone in.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-ash-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ash-200 bg-ash-50">
                  <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-ash-500">
                    Invite link
                  </th>
                  <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-ash-500">
                    For
                  </th>
                  <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-ash-500">
                    Grants
                  </th>
                  <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-ash-500">
                    Uses
                  </th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {openInvites.map((inv) => {
                  const target = inv.person_id
                    ? peopleById.get(inv.person_id)
                    : null;
                  return (
                    <tr key={inv.id} className="border-b border-ash-100 last:border-0">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <code className="max-w-[22rem] truncate font-mono text-[11px] text-ash-600">
                            {inviteLink(siteUrl, inv.code)}
                          </code>
                          <CopyButton
                            value={inviteLink(siteUrl, inv.code)}
                            label="Copy"
                            className="inline-flex shrink-0 items-center gap-1 rounded border border-ash-300 px-2 py-1 font-mono text-[10px] text-ash-600 hover:border-pink-500 hover:text-pink-500"
                          />
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs text-ash-600">
                        {target ? (
                          <>
                            <span className="font-semibold text-ash-900">
                              {displayName(target)}
                            </span>
                            <span className="ml-1.5 font-mono text-[10px] text-win">
                              keeps history
                            </span>
                          </>
                        ) : (
                          (inv.email ?? "anyone with the code")
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-ash-600">
                        {ROLE_LABEL[inv.grants_role]} · {inv.grants_status}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs tabular-nums text-ash-600">
                        {inv.use_count}/{inv.max_uses ?? "∞"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <form action={revokeInvite}>
                          <input type="hidden" name="invite_id" value={inv.id} />
                          <button
                            type="submit"
                            className="font-mono text-[10px] text-loss hover:underline"
                          >
                            revoke
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
