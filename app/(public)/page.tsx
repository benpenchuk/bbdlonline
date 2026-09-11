import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentPerson } from "@/lib/auth";

/* The landing page reads NO league data — that is deliberate. Nothing about
   BBDL is public until a verified member signs in, so this page is brand
   only and needs no database access at all. */
export default async function LandingPage() {
  const person = await getCurrentPerson();
  if (person) redirect("/dashboard");

  return (
    <main className="min-h-dvh bg-navy-900 text-white">
      <div className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center px-6 py-20">
        <Image
          src="/images/logo/BBDL_logo_single.svg"
          alt=""
          width={72}
          height={72}
          className="mb-8"
          priority
        />

        <p className="eyebrow mb-4 text-pink-300">Beta Theta Pi</p>
        <h1 className="mb-5 text-4xl font-bold leading-[1.05] sm:text-6xl">
          The Beta Beer Dye League
        </h1>
        <p className="mb-10 max-w-md text-lg leading-relaxed text-navy-200">
          Six weeks. Fixed pairs. Every throw on the record. Standings, career
          stats and a hall of fame that outlives all of us.
        </p>

        <div>
          <Link
            href="/join"
            className="inline-block rounded-lg bg-pink-500 px-7 py-3.5 font-display font-semibold text-white transition hover:bg-pink-600"
          >
            Sign in
          </Link>
        </div>

        <p className="mt-6 text-sm text-navy-300">
          Members only. Ask the commissioner for an invite.
        </p>
      </div>
    </main>
  );
}
