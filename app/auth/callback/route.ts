import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";

/**
 * Where every sign-in link lands.
 *
 * Handles BOTH shapes Supabase can send, because which one arrives depends on
 * the email template and on whether the account already existed:
 *
 *   token_hash + type  → verifyOtp()             (stateless — preferred)
 *   code               → exchangeCodeForSession() (PKCE — legacy fallback)
 *
 * The token_hash path is the one we want. PKCE keeps a code verifier in a
 * browser cookie, which breaks in two ways that matter a lot here:
 *   1. Requesting a second link overwrites the verifier and silently kills the
 *      first link — and people always re-request when email is slow.
 *   2. It cannot work across devices. Request on a laptop, open the mail on
 *      your phone, and the verifier simply isn't there.
 * verifyOtp carries no client state, so old links keep working until they
 * expire and cross-device sign-in is fine.
 */

const VALID_OTP_TYPES: EmailOtpType[] = [
  "email",
  "magiclink",
  "signup",
  "invite",
  "recovery",
  "email_change",
];

function safePath(next: string | null): string {
  // Never honour an absolute URL handed to us in the query string.
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/dashboard";
  return next;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const next = safePath(searchParams.get("next"));
  const tokenHash = searchParams.get("token_hash");
  const rawType = searchParams.get("type");
  const code = searchParams.get("code");

  const supabase = await createClient();

  // A failed link should never be a dead end. Send them back to the form with
  // the reason and their email prefilled so retrying is one tap.
  const bounce = (reason: string) => {
    const url = new URL("/join", origin);
    url.searchParams.set("error", reason);
    url.searchParams.set("next", next);
    return NextResponse.redirect(url);
  };

  if (tokenHash && rawType) {
    const type = VALID_OTP_TYPES.includes(rawType as EmailOtpType)
      ? (rawType as EmailOtpType)
      : "email";

    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (error) return bounce(error.message);
    return NextResponse.redirect(`${origin}${next}`);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return bounce(error.message);
    return NextResponse.redirect(`${origin}${next}`);
  }

  return bounce("That link was missing its sign-in code.");
}
