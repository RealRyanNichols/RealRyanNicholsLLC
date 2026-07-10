import Link from "next/link";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata({
  title: "Start Here",
  description:
    "New here? This site does four jobs: preserve Ryan Nichols's record, help others document their own stories, publish evidence-driven investigations, and sell what he builds. Pick the door that fits why you came.",
  path: "/start-here",
});

const JOBS = [
  {
    n: "1",
    title: "Preserve the record",
    body: "Ryan was a January 6 defendant — pardoned, then pulled into a new fight back home. This site keeps the documents, the timeline, and the receipts in one place that can't be quietly deleted.",
  },
  {
    n: "2",
    title: "Help others document their stories",
    body: "If the system is doing to you what it did to him, you can get your account on the record here — anonymously if you need to. Every submission is reviewed before anything is published.",
  },
  {
    n: "3",
    title: "Publish evidence-driven investigations",
    body: "Not rumor. Court filings, public records, bodycam, and video — sourced and labeled so you can check it for yourself instead of taking anyone's word.",
  },
  {
    n: "4",
    title: "Sell what he builds",
    body: "No donations here. The book, the paid builds, and the store pay for the filings, records, gear, and time — buying something is what keeps the record public.",
  },
];

const CARDS = [
  {
    href: "/case",
    kicker: "Read",
    title: "Read the Case",
    body: "The timeline, the people, and the documents — the record itself.",
  },
  {
    href: "/tell-your-story",
    kicker: "Submit",
    title: "Submit a Story or Tip",
    body: "Get it off your chest. Anonymous is OK. Reviewed before anything goes public.",
  },
  {
    href: "/support",
    kicker: "Own",
    title: "Own a Piece of It",
    body: "The book, the builds, the store — support the work by buying it.",
  },
  {
    href: "/services",
    kicker: "Hire",
    title: "Hire Ryan",
    body: "Want a site like this one, or help fighting your own paperwork? Start here.",
  },
];

export default function StartHerePage() {
  return (
    <article className="mx-auto max-w-4xl px-4 py-12">
      {/* Hero */}
      <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-accent)]">
        New here
      </p>
      <h1 className="mt-2 font-display text-4xl font-black tracking-tight sm:text-5xl">
        Start Here
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[var(--color-ink-soft)]">
        This is Ryan Nichols&apos;s site. It does four jobs — pick the door that
        fits why you came, and you&apos;ll be where you need to be in a few
        seconds.
      </p>

      {/* CTAs above the fold */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/case"
          className="btn-accent rounded-full px-5 py-2.5 text-sm font-bold"
        >
          Read the Case
        </Link>
        <Link
          href="/book/preorder"
          className="btn-support rounded-full px-5 py-2.5 text-sm font-semibold"
        >
          Get the Book
        </Link>
      </div>

      {/* Four jobs */}
      <section className="mt-12">
        <h2 className="font-display text-2xl text-[var(--color-ink)]">
          What this site is for
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {JOBS.map((j) => (
            <div
              key={j.n}
              className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5"
            >
              <div className="flex items-baseline gap-2">
                <span className="font-display text-2xl font-black text-[var(--color-accent)]">
                  {j.n}
                </span>
                <h3 className="text-base font-bold text-[var(--color-ink)]">
                  {j.title}
                </h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                {j.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Four routing cards */}
      <section className="mt-12">
        <h2 className="font-display text-2xl text-[var(--color-ink)]">
          Pick your door
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {CARDS.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="group rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 transition hover:border-[var(--color-accent)]"
            >
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--color-accent)]">
                {c.kicker}
              </p>
              <h3 className="mt-1 text-lg font-bold tracking-tight text-[var(--color-ink)] transition group-hover:text-[var(--color-accent)]">
                {c.title} →
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                {c.body}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Trust note */}
      <section className="mt-12 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
        <h2 className="text-sm font-black uppercase tracking-wider text-[var(--color-muted)]">
          A note on what you&apos;ll read
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
          Some of what&apos;s here is{" "}
          <strong className="text-[var(--color-ink)]">personal testimony</strong>{" "}
          — Ryan&apos;s own account, in his own words. Some is{" "}
          <strong className="text-[var(--color-ink)]">documented evidence</strong>{" "}
          — court filings, public records, and video. They&apos;re labeled
          differently on purpose, so you always know which is which. And every
          story or tip the public sends in is{" "}
          <strong className="text-[var(--color-ink)]">
            reviewed before publication
          </strong>{" "}
          — submitting something does not put it online automatically.
        </p>
      </section>
    </article>
  );
}
