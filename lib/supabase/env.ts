/**
 * Supabase connection details, or null when the environment isn't configured.
 *
 * Returning null rather than throwing is deliberate. A missing variable is a
 * deployment mistake, not a code bug, and it should produce a page that says
 * so — not a 500 with a stack trace. This is the first thing a future
 * maintainer will hit after cloning the repo, and "Internal Server Error"
 * teaches them nothing.
 */
export type SupabaseEnv = { url: string; anonKey: string };

export function getSupabaseEnv(): SupabaseEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function isConfigured(): boolean {
  return getSupabaseEnv() !== null;
}
