import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";
import { getSupabaseEnv } from "./env";

/** Supabase client for Server Components, Server Actions and Route Handlers.
 *  Reads the session from cookies so queries run as the signed-in member and
 *  RLS applies to them. */
export async function createClient() {
  // cookies() must be awaited FIRST. It is what marks the route dynamic, and
  // during a production build that is how Next knows to stop prerendering
  // this page. Throwing before it means an unconfigured build dies on
  // /players instead of bailing out of prerender — which is exactly what
  // happened once.
  const cookieStore = await cookies();

  const env = getSupabaseEnv();
  if (!env) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY in the environment.",
    );
  }

  return createServerClient<Database>(
    env.url,
    env.anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component, which cannot set cookies.
            // The middleware refreshes the session instead, so this is safe
            // to swallow.
          }
        },
      },
    },
  );
}
