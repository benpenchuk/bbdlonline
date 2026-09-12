import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./types";
import { getSupabaseEnv } from "./env";

/** Routes reachable without signing in. Everything else redirects to /join.
 *  Per the decision that nothing about the league is public: the landing page
 *  is brand only and reads no data. */
const PUBLIC_PATHS = ["/", "/join", "/auth/callback", "/auth/error"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Unconfigured deployment: don't attempt auth, and let the page render a
  // setup notice instead of throwing on every single request.
  const env = getSupabaseEnv();
  if (!env) return response;

  const supabase = createServerClient<Database>(
    env.url,
    env.anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() revalidates the token with Supabase. Do not swap this for
  // getSession(), which trusts whatever is in the cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/join";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}
