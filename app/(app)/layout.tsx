import Link from "next/link";
import Image from "next/image";
import { requirePerson, isCommissioner, displayName } from "@/lib/auth";
import { SignOutButton } from "./sign-out-button";

const NAV = [
  { href: "/dashboard", label: "Home" },
  { href: "/games", label: "Games" },
  { href: "/standings", label: "Standings" },
  { href: "/players", label: "Players" },
  { href: "/stats", label: "Stats" },
  { href: "/track", label: "Track" },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const person = await requirePerson();
  const admin = isCommissioner(person);

  return (
    <div className="min-h-dvh bg-ash-50">
      <header className="bg-navy-900 text-white">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <Link href="/dashboard" className="flex shrink-0 items-center gap-2">
            <Image
              src="/images/logo/BBDL_logo_single.svg"
              alt="BBDL"
              width={28}
              height={28}
            />
            <span className="font-display text-lg font-bold tracking-tight">BBDL</span>
          </Link>

          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="hidden text-navy-200 sm:inline">{displayName(person)}</span>
            {admin && (
              <Link
                href="/admin"
                className="rounded-md bg-pink-500 px-3 py-1.5 font-display text-xs font-semibold"
              >
                Admin
              </Link>
            )}
            <SignOutButton />
          </div>
        </div>

        <nav className="border-t border-navy-700">
          <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap px-3 py-2.5 font-display text-sm font-semibold text-navy-100 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
