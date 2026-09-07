import type { Metadata } from "next";
import Link from "next/link";
import { BookCtaBand } from "@/components/BookCtaBand";

// /support sells first (book, builds, store) and offers one narrow gift lane:
// the Token Fund at /fuel, which pays for the AI tokens that build the site
// and trades every tier for work. No floorless "give" rails.
const TITLE = "Support the work — fuel it or own a piece of it";
const DESCRIPTION =
  "Fuel the machine that builds this site, or own a piece of the work: the Token Fund, Fighting Shadows, a build, or the store.";

export const metadata: Metadata = {
  title: "Support the Work",
  description: DESCRIPTION,
  alternates: { canonical: "/support" },
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
  },
};

const WAYS = [
  {
    href: "/fuel",
    kicker: "The Token Fund",
    title: "Fuel the machine",
    body: "Every page here is built with AI tokens Ryan pays for. Buy the fuel and get work back: a question answered, a letter, an article on the topic you pick.",
    cta: "Fuel it →",
  },
  {
    href: "/book/preorder",
    kicker: "The book",
    title: "Pre-order Fighting Shadows",
    body: "The whole fight, in his own words — read it first. Every pre-order is a purchase, not a gift, and it's the single most direct way to put weight behind the work.",
    cta: "Pre-order now →",
  },
  {
    href: "/services",
    kicker: "Work with me",
    title: "Hire Ryan to build",
    body: "Sites, dashboards, evidence archives, investigations. You get real work on the same stack that runs this site; the work funds itself.",
    cta: "See the services →",
  },
  {
    href: "/store",
    kicker: "The store",
    title: "Buy from the store",
    body: "Tools and offers Ryan built and stands behind. You walk away with something you own.",
    cta: "Browse the store →",
  },
];

export default function SupportPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-accent)]">
        Support the work
      </p>
      <h1 className="mt-2 font-display text-4xl font-black tracking-tight sm:text-5xl">
        Fuel it, or own a piece of it.
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[var(--color-ink-soft)]">
        Ryan sells what he builds: the book, the builds, the store. And the
        machine that builds all of it runs on AI tokens he pays for. Put fuel
        in the tank and he puts work back in your hands.
      </p>

      <Link
        href="/fuel"
        className="mt-6 block rounded-2xl border-2 border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-5 transition hover:bg-[var(--color-accent)]/15 sm:p-6"
      >
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--color-accent)]">
          The Token Fund
        </p>
        <p className="mt-1 font-display text-2xl font-black tracking-tight text-[var(--color-ink)]">
          Fuel the machine. Get work back.
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-ink-soft)]">
          Under $50 fuels the machine and puts your name on the wall. $50 and up
          buys Ryan&apos;s time: a question answered in public, a letter in the
          mail, an article on the topic you pick. Every tier is a trade, and the
          bill is published.
        </p>
        <span className="mt-3 inline-block text-sm font-bold text-[var(--color-accent)]">See the tiers →</span>
      </Link>

      {/* Lead: the book */}
      <div className="mt-8">
        <BookCtaBand />
      </div>

      {/* The three ways to own it */}
      <section className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {WAYS.map((w) => (
          <Link
            key={w.href}
            href={w.href}
            className="group flex flex-col rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 transition hover:border-[var(--color-accent)]"
          >
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--color-accent)]">
              {w.kicker}
            </p>
            <h2 className="mt-1 text-lg font-bold tracking-tight text-[var(--color-ink)] transition group-hover:text-[var(--color-accent)]">
              {w.title}
            </h2>
            <p className="mt-1.5 flex-1 text-sm leading-relaxed text-[var(--color-ink-soft)]">
              {w.body}
            </p>
            <span className="mt-3 text-sm font-bold text-[var(--color-accent)]">
              {w.cta}
            </span>
          </Link>
        ))}
      </section>

      {/* Free ways that still matter */}
      <section className="mt-10 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 sm:p-6">
        <h2 className="text-sm font-black uppercase tracking-wider text-[var(--color-muted)]">
          Not buying today?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
          The free help counts too: put{" "}
          <Link href="/case" className="font-bold text-[var(--color-accent)] underline underline-offset-4">
            the record
          </Link>{" "}
          in front of one more person,{" "}
          <Link href="/submit" className="font-bold text-[var(--color-accent)] underline underline-offset-4">
            send a tip
          </Link>{" "}
          if you know something, or{" "}
          <Link href="/#join" className="font-bold text-[var(--color-accent)] underline underline-offset-4">
            join the email list
          </Link>{" "}
          so nothing here depends on an algorithm to reach you.
        </p>
      </section>
    </main>
  );
}
