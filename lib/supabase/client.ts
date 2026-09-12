import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";
import { getSupabaseEnv } from "./env";

/** Supabase client for Client Components. Safe to ship: the anon key is
 *  public by design, and RLS is what actually protects the data. */
export function createClient() {
  const env = getSupabaseEnv();
  if (!env) throw new Error("Supabase is not configured.");
  return createBrowserClient<Database>(env.url, env.anonKey);
}
