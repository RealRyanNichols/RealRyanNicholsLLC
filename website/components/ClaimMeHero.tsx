import Link from "next/link";

export function ClaimMeHero({
  name,
  slug,
  signedIn,
  views,
  shares,
}: {
  name: string;
  slug: string;
  signedIn: boolean;
  views: number;
  shares: number;
}) {
  const firstName = name.split(/\s+/)[0] ?? name;
  const claimHref = signedIn
    ? `/case/people/${slug}/claim`
    : `/login?next=/case/people/${slug}/claim`;

  return (
    <div className="rounded-2xl border-2 border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-6 sm:p-10">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-accent)] font-bold">
          Anti-Weaponization Case Builder · Unclaimed
        </p>
        {views > 0 || shares > 0 ? (
          <p
            className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[var(--color-blue)] whitespace-nowrap"
            aria-label={`${views} people have viewed this profile, ${shares} shares`}
          >
            <span className="tabular-nums">{views.toLocaleString()}</span> watching
            {shares > 0 ? (
              <>
                {" · "}
                <span className="tabular-nums">{shares.toLocaleString()}</span> shared
              </>
            ) : null}
          </p>
        ) : null}
      </div>
      <h1 className="mt-3 text-3xl sm:text-5xl font-bold tracking-tight font-display leading-[1.05]">
        Hey {firstName} — your J6 Anti-Weaponization Case Builder profile is
        ready to be claimed.
      </h1>
      <p className="mt-5 text-lg sm:text-xl text-[var(--color-ink-soft)] leading-snug">
        Claim it. Build your case. Free, forever.
      </p>

      <div className="mt-6 space-y-3 text-base leading-relaxed text-[var(--color-ink)]">
        <p>
          This profile was set up so {firstName} can take it over and build a
          personal record of what happened. It is part of a larger effort to
          put every January 6 defendant&apos;s case in public, side by side
          with Ryan Nichols&apos;s — one master record the government cannot
          bury.
        </p>
        <p>
          <strong>If you ARE {name}</strong>, claim this profile. Ryan will
          personally verify your claim against the DOJ docket before it goes
          live. Only one verified claim per profile.
        </p>
        <p>
          <strong>If you&apos;re not {firstName}</strong> but you know who
          should be — use the tip line below.
        </p>
      </div>

      <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          href={claimHref}
          className="block rounded-xl border-2 border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-paper)] px-5 py-4 text-center font-bold text-base sm:text-lg hover:bg-[var(--color-accent-strong)] transition"
        >
          I am {firstName} — claim this profile →
        </Link>
        <Link
          href={`/submit?about=${encodeURIComponent(name)}`}
          className="block rounded-xl border-2 border-[var(--color-blue)] bg-[var(--color-blue)] text-[var(--color-paper)] px-5 py-4 text-center font-bold text-base sm:text-lg hover:bg-[var(--color-blue-strong)] transition"
        >
          Not me — send a tip →
        </Link>
      </div>

      {!signedIn ? (
        <p className="mt-4 text-xs text-[var(--color-muted)]">
          Claiming requires a free account so only you can edit your profile
          once verified. You&apos;ll be asked to sign in on the next page.
        </p>
      ) : null}
    </div>
  );
}

export function ClaimMeFooter({ name }: { name: string }) {
  return (
    <section className="mt-12 border-t border-[var(--color-line)] pt-8">
      <h2 className="text-2xl font-bold tracking-tight font-display">
        How verification works
      </h2>
      <ol className="mt-5 space-y-4">
        <Step
          n={1}
          title="You claim the profile"
          body={`Sign in (or sign up free), then submit your DOJ case number, a mugshot or pardon record, or a court document showing this is you. Takes a couple minutes.`}
        />
        <Step
          n={2}
          title="Ryan reviews it personally"
          body="Every claim is checked by Ryan against the DOJ docket and public record. Imposters get rejected. You only need to do this once."
        />
        <Step
          n={3}
          title="Profile becomes yours"
          body={`Once approved, this page comes down and a fresh case-builder takes its place. You can upload photos, scanned documents, embedded TikTok / YouTube / X videos, your testimony in your own words. Everything you upload waits for review before going public.`}
        />
      </ol>

      <h2 className="mt-12 text-2xl font-bold tracking-tight font-display">
        Why this matters for {name.split(/\s+/)[0]}
      </h2>
      <div className="mt-4 space-y-3 text-base leading-relaxed text-[var(--color-ink-soft)]">
        <p>
          Most J6 defendant case files sit locked inside law firms. The public
          hears soundbites. They do not see the grievance forms denied without
          a hearing. They do not see the water shut off. They do not see four
          years of constitutional rights violated, one piece of paper at a
          time.
        </p>
        <p>
          We put it in public. All of it. Every defendant who joins. One
          airtight record the government cannot refute. That is how this case
          is won.
        </p>
      </div>
    </section>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <li className="flex gap-4">
      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[var(--color-accent)] text-[var(--color-paper)] flex items-center justify-center font-bold">
        {n}
      </div>
      <div className="flex-1 pt-0.5">
        <h3 className="text-base font-bold tracking-tight">{title}</h3>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)] leading-relaxed">
          {body}
        </p>
      </div>
    </li>
  );
}
