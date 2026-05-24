import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { getOgImage } from "@/lib/og-images";
import { DonateButtons } from "@/components/DonateButtons";

const DEFAULT_DESCRIPTION =
  "I'm spending my last dime building this so I — and every other J6 defendant — can get on our feet. If the work matters to you, here's how to help me keep going.";

export async function generateMetadata(): Promise<Metadata> {
  const override = await getOgImage("/support");
  const title = override?.title ?? "I'm asking for help";
  const description = override?.description ?? DEFAULT_DESCRIPTION;
  const url = `${SITE.url}/support`;
  const ogImageUrl = override?.image_url ?? null;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title,
      description,
      url,
      images: ogImageUrl
        ? [
            {
              url: ogImageUrl,
              width: override?.width ?? 1200,
              height: override?.height ?? 630,
              alt: title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: ogImageUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: ogImageUrl ? [ogImageUrl] : undefined,
    },
  };
}

export default function SupportPage() {
  const donateUrl = process.env.NEXT_PUBLIC_DONATION_URL;
  const supporterUrl = SITE.supporterUrl;
  const mailing = SITE.mailingAddress;

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
        An honest ask
      </p>
      <h1 className="mt-2 text-4xl sm:text-5xl font-bold tracking-tight leading-[1.05]">
        I&apos;m spending my last dime on this.
      </h1>

      <section className="prose-body mt-6 space-y-4">
        <p>
          I&apos;m putting everything I have left into this site so that I —
          and every other January 6 defendant — can get paid for what was
          done to us. Not handouts. A platform. A record. Profiles every
          J6er owns, free, forever, that no platform can throttle and no
          algorithm can bury.
        </p>
        <p>
          I need help sustaining right now.
        </p>
        <p>
          Prison messed me up. My brain does not function the same way it
          did before I went in for J6. There are days when reading a single
          paragraph takes me three tries. There are nights I can&apos;t sleep
          and days I can&apos;t get out of bed. They damaged me — extremely.
          I&apos;m not hiding it because hiding it is what they want.
        </p>
        <p>
          What I can still do is sit here and use the skills I&apos;ve got —
          investigation, coding, building, and getting <strong>attention</strong>
          {" "}that sustains — to expose evil people who hurt good ones. The
          DOJ scrubbed their own Capitol Breach Cases page. I salvaged it
          from the Wayback Machine and now realryannichols.com is the only
          public mirror of all 1,092 defendants on the list. That&apos;s
          one example of what your support pays for. There&apos;s more
          coming.
        </p>
        <p>
          I just need some help from supporters who want to see this
          continue. Every dollar goes directly to me. There&apos;s no
          organization, no middleman, no overhead. It pays for:
        </p>
        <ul>
          <li><strong>Rent</strong> and basic living expenses while I rebuild</li>
          <li><strong>Food</strong> for me and my family</li>
          <li><strong>Mental healthcare</strong> I need after pretrial detention</li>
          <li><strong>Medical care</strong> I can&apos;t afford without insurance</li>
          <li><strong>Hosting + tooling</strong> to keep the archive online and growing</li>
        </ul>
        <p>
          Thank you. I appreciate every bit of help I can get, and I will
          keep showing up here as long as you do.
        </p>
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
            Pick an amount. Any size moves the needle — rent, food, the mental
            healthcare, and the servers that keep this record online.
          </p>
          <DonateButtons donateUrl={donateUrl} />
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

      {/* Service offer — not a donation. A real exchange of value Ryan
          can deliver with the skills he still has. Distinct from the
          donate / supporter blocks above; positioned as its own offer
          card with a clear price and warranty so nobody confuses it
          with the J6 case work, which stays free forever. */}
      <section className="mt-10 rounded-2xl border-2 border-[var(--color-blue)] bg-[var(--color-blue-soft)] p-6 sm:p-8 relative overflow-hidden">
        <div
          className="pointer-events-none absolute -top-24 -left-24 h-56 w-56 rounded-full blur-3xl"
          style={{ background: "var(--color-blue-glow, rgba(59,130,246,0.25))" }}
          aria-hidden
        />
        <p className="relative text-xs uppercase tracking-wider text-[var(--color-blue)] font-bold">
          Hire me · $997
        </p>
        <h2 className="relative font-display text-2xl sm:text-3xl mt-2 text-[var(--color-ink)]">
          Want a site like this one? I&apos;ll build you yours.
        </h2>
        <p className="relative mt-3 text-[var(--color-ink-soft)] leading-relaxed">
          A personal &ldquo;social media&rdquo; site — your own feed, your
          own profile, your own domain, your own audience. Built the same
          way I built mine: fast, on your own terms, no algorithm in the
          middle, no platform that can ban you for telling the truth.
        </p>
        <ul className="relative mt-4 space-y-2 text-sm text-[var(--color-ink-soft)] leading-relaxed">
          <li><strong>$997</strong> one-time, flat fee for the initial build.</li>
          <li>I run it for <strong>30 days</strong> while you learn the ropes.</li>
          <li>After 30 days I <strong>hand it to you</strong> — code, domain access, database, everything. <strong>100% yours.</strong></li>
          <li>It comes with a <strong>warranty</strong>. If something I built breaks in normal use, I fix it.</li>
        </ul>
        <p className="relative mt-4 text-xs text-[var(--color-muted)]">
          Important: this is separate from the J6 work. <strong>J6 case
          profiles on realryannichols.com are free forever</strong> — every
          J6 defendant gets one linked to their case, no payment, no
          subscription, no catch. This $997 offer is for people who want
          a full <em>replica</em> of this site for themselves.
        </p>
        <a
          href="mailto:ryan@realryannichols.com?subject=Website%20build%20inquiry%20(%24997%20replica)&body=Hi%20Ryan%2C%0A%0AI%27d%20like%20a%20site%20like%20realryannichols.com.%20A%20bit%20about%20me%2Fwhat%20I%20want%20to%20publish%3A%0A%0A"
          className="relative inline-flex items-center mt-5 rounded-full border-2 border-[var(--color-blue)] bg-[var(--color-blue)] text-[var(--color-paper)] px-6 py-3 text-sm font-bold hover:bg-[var(--color-blue-strong)] transition"
        >
          Email me about a build →
        </a>
      </section>

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
