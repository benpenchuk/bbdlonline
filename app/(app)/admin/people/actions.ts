"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCommissioner } from "@/lib/auth";
import type { SiteRole, LeagueStatus, TablesUpdate } from "@/lib/supabase/types";

export type ActionResult = { ok: boolean; message?: string; code?: string };

const ROLES: SiteRole[] = ["member", "commissioner", "superadmin"];
const STATUSES: LeagueStatus[] = ["player", "alumni", "spectator"];

function slugify(first: string, last: string) {
  const base = `${first} ${last}`
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return base || `member-${randomBytes(4).toString("hex")}`;
}

/** Long and random on purpose: invite_code_valid() is reachable by anon, so a
 *  short code would be brute-forceable from outside. */
function newInviteCode() {
  return `bbdl-${randomBytes(12).toString("hex")}`;
}

/**
 * Add someone who has no account. This is the path for historical players and
 * for guys the commissioner wants on a roster before they ever sign in — the
 * whole reason `people` doesn't require an auth user.
 */
export async function addPerson(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireCommissioner();

  const first = String(formData.get("first_name") ?? "").trim();
  const last = String(formData.get("last_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase() || null;
  const status = String(formData.get("league_status") ?? "player") as LeagueStatus;

  if (!first || !last) {
    return { ok: false, message: "First and last name are both required." };
  }
  if (!STATUSES.includes(status)) {
    return { ok: false, message: "Unknown league status." };
  }

  const supabase = await createClient();

  // slugs are unique; add a suffix rather than failing on a second Jack Smith
  let slug = slugify(first, last);
  const { data: taken } = await supabase
    .from("people")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (taken) slug = `${slug}-${randomBytes(2).toString("hex")}`;

  const { error } = await supabase.from("people").insert({
    first_name: first,
    last_name: last,
    email,
    slug,
    league_status: status,
    site_role: "member",
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/people");
  return { ok: true, message: `Added ${first} ${last}.` };
}

/**
 * Create an invite. Two shapes, both of which the league needs:
 *   - pre-linked to an existing person, so a returning player keeps his
 *     history instead of starting a duplicate row
 *   - unattached with a use limit, for the code shared in the group chat
 */
export async function createInvite(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireCommissioner();

  const personId = String(formData.get("person_id") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim().toLowerCase() || null;
  const role = String(formData.get("grants_role") ?? "member") as SiteRole;
  const status = String(formData.get("grants_status") ?? "player") as LeagueStatus;
  const rawUses = String(formData.get("max_uses") ?? "1").trim();
  const maxUses = rawUses === "" || rawUses === "0" ? null : Number(rawUses);

  if (!ROLES.includes(role) || !STATUSES.includes(status)) {
    return { ok: false, message: "Unknown role or status." };
  }
  if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1)) {
    return { ok: false, message: "Uses must be a whole number, or blank for unlimited." };
  }

  const supabase = await createClient();
  const { data: me } = await supabase.rpc("current_person_id");
  const code = newInviteCode();

  const { error } = await supabase.from("invites").insert({
    code,
    email,
    person_id: personId,
    grants_role: role,
    grants_status: status,
    max_uses: maxUses,
    created_by: me ?? null,
  });

  // Only a superadmin may hand out superadmin; the database enforces the same
  // rule on the people row, so this just gives a readable failure.
  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/people");
  return { ok: true, message: "Invite created.", code };
}

export async function revokeInvite(formData: FormData): Promise<void> {
  await requireCommissioner();
  const id = String(formData.get("invite_id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase
    .from("invites")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/admin/people");
}

/** Change someone's role or league status. The database independently enforces
 *  that only a superadmin can grant superadmin. */
export async function updatePerson(formData: FormData): Promise<void> {
  await requireCommissioner();

  const id = String(formData.get("person_id") ?? "");
  const field = String(formData.get("field") ?? "");
  const value = String(formData.get("value") ?? "");
  if (!id) return;

  const patch: TablesUpdate<"people"> = {};
  if (field === "site_role" && ROLES.includes(value as SiteRole)) {
    patch.site_role = value as SiteRole;
  } else if (field === "league_status" && STATUSES.includes(value as LeagueStatus)) {
    patch.league_status = value as LeagueStatus;
  } else if (field === "name") {
    // The imported seasons arrive with names typed off a spreadsheet, and
    // a few men have no surname on record at all — so a blank last name is
    // allowed and meaningful here. A blank FIRST name is not: it is what
    // the site falls back to when there is no surname.
    const first = String(formData.get("first_name") ?? "").trim();
    const last = String(formData.get("last_name") ?? "").trim();
    const nickname = String(formData.get("nickname") ?? "").trim() || null;
    if (!first) return;
    patch.first_name = first;
    patch.last_name = last;
    patch.nickname = nickname;
  } else {
    return; // unknown field — ignore rather than write something arbitrary
  }

  const supabase = await createClient();
  await supabase.from("people").update(patch).eq("id", id);

  revalidatePath("/admin/people");
}
