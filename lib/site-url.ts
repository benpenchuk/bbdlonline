import { headers } from "next/headers";

/**
 * The canonical origin for links we hand to people — invite links, magic-link
 * redirects. Prefers the configured site URL so a link generated from a
 * preview deployment still points at the real site; falls back to the request
 * host when it isn't set.
 */
export async function getSiteUrl(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}
