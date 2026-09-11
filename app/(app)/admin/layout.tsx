import Link from "next/link";
import { requireCommissioner } from "@/lib/auth";

const SECTIONS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/people", label: "People" },
  { href: "/admin/seasons", label: "Seasons" },
  { href: "/admin/teams", label: "Teams" },
  { href: "/admin/schedule", label: "Schedule" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // RLS is the real gate. This is so a member sees a clean redirect rather
  // than a page of empty tables from queries the database refused.
  await requireCommissioner();

  return (
    <div>
      <div className="mb-6 border-b border-ash-200">
        <div className="mb-3 flex items-baseline gap-3">
          <h1 className="font-display text-2xl font-bold tracking-tight text-navy-800">
            Commissioner
          </h1>
          <span className="eyebrow text-ash-500">League administration</span>
        </div>
        <nav className="flex gap-1 overflow-x-auto">
          {SECTIONS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="whitespace-nowrap rounded-t-md px-3 py-2 font-display text-sm font-semibold text-ash-600 hover:bg-ash-100 hover:text-navy-800"
            >
              {s.label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}
