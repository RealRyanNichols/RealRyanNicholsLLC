import type { Metadata } from "next";
import Link from "next/link";
import { BookCtaBand } from "@/components/BookCtaBand";

// Donations are retired. /support stays because inbound links exist, but the
// page now sells: support the work by owning a piece of it — the book, a
// build, or something from the store. No gift rails, no "give" language.
const TITLE = "Support the work — own a piece of it";
const DESCRIPTION =
  "Ryan doesn't pass the hat. If the work matters to you, the way to support it is to own it: pre-order Fighting Shadows, hire him to build, or pick something up from the store.";

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
        Own a piece of it.
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[var(--color-ink-soft)]">
        This site doesn&apos;t take donations. Ryan sells what he builds — the
        book, the builds, the store. If the record matters to you, the way to
        keep it public is simple: buy something worth buying.
      </p>

      {/* Lead: the book */}
      <div className="mt-8">
        <BookCtaBand />
      </div>

      {/* The three ways to own it */}
      <section className="mt-10 grid gap-3 sm:grid-cols-3">
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
