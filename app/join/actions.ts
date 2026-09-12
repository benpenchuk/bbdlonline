"use server";

import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";

export type JoinState = {
  status: "idle" | "sent" | "error";
  message?: string;
  email?: string;
};

export async function requestMagicLink(
  _prev: JoinState,
  formData: FormData,
): Promise<JoinState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const code = String(formData.get("invite_code") ?? "").trim();
  const next = String(formData.get("next") ?? "/dashboard");

  if (!email || !email.includes("@")) {
    return { status: "error", message: "Enter a valid email address." };
  }

  const supabase = await createClient();
  const origin = await getSiteUrl();
  const emailRedirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;

  // With an invite code: create the account if it doesn't exist. The code
  // rides along in user metadata, where handle_new_auth_user() reads it to
  // attach the new account to the right person row.
  if (code) {
    const { data: valid, error: rpcError } = await supabase.rpc(
      "invite_code_valid",
      { p_code: code },
    );

    if (rpcError) {
      return { status: "error", message: "Could not check that invite. Try again." };
    }
    if (!valid) {
      return {
        status: "error",
        message: "That invite code isn't valid — it may have been used already or expired.",
      };
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo,
        shouldCreateUser: true,
        data: { invite_code: code },
      },
    });

    if (error) return { status: "error", message: error.message };
    return { status: "sent", email };
  }

  // No code: sign-in only. Never creates an account, so the league stays
  // invite-only even though this form is reachable by anyone.
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo, shouldCreateUser: false },
  });

  if (error) {
    const looksLikeNoAccount =
      /signups? not allowed|not found|invalid/i.test(error.message);
    return {
      status: "error",
      message: looksLikeNoAccount
        ? "No account for that email yet. Add the invite code the commissioner sent you."
        : error.message,
    };
  }

  return { status: "sent", email };
}
