/**
 * Pure, no server imports — this is used from client components too, so it
 * must not pull in next/headers. Building the URL and discovering the site's
 * origin are deliberately separate concerns for that reason.
 */
export function inviteLink(siteUrl: string, code: string): string {
  return `${siteUrl.replace(/\/$/, "")}/join?code=${encodeURIComponent(code)}`;
}
