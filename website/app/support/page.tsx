import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support",
  description: "Ways to support Ryan Nichols' writing and rebuild.",
};

export default function SupportPage() {
  const donateUrl = process.env.NEXT_PUBLIC_DONATION_URL;

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.05]">
        Support the rebuild
      </h1>
      <p className="mt-3 text-base text-[var(--color-ink-soft)]">
        Three ways. None of them are required to read the site.
      </p>

      {donateUrl ? (
        <section className="mt-8 rounded-2xl border border-[var(--color-line)] bg-gradient-to-br from-[var(--color-surface-2)] to-[var(--color-surface)] p-6 sm:p-8 relative overflow-hidden">
          <div
            className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full blur-3xl"
            style={{ background: "var(--color-accent-glow)" }}
            aria-hidden
          />
          <p className="relative text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
            Send a tip
          </p>
          <h2 className="relative font-display text-2xl sm:text-3xl mt-2 text-[var(--color-ink)]">
            One-time gift via Stripe
          </h2>
          <p className="relative mt-3 text-[var(--color-ink-soft)] leading-relaxed">
            Direct contribution. No middleman fees besides what the card
            networks charge. Every dollar funds writing time, equipment, and
            keeping this site independent of any platform.
          </p>
          <a
            href={donateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-accent relative inline-flex items-center mt-5 rounded-full px-6 py-2.5 text-sm transition"
          >
            Open the donation page →
          </a>
        </section>
      ) : null}

      <div className="prose-body mt-10 space-y-4">
        <h2 className="font-display text-2xl text-[var(--color-ink)] mt-2">
          Share a post
        </h2>
        <p>
          The single most useful thing you can do, at zero cost, is send a post
          to one person who would benefit from it. Algorithms don&apos;t move
          this place. People do.
        </p>

        <h2 className="font-display text-2xl text-[var(--color-ink)] mt-8">
          Subscribe by email
        </h2>
        <p>
          The signup form on the home page puts new posts straight in your
          inbox. No platform in the middle, no follower count that can be
          quietly throttled.
        </p>

        {!donateUrl ? (
          <>
            <h2 className="font-display text-2xl text-[var(--color-ink)] mt-8">
              Send a tip
            </h2>
            <p>
              A donation link will appear here once it&apos;s wired up. For now,
              the best way to send something my way is to subscribe and forward
              a post.
            </p>
          </>
        ) : null}

        <p className="text-[var(--color-muted)] italic">
          Thank you for showing up.
        </p>
      </div>
    </article>
  );
}
