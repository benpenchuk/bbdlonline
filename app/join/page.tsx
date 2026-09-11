import Image from "next/image";
import { AlertCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { getCurrentPerson } from "@/lib/auth";
import { JoinForm } from "./join-form";

export const metadata = { title: "Sign in" };

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; code?: string; error?: string }>;
}) {
  const person = await getCurrentPerson();
  if (person) redirect("/dashboard");

  const { next = "/dashboard", code, error } = await searchParams;

  // Supabase's own wording is unhelpful to someone who just wanted to log in.
  const linkProblem = error
    ? /expired|invalid|not found/i.test(error)
      ? "That link has expired or was already used. Here's a fresh one."
      : /code verifier|code challenge/i.test(error)
        ? "That link was superseded by a newer one. Request another and use the most recent email."
        : "That sign-in link didn't work. Try another."
    : null;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-navy-900 px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Image
            src="/images/logo/BBDL_logo_single.svg"
            alt=""
            width={56}
            height={56}
            className="mx-auto mb-4"
            priority
          />
          <h1 className="text-2xl font-bold text-white">Beta Beer Dye League</h1>
          <p className="mt-1 text-sm text-navy-200">Sign in to see the league.</p>
        </div>

        {linkProblem && (
          <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-pink-500/40 bg-pink-500/10 px-4 py-3">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-pink-300" />
            <p className="text-sm text-pink-100">{linkProblem}</p>
          </div>
        )}

        <JoinForm next={next} presetCode={code} />
      </div>
    </main>
  );
}
