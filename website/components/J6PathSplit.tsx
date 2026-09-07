import Link from "next/link";
import { getCaseTotals, getJ6DefendantCount } from "@/lib/case";

// The two doors of the January 6 files — and the only copy of them. One door
// to United States v. Nichols, one to every other defendant. Rendered on the
// /case front door, on every ?view= branch, and on /j6, so a reader is never
// more than one tap from the other side. Both numbers come from lib/case.ts
// (per-request memoized, so a host page that already fetched them pays for
// no second query); nothing here is typed by hand.
//
// `active` marks the door the reader is already behind with a "You are here"
// pill, which turns the split into the return rail. `headline` renders the
// front-door heading at the given level: "h1" where the split is the page's
// only heading, "h2" where the page carries its own h1 below.

export type J6Door = "ryan" | "everyone";

export async function J6PathSplit({
  active,
  headline,
  className = "",
}: {
  active?: J6Door;
  headline?: "h1" | "h2";
  className?: string;
}) {
  const [totals, defendants] = await Promise.all([
    getCaseTotals(),
    getJ6DefendantCount(),
  ]);
  const Heading = headline ?? "p";

  return (
    <section className={className} aria-label="Two ways into the January 6 files">
      {headline ? (
        <>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--color-accent)]">
            The January 6 Files
          </p>
          <Heading className="mt-2 font-display text-4xl font-black leading-[0.95] tracking-tight sm:text-6xl">
            Where do you
            <br />
            want to start?
          </Heading>
          <p className="mt-3 text-base font-semibold text-[var(--color-ink-soft)]">
            Two ways in. Both free, both public.
          </p>
        </>
      ) : (
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--color-navy)]">
          The January 6 Files · two ways in, both free, both public
        </p>
      )}

      {/* Both doors show on a phone: two columns from the smallest screen up.
          The descriptive line waits for sm so the numerals stay the story. */}
      <div className={`${headline ? "mt-7" : "mt-3"} grid grid-cols-2 gap-3 sm:gap-4`}>
        {/* Door 1 — the anchor case */}
        <Link
          href="/case/people/ryan-nichols"
          aria-current={active === "ryan" ? "location" : undefined}
          className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-[var(--color-navy)] p-4 text-[var(--color-paper)] transition hover:shadow-xl sm:p-7"
        >
          <div>
            {active === "ryan" ? <HerePill tone="navy" /> : null}
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-gold-bright)]">
              One man&rsquo;s case
            </p>
            <p className="mt-3 font-display text-3xl font-black leading-none tracking-tight text-[var(--color-gold-bright)] sm:text-5xl">
              {totals.daysDetained > 0
                ? totals.daysDetained.toLocaleString("en-US")
                : "—"}
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-paper)]/60 sm:text-xs">
              days, arrest to pardon
            </p>
            <p className="mt-4 hidden text-sm leading-snug text-[var(--color-paper)]/80 sm:block">
              The filings, the grievances, the {totals.facilities} facilities
              &mdash; and the judge who said it out loud.
            </p>
          </div>
          <span className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-black text-[var(--color-gold-bright)] sm:mt-6 sm:min-h-0">
            Read Ryan&rsquo;s case
            <span aria-hidden className="transition group-hover:translate-x-1">
              &rarr;
            </span>
          </span>
        </Link>

        {/* Door 2 — everyone else. A count of 0 means the query failed, and a
            failed query is shown as a dash, never as a number. */}
        <Link
          href="/j6"
          aria-current={active === "everyone" ? "location" : undefined}
          className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border-2 border-[var(--color-navy)]/25 bg-[var(--color-blue-soft)]/50 p-4 transition hover:border-[var(--color-navy)] hover:shadow-xl sm:p-7"
        >
          <div>
            {active === "everyone" ? <HerePill tone="cream" /> : null}
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-navy)]">
              Everyone else
            </p>
            <p className="mt-3 font-display text-3xl font-black leading-none tracking-tight text-[var(--color-ink)] sm:text-5xl">
              {defendants > 0 ? defendants.toLocaleString("en-US") : "—"}
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-muted)] sm:text-xs">
              defendants indexed
            </p>
            <p className="mt-4 hidden text-sm leading-snug text-[var(--color-ink-soft)] sm:block">
              Search every January 6 case on file. Find a name, claim a profile,
              or read the whole record.
            </p>
          </div>
          <span className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-black text-[var(--color-navy)] sm:mt-6 sm:min-h-0">
            Search the archive
            <span aria-hidden className="transition group-hover:translate-x-1">
              &rarr;
            </span>
          </span>
        </Link>
      </div>
    </section>
  );
}

// In flow, not absolutely positioned: at 390px each door is about 170px wide
// and a corner pill would sit on top of the eyebrow.
function HerePill({ tone }: { tone: "navy" | "cream" }) {
  return (
    <span
      className={[
        "mb-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider",
        tone === "navy"
          ? "bg-[var(--color-gold-bright)] text-[var(--color-navy)]"
          : "bg-[var(--color-navy)] text-[var(--color-paper)]",
      ].join(" ")}
    >
      You are here
    </span>
  );
}
