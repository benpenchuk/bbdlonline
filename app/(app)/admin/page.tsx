import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireCommissioner } from "@/lib/auth";
import { Users, CalendarDays, Shield, ListChecks, ArrowRight } from "lucide-react";

export const metadata = { title: "Admin" };

export default async function AdminOverviewPage() {
  const me = await requireCommissioner();
  const supabase = await createClient();

  const [{ data: season }, { count: peopleCount }, { count: accountCount }, { data: teams }, { data: pending }] =
    await Promise.all([
      supabase.from("seasons").select("*").eq("status", "active").maybeSingle(),
      supabase.from("people").select("*", { count: "exact", head: true }),
      supabase
        .from("people")
        .select("*", { count: "exact", head: true })
        .not("auth_user_id", "is", null),
      supabase.from("teams").select("id, approved"),
      supabase
        .from("games")
        .select("id")
        .in("status", ["awaiting_confirmation", "disputed"]),
    ]);

  const teamList = teams ?? [];
  const unapproved = teamList.filter((t) => !t.approved).length;

  const stats = [
    { label: "People", value: peopleCount ?? 0, sub: `${accountCount ?? 0} signed up` },
    { label: "Teams", value: teamList.length, sub: unapproved ? `${unapproved} awaiting approval` : "all approved" },
    { label: "Needs attention", value: pending?.length ?? 0, sub: "games unconfirmed" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-ash-600">
          You&apos;re signed in as{" "}
          <strong className="text-navy-800">
            {me.site_role === "superadmin" ? "superadmin" : "commissioner"}
          </strong>
          .{" "}
          {season ? (
            <>
              Active season is <strong className="text-navy-800">{season.name}</strong> —
              games to {season.point_target}, win by {season.win_by}.
            </>
          ) : (
            <span className="text-loss">
              No active season. Create one before anything else works.
            </span>
          )}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-ash-200 bg-white p-4">
            <div className="eyebrow mb-1 text-ash-500">{s.label}</div>
            <div className="font-display text-3xl font-bold tabular-nums text-navy-800">
              {s.value}
            </div>
            <div className="mt-0.5 text-xs text-ash-500">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {[
          {
            href: "/admin/people",
            icon: Users,
            title: "People & invites",
            body: "Add players, send invites, hand on the commissioner title.",
          },
          {
            href: "/admin/seasons",
            icon: CalendarDays,
            title: "Seasons",
            body: "Start a season and set the scoring rules for it.",
          },
          {
            href: "/admin/teams",
            icon: Shield,
            title: "Teams",
            body: "Approve the pairs guys registered, fix rosters, handle subs.",
          },
          {
            href: "/admin/schedule",
            icon: ListChecks,
            title: "Schedule",
            body: "Generate weeks 1–5, then open rivalry week.",
          },
        ].map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-lg border border-ash-200 bg-white p-4 transition hover:border-pink-500"
          >
            <div className="mb-1.5 flex items-center gap-2">
              <card.icon size={16} className="text-pink-500" />
              <h3 className="font-display text-sm font-bold text-navy-800">
                {card.title}
              </h3>
              <ArrowRight
                size={14}
                className="ml-auto text-ash-300 transition group-hover:translate-x-0.5 group-hover:text-pink-500"
              />
            </div>
            <p className="text-xs text-ash-600">{card.body}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
