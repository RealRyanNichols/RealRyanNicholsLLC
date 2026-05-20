import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Help Ryan rebuild",
  description:
    "After pretrial detention and a weaponized DOJ prosecution, Ryan Nichols is rebuilding his life. Here's how you can help.",
};

export default function SupportPage() {
  const donateUrl = process.env.NEXT_PUBLIC_DONATION_URL;
  const supporterUrl = SITE.supporterUrl;
  const mailing = SITE.mailingAddress;

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
        Help me rebuild
      </p>
      <h1 className="mt-2 text-4xl sm:text-5xl font-bold tracking-tight leading-[1.05]">
        I&apos;m starting over from less than zero.
      </h1>

      <section className="prose-body mt-6 space-y-4">
        <p>
          The Biden DOJ weaponized the full force of the federal government
          against me and other January 6 defendants. I came home to a life I
          don&apos;t recognize. Right now I&apos;m fighting to cover rent, food,
          and the basics — while also trying to access the mental healthcare
          I need after what was done to me in pretrial detention.
        </p>
        <p>
          I&apos;m not asking for sympathy. I&apos;m asking the people who&apos;ve
          followed my story to help me get back on my feet so I can keep
          telling it — on my own domain, where no algorithm can throttle me
          and no platform can silence me.
        </p>
        <p>
          Every dollar goes directly to me. There is no organization, no
          middleman, no overhead. It pays for:
        </p>
        <ul>
          <li><strong>Rent</strong> and basic living expenses while I rebuild</li>
          <li><strong>Food</strong> for me and my family</li>
          <li><strong>Mental healthcare</strong> — therapy, the kind I couldn&apos;t get inside</li>
          <li><strong>Medical care</strong> I can&apos;t afford without insurance</li>
          <li>Equipment to keep posting — camera, mic, hosting, the work that goes into this site</li>
        </ul>
      </section>

      {donateUrl ? (
        <section className="mt-10 rounded-2xl border border-[var(--color-line)] bg-gradient-to-br from-[var(--color-surface-2)] to-[var(--color-surface)] p-6 sm:p-8 relative overflow-hidden">
          <div
            className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full blur-3xl"
            style={{ background: "var(--color-accent-glow)" }}
            aria-hidden
          />
          <p className="relative text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
            Send a gift
          </p>
          <h2 className="relative font-display text-2xl sm:text-3xl mt-2 text-[var(--color-ink)]">
            One-time donation via Stripe
          </h2>
          <p className="relative mt-3 text-[var(--color-ink-soft)] leading-relaxed">
            Direct to me. Any amount helps. Card / Apple Pay / Google Pay all
            work through the secure Stripe page.
          </p>
          <a
            href={donateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-accent relative inline-flex items-center mt-5 rounded-full px-6 py-3 text-sm font-bold transition"
          >
            Open the donation page →
          </a>
          <p className="relative mt-4 text-xs text-[var(--color-muted)]">
            Stripe Payment Link · the payment goes directly to my account, not
            through any organization.
          </p>
        </section>
      ) : (
        <section className="mt-10 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6">
          <p className="text-sm text-[var(--color-ink-soft)]">
            A direct donation link is being finalized. In the meantime,
            subscribing and sharing posts is the next-best way to help.
          </p>
        </section>
      )}

      {supporterUrl ? (
        <section className="mt-10 rounded-2xl border-2 border-amber-700 p-6 bg-gradient-to-br from-amber-950/30 to-[var(--color-surface)] relative overflow-hidden">
          <div
            className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full blur-3xl bg-amber-500/20"
            aria-hidden
          />
          <p className="relative text-xs uppercase tracking-wider text-amber-400 font-bold">
            Supporter Membership · $5 / month
          </p>
          <h2 className="relative font-display text-2xl sm:text-3xl mt-2 text-[var(--color-ink)]">
            Become a verified Supporter
          </h2>
          <p className="relative mt-3 text-[var(--color-ink-soft)] leading-relaxed">
            $5 a month, billed by Stripe. You get a gold ★ Supporter badge on
            your profile and every comment you leave, your name shows verified
            (matching the card on file), and you keep this independent site
            running while it&apos;s still rebuilding.
          </p>
          <p className="relative mt-2 text-xs text-[var(--color-muted)]">
            Reading, signing up, and commenting all stay free for everyone.
            This is a tip jar with a badge, not a paywall.
          </p>
          <a
            href={supporterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="relative inline-flex items-center mt-5 rounded-full bg-amber-600 hover:bg-amber-500 px-6 py-2.5 text-sm font-bold text-[#1a1308] transition"
            data-track="supporter-checkout"
          >
            Start Supporter Membership →
          </a>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="font-display text-2xl text-[var(--color-ink)]">
          Other ways to help — every one of these matters
        </h2>

        <div className="mt-4 space-y-4">
          <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
            <h3 className="text-lg font-bold tracking-tight">Subscribe by email</h3>
            <p className="mt-2 text-sm text-[var(--color-ink-soft)] leading-relaxed">
              The signup form on the home page sends new posts straight to your
              inbox. No platform in the middle. Knowing real people are listening
              keeps me writing.
            </p>
            <Link
              href="/"
              className="inline-flex items-center mt-3 text-sm font-semibold text-[var(--color-accent)] hover:underline underline-offset-4"
            >
              Subscribe on the home page →
            </Link>
          </div>

          <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
            <h3 className="text-lg font-bold tracking-tight">Share a post</h3>
            <p className="mt-2 text-sm text-[var(--color-ink-soft)] leading-relaxed">
              Algorithms don&apos;t move this place. People do. If something
              I&apos;ve written hits, send it to one person who needs to read
              it. That&apos;s how the audience grows without me begging X or
              Facebook to let it through.
            </p>
          </div>

          <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
            <h3 className="text-lg font-bold tracking-tight">Read the case</h3>
            <p className="mt-2 text-sm text-[var(--color-ink-soft)] leading-relaxed">
              The grievances, the people, the documents — they&apos;re all on{" "}
              <Link href="/case" className="text-[var(--color-accent)] underline underline-offset-4">the case page</Link>.
              Read it. Make up your own mind. Share what convicts you.
            </p>
          </div>

          {mailing ? (
            <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
              <h3 className="text-lg font-bold tracking-tight">Mail a paper check or letter</h3>
              <p className="mt-2 text-sm text-[var(--color-ink-soft)] leading-relaxed">
                If you&apos;d rather send something through the mail:
              </p>
              <p className="mt-2 text-sm font-mono bg-[var(--color-surface-2)] border border-[var(--color-line)] rounded-md px-3 py-2">
                {mailing}
              </p>
            </div>
          ) : null}

          <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
            <h3 className="text-lg font-bold tracking-tight">Pray for me</h3>
            <p className="mt-2 text-sm text-[var(--color-ink-soft)] leading-relaxed">
              For my mental health, for my family, for the work of telling the
              truth without burning out. Genesis 50:20 has carried me through.
            </p>
          </div>
        </div>
      </section>

      <p className="mt-10 text-[var(--color-muted)] italic">
        Thank you for showing up.
      </p>
    </article>
  );
}
