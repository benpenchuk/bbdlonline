"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePerson } from "@/lib/auth";

export type ProfileResult = { ok: boolean; message?: string };

/**
 * A member editing his own profile. Only nickname, hometown and throwing hand
 * are here — name, role and league status belong to the commissioner, and the
 * guard_people_fields trigger rejects them independently of this code.
 */
export async function updateMyProfile(
  _prev: ProfileResult,
  formData: FormData,
): Promise<ProfileResult> {
  const me = await requirePerson();

  const nickname = String(formData.get("nickname") ?? "").trim() || null;
  const city = String(formData.get("hometown_city") ?? "").trim() || null;
  const hand = String(formData.get("dominant_hand") ?? "").trim() || null;

  if (nickname && nickname.length > 30) {
    return { ok: false, message: "Keep the nickname under 30 characters." };
  }
  if (hand && hand !== "left" && hand !== "right") {
    return { ok: false, message: "Hand must be left or right." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("people")
    .update({ nickname, hometown_city: city, dominant_hand: hand })
    .eq("id", me.id);

  if (error) return { ok: false, message: error.message };

  revalidatePath(`/players/${me.slug}`);
  return { ok: true, message: "Saved." };
}
