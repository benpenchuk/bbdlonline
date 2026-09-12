import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isConfigured } from "@/lib/supabase/env";
import type { Person } from "@/lib/supabase/types";

/** The signed-in member's person row, or null. Cached per request so a page
 *  and its layout don't both hit the database. */
export const getCurrentPerson = cache(async (): Promise<Person | null> => {
  if (!isConfigured()) return null;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("people")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return data ?? null;
});

/** For pages that must have a member. Redirects instead of returning null. */
export async function requirePerson(): Promise<Person> {
  const person = await getCurrentPerson();
  if (!person) redirect("/join");
  return person;
}

/** For commissioner-only pages. RLS is the real gate — this is so the UI
 *  shows a clean refusal instead of an empty page full of failed queries. */
export async function requireCommissioner(): Promise<Person> {
  const person = await requirePerson();
  if (person.site_role !== "commissioner" && person.site_role !== "superadmin") {
    redirect("/dashboard?denied=admin");
  }
  return person;
}

export function isCommissioner(person: Person | null): boolean {
  return person?.site_role === "commissioner" || person?.site_role === "superadmin";
}

export function displayName(person: {
  first_name: string;
  last_name: string;
  nickname?: string | null;
}): string {
  return person.nickname?.trim()
    ? `${person.first_name} "${person.nickname}" ${person.last_name}`
    : `${person.first_name} ${person.last_name}`;
}
