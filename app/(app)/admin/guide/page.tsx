import Link from "next/link";
import { requireCommissioner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Commissioner's guide · Admin" };

function Step({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-4">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-navy-800 font-mono text-xs font-bold text-white">
        {n}
      </span>
      <div className="min-w-0 flex-1 pb-5">
        <h3 className="mb-1 font-display text-base font-bold text-navy-800">{title}</h3>
        <div className="space-y-2 text-sm text-ash-600">{children}</div>
      </div>
    </li>
  );
}

export default async function GuidePage() {
  await requireCommissioner();
  const supabase = await createClient();

  const { data: superadmins } = await supabase
    .from("people")
    .select("first_name, last_name, email")
    .eq("site_role", "superadmin");

  return (
    <div className="max-w-2xl space-y-8">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight text-navy-800">
          Running BBDL
        </h1>
        <p className="mt-1 text-sm text-ash-600">
          Everything you need to run a season and hand the job on. If you&apos;re
          reading this because someone just made you commissioner: start at the
          bottom, with &ldquo;Passing it on&rdquo;, then come back to the top.
        </p>
      </header>

      <section>
        <h2 className="mb-4 font-display text-lg font-bold text-navy-800">
          Starting a season
        </h2>
        <ol>
          <Step n="1" title="Create the season">
            <p>
              <Link href="/admin/seasons" className="text-pink-500 hover:underline">
                Seasons
              </Link>{" "}
              → pick fall or spring and the year. Set the number of weeks. The last
              week is always rivalry week, so six weeks means five scheduled weeks
              plus rivalry.
            </p>
            <p>
              Scoring rules live on the season, not in the code. Play to 11, win by
              2, semis to 15, best-of-3 final — change any of it here and the whole
              site follows, including the tracker.
            </p>
          </Step>

          <Step n="2" title="Get everyone in">
            <p>
              Nobody can sign up without an invite.{" "}
              <Link href="/admin/people" className="text-pink-500 hover:underline">
                People
              </Link>{" "}
              → create one. Two kinds:
            </p>
            <ul className="ml-4 list-disc space-y-1">
              <li>
                <strong>Attached to a person</strong> — use this for anyone who has
                played before. They keep every stat and game they&apos;ve ever had.
              </li>
              <li>
                <strong>Open, with a use limit</strong> — a code you drop in the group
                chat. Set the limit to roughly how many guys you expect.
              </li>
            </ul>
            <p>
              For someone who played years ago and will never make an account, use
              &ldquo;Add a person&rdquo; instead. They can be on rosters and appear in
              the record book without ever signing in.
            </p>
          </Step>

          <Step n="3" title="Teams">
            <p>
              Guys register their own pairs, and you approve them under{" "}
              <Link href="/admin/teams" className="text-pink-500 hover:underline">
                Teams
              </Link>
              . An unapproved team doesn&apos;t get scheduled and doesn&apos;t appear in
              standings. You can also create teams yourself.
            </p>
            <p>
              Pairs are fixed for the season. If someone gets hurt, add a sub to the
              roster — his stats count normally for the games he actually plays.
            </p>
          </Step>

          <Step n="4" title="Generate the schedule">
            <p>
              <Link href="/admin/schedule" className="text-pink-500 hover:underline">
                Schedule
              </Link>{" "}
              → Generate. Random pairings, and nobody plays the same team twice.
            </p>
            <p>
              You can regenerate freely until someone plays a game. After that it
              refuses, because wiping played games would silently rewrite the
              standings.
            </p>
          </Step>
        </ol>
      </section>

      <section>
        <h2 className="mb-4 font-display text-lg font-bold text-navy-800">
          During the season
        </h2>
        <ol>
          <Step n="5" title="Games get tracked, or just scored">
            <p>
              Anyone can track a game from{" "}
              <Link href="/track" className="text-pink-500 hover:underline">
                Track
              </Link>{" "}
              — you don&apos;t have to be playing. One tap per throw, and the site
              keeps the fifa ladder so nobody argues about how many kicks it is.
            </p>
            <p>
              If nobody wants to track, use &ldquo;Just log the score&rdquo;. That game
              counts for the standings but not for accuracy or sink leaderboards,
              because there are no throws behind it.
            </p>
          </Step>

          <Step n="6" title="Results need both teams to agree">
            <p>
              After a game is submitted, one player from each team confirms it. The
              second confirmation makes it official. You can confirm on either
              team&apos;s behalf, or override entirely, if guys are being slow.
            </p>
          </Step>

          <Step n="7" title="Rivalry week">
            <p>
              In the last week, teams call each other out from{" "}
              <Link href="/rivalry" className="text-pink-500 hover:underline">
                Rivalry
              </Link>
              . When the callouts settle, hit &ldquo;Build rivalry week&rdquo; on the
              schedule page: accepted challenges become games and everyone left over
              gets paired at random.
            </p>
          </Step>

          <Step n="8" title="Playoffs">
            <p>
              Once the regular season is done,{" "}
              <Link href="/playoffs" className="text-pink-500 hover:underline">
                Playoffs
              </Link>{" "}
              → Seed the bracket. Top half of the standings, seeded 1-vs-last. Mark
              winners as games finish and the bracket fills itself in.
            </p>
            <p>
              When the final is decided, the season&apos;s champion goes into the{" "}
              <Link href="/records" className="text-pink-500 hover:underline">
                record book
              </Link>{" "}
              permanently.
            </p>
          </Step>
        </ol>
      </section>

      <section className="rounded-lg border-2 border-pink-500/40 bg-pink-500/5 p-5">
        <h2 className="mb-3 font-display text-lg font-bold text-navy-800">
          Passing it on
        </h2>
        <div className="space-y-3 text-sm text-ash-700">
          <p>
            <strong>This is the important part.</strong> BBDL Online is meant to
            outlive all of us, and the most likely way it dies is a commissioner
            graduating without handing over the keys.
          </p>
          <p>
            Go to{" "}
            <Link href="/admin/people" className="text-pink-500 hover:underline">
              People
            </Link>
            , find your replacement, and set his role to <strong>Commissioner</strong>.
            That&apos;s the whole handover. Do it before you leave, not on your way
            out the door.
          </p>
          <p>
            You can&apos;t demote yourself, so there is never a moment with zero
            commissioners. Having two or three at once is fine and is a good idea
            around graduation.
          </p>
          <p className="rounded bg-white/60 px-3 py-2">
            <strong>If everything goes wrong</strong> — nobody has admin, or someone
            locks the chapter out — the accounts behind this site (Vercel, Supabase,
            GitHub) belong to{" "}
            {(superadmins ?? []).length > 0
              ? (superadmins ?? [])
                  .map((s) => `${s.first_name} ${s.last_name}`)
                  .join(", ")
              : "the site's owner"}
            . That&apos;s the last resort, not the normal path.
          </p>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-bold text-navy-800">
          Things worth knowing
        </h2>
        <ul className="space-y-2 text-sm text-ash-600">
          <li>
            <strong className="text-navy-800">Stats are never invented.</strong> Every
            number on this site comes from a throw somebody logged. If a stat looks
            wrong, open the game and read the play-by-play — the mistake is a
            mis-tapped throw, and it can be found.
          </li>
          <li>
            <strong className="text-navy-800">Nothing is public.</strong> Only people
            you invite can see the league. The front page shows the name and nothing
            else.
          </li>
          <li>
            <strong className="text-navy-800">Real names are yours to set.</strong>{" "}
            Players can change their own nickname and photo, nothing more. If someone
            needs their name fixed, you do it.
          </li>
          <li>
            <strong className="text-navy-800">Deleting is deliberately hard.</strong>{" "}
            You can&apos;t delete a team that has played, and you can&apos;t
            regenerate a schedule over played games. Both would quietly change
            history.
          </li>
        </ul>
      </section>
    </div>
  );
}
