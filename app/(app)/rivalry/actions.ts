"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePerson } from "@/lib/auth";

/** Call another team out for rivalry week. RLS independently checks that you
 *  are actually on the challenging team. */
export async function issueChallenge(formData: FormData): Promise<void> {
  const me = await requirePerson();
  const challenger = String(formData.get("challenger_team_id") ?? "");
  const challenged = String(formData.get("challenged_team_id") ?? "");
  if (!challenger || !challenged || challenger === challenged) return;

  const supabase = await createClient();
  const { data: team } = await supabase
    .from("teams")
    .select("season_id")
    .eq("id", challenger)
    .maybeSingle();
  if (!team) return;

  await supabase.from("rivalry_challenges").insert({
    season_id: team.season_id,
    challenger_team_id: challenger,
    challenged_team_id: challenged,
    created_by: me.id,
  });

  revalidatePath("/rivalry");
}

export async function answerChallenge(formData: FormData): Promise<void> {
  const me = await requirePerson();
  const id = String(formData.get("challenge_id") ?? "");
  const answer = String(formData.get("answer") ?? "");
  if (!id || (answer !== "accepted" && answer !== "declined")) return;

  const supabase = await createClient();
  await supabase
    .from("rivalry_challenges")
    .update({
      status: answer,
      responded_by: me.id,
      responded_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath("/rivalry");
}
