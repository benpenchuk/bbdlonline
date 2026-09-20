"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePerson } from "@/lib/auth";

export type ProfileResult = { ok: boolean; message?: string };

/**
 * A member editing his own profile. Name, nickname, hometown and throwing hand
 * are his; role and league status belong to the commissioner, and the
 * guard_people_fields trigger rejects them independently of this code.
 *
 * A blank last name is allowed and meaningful: the imported seasons carry
 * players whose surname the league never recorded, and this form is how they
 * fix it.
 */
export async function updateMyProfile(
  _prev: ProfileResult,
  formData: FormData,
): Promise<ProfileResult> {
  const me = await requirePerson();

  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const nickname = String(formData.get("nickname") ?? "").trim() || null;

  if (!firstName) {
    return { ok: false, message: "You need a first name." };
  }
  if (firstName.length > 40 || lastName.length > 60) {
    return { ok: false, message: "That name is longer than the site can show." };
  }
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
    .update({
      first_name: firstName,
      last_name: lastName,
      nickname,
      hometown_city: city,
      dominant_hand: hand,
    })
    .eq("id", me.id);

  if (error) return { ok: false, message: error.message };

  revalidatePath(`/players/${me.slug}`);
  return { ok: true, message: "Saved." };
}
