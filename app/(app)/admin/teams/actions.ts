"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCommissioner } from "@/lib/auth";

export type TeamResult = { ok: boolean; message?: string };

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return base || `team-${randomBytes(3).toString("hex")}`;
}

/** Guys register their own pairs; this is the commissioner doing it for them,
 *  or fixing one up. Either way both players land on the roster at once. */
export async function createTeam(
  _prev: TeamResult,
  formData: FormData,
): Promise<TeamResult> {
  const me = await requireCommissioner();

  const name = String(formData.get("name") ?? "").trim();
  const abbr = String(formData.get("abbreviation") ?? "").trim().toUpperCase() || null;
  const p1 = String(formData.get("player_1") ?? "");
  const p2 = String(formData.get("player_2") ?? "");

  if (!name) return { ok: false, message: "Give the team a name." };
  if (!p1 || !p2) return { ok: false, message: "Pick both players." };
  if (p1 === p2) return { ok: false, message: "A team needs two different people." };
  if (abbr && (abbr.length < 2 || abbr.length > 4)) {
    return { ok: false, message: "Abbreviation must be 2–4 characters." };
  }

  const supabase = await createClient();

  const { data: season } = await supabase
    .from("seasons")
    .select("id")
    .eq("status", "active")
    .maybeSingle();

  if (!season) {
    return { ok: false, message: "Activate a season before adding teams." };
  }

  let slug = slugify(name);
  const { data: taken } = await supabase
    .from("teams")
    .select("id")
    .eq("season_id", season.id)
    .eq("slug", slug)
    .maybeSingle();
  if (taken) slug = `${slug}-${randomBytes(2).toString("hex")}`;

  const { data: team, error } = await supabase
    .from("teams")
    .insert({
      season_id: season.id,
      name,
      slug,
      abbreviation: abbr,
      approved: true, // the commissioner made it, so it's approved by definition
      created_by: me.id,
    })
    .select("id")
    .single();

  if (error) {
    return {
      ok: false,
      message: /duplicate|unique/i.test(error.message)
        ? "A team with that name already exists this season."
        : error.message,
    };
  }

  const { error: rosterError } = await supabase.from("team_members").insert([
    { team_id: team.id, person_id: p1, role: "starter" },
    { team_id: team.id, person_id: p2, role: "starter" },
  ]);

  if (rosterError) {
    // don't leave a team with half a roster behind
    await supabase.from("teams").delete().eq("id", team.id);
    return { ok: false, message: rosterError.message };
  }

  revalidatePath("/admin/teams");
  return { ok: true, message: `${name} is in.` };
}

export async function setTeamApproval(formData: FormData): Promise<void> {
  await requireCommissioner();
  const id = String(formData.get("team_id") ?? "");
  const approved = String(formData.get("approved") ?? "") === "true";
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("teams").update({ approved }).eq("id", id);
  revalidatePath("/admin/teams");
}

export async function deleteTeam(formData: FormData): Promise<void> {
  await requireCommissioner();
  const id = String(formData.get("team_id") ?? "");
  if (!id) return;

  const supabase = await createClient();

  // Refuse if the team has played — deleting would cascade its games away and
  // silently rewrite the standings.
  const { count } = await supabase
    .from("games")
    .select("*", { count: "exact", head: true })
    .or(`home_team_id.eq.${id},away_team_id.eq.${id}`);

  if ((count ?? 0) > 0) return;

  await supabase.from("teams").delete().eq("id", id);
  revalidatePath("/admin/teams");
}

/** Add a sub, or replace someone mid-season. Subs count normally — a sub's
 *  throws land in his own career totals for the games he actually played. */
export async function addTeamMember(formData: FormData): Promise<void> {
  await requireCommissioner();
  const teamId = String(formData.get("team_id") ?? "");
  const personId = String(formData.get("person_id") ?? "");
  const role = String(formData.get("role") ?? "sub");
  if (!teamId || !personId) return;

  const supabase = await createClient();
  await supabase.from("team_members").insert({
    team_id: teamId,
    person_id: personId,
    role: role === "starter" ? "starter" : "sub",
  });

  revalidatePath("/admin/teams");
}

export async function removeTeamMember(formData: FormData): Promise<void> {
  await requireCommissioner();
  const id = String(formData.get("member_id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("team_members").delete().eq("id", id);
  revalidatePath("/admin/teams");
}
