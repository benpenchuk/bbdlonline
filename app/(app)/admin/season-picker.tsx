import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/lib/supabase/types";

export type Season = Tables<"seasons">;

/**
 * Admin pages used to hard-filter on status = 'active', which meant the
 * imported Season 6 and 7 were invisible the moment Season 8 went live —
 * their teams, rosters and games could not be corrected at all.
 *
 * Every admin page now takes ?season=<slug> and falls back to the active
 * one, so the commissioner can work on any season without flipping which
 * is active and disturbing what the rest of the site shows.
 */
export async function pickSeason(
  supabase: SupabaseClient<Database>,
  slug?: string,
): Promise<{ season: Season | null; seasons: Season[] }> {
  const { data } = await supabase
    .from("seasons")
    .select("*")
    .order("number", { ascending: false });

  const seasons = data ?? [];
  const chosen =
    (slug && seasons.find((s) => s.slug === slug)) ||
    seasons.find((s) => s.status === "active") ||
    seasons[0] ||
    null;

  return { season: chosen, seasons };
}

export function SeasonPicker({
  seasons,
  current,
  basePath,
}: {
  seasons: Season[];
  current: Season;
  basePath: string;
}) {
  if (seasons.length < 2) return null;

  return (
    <div className="mb-5 flex flex-wrap items-center gap-1.5">
      <span className="mr-1 font-mono text-[10px] uppercase tracking-wider text-ash-500">
        Season
      </span>
      {seasons.map((s) => {
        const on = s.id === current.id;
        return (
          <Link
            key={s.id}
            href={`${basePath}?season=${s.slug}`}
            aria-current={on ? "page" : undefined}
            className={
              on
                ? "rounded-lg bg-navy-800 px-2.5 py-1 font-display text-xs font-semibold text-white"
                : "rounded-lg border border-ash-300 px-2.5 py-1 font-display text-xs font-semibold text-ash-700 hover:border-pink-500"
            }
          >
            {s.number}
            {s.status === "active" && (
              <span className={on ? "ml-1 text-pink-300" : "ml-1 text-pink-500"}>•</span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
