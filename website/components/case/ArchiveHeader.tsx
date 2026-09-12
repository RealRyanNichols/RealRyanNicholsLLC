import { Suspense } from "react";
import Link from "next/link";
import type { CasePerson, getCaseTotals } from "@/lib/case";
import { J6Banner } from "@/components/J6Banner";
import { J6PathSplit } from "@/components/J6PathSplit";
import { BookCtaBand } from "@/components/BookCtaBand";
import { CaseSearchForm } from "@/components/case/CaseSearchForm";
import type { Tab } from "@/components/case/archive";

// The header every archive view shares (/case?view=grievances|timeline|
// documents, and any search). Search-first: the box sits under the path
// split so a phone reader can search the record from the first screen, and
// a results page is results. With a query the header is the split, the box,
// and the hit count; the browse chrome (the eight numbers, the three doors,
// the lead case, the claim banner, the book, the tools hub) waits until the
// search is cleared.
export function ArchiveHeader({
  totals,
  eventsShown,
  peopleShown,
  ryan,
  ryanPhoto,
  tab,
  q,
  totalHits,
  counts,
}: {
  totals: Awaited<ReturnType<typeof getCaseTotals>>;
  eventsShown: number;
  peopleShown: number;
  ryan: CasePerson | null;
  ryanPhoto: string | null;
  tab: Tab;
  q: string;
  totalHits: number;
  // Hits per section for the current query, the same numbers the tab
  // strip shows. Spelled out under the box so a phone reader sees where
  // the matches are before the tabs.
  counts: { grievances: number; timeline: number; people: number; documents: number };
}) {
  const searching = q.length > 0;
  return (
    <header className="mb-10">
      {/* The one path split. These views are all United States v. Nichols,
          so Door 1 carries the "You are here" pill and Door 2 is the way
          out to every other defendant. */}
      <J6PathSplit active="ryan" headline="h1" />

      {/* Search */}
      <CaseSearchForm
        q={q}
        view={tab === "grievances" ? undefined : tab}
        className="mt-6"
      />
      {searching ? (
        <p className="mt-2 text-xs text-[var(--color-muted)]">
          <span className="font-bold text-[var(--color-ink)]">
            {totalHits.toLocaleString("en-US")} match{totalHits === 1 ? "" : "es"}
          </span>{" "}
          for &quot;{q}&quot;: {counts.grievances.toLocaleString("en-US")} grievances ·{" "}
          {counts.timeline.toLocaleString("en-US")} events ·{" "}
          {counts.people.toLocaleString("en-US")} people ·{" "}
          {counts.documents.toLocaleString("en-US")} documents.
        </p>
      ) : null}

      {searching ? null : (
        <>
      {/* One unified stat block — the four headline numbers, then the four
          secondary ones, adjacent. No buttons splitting them apart. */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl">
        <BigStat label="Days, arrest to pardon" value={totals.daysArrestToPardon.toLocaleString()} />
        <BigStat label="Grievances filed" value={String(totals.grievances)} />
        <BigStat label="Documents on file" value={String(totals.documents)} />
        <BigStat label="Co-detainees corroborating" value={String(totals.corroborators)} />
      </div>

      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-3xl">
        <SmallStat label="Events" value={eventsShown} />
        <SmallStat label="People named" value={peopleShown} />
        <SmallStat label="Facilities" value={totals.facilities} />
        <SmallStat
          label="Federal officers on record (IGP broken)"
          value={totals.igpBrokenFederalOfficers}
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/case/brief"
          className="btn-accent inline-flex min-h-11 items-center rounded-full px-5 py-2.5 text-sm font-bold"
        >
          Read the Compensation Brief →
        </Link>
        <Link
          href="/case/damages"
          className="inline-flex min-h-11 items-center rounded-full border border-[var(--color-navy)] bg-[var(--color-blue-soft)]/60 px-5 py-2.5 text-sm font-bold text-[var(--color-navy)] hover:opacity-90"
        >
          What it cost him — Damages →
        </Link>
        <Link
          href="/case/witnesses"
          className="inline-flex min-h-11 items-center rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-2.5 text-sm font-bold text-[var(--color-ink)] hover:border-[var(--color-navy)] hover:text-[var(--color-navy)]"
        >
          Wall of Corroborators →
        </Link>
      </div>

      {/* PILLAR 1 — THE LEAD CASE. Ryan's own file is the main story this
          whole archive is built on; surface it as the centerpiece with a
          direct path to his full profile, not a name buried in the list. */}
      {ryan ? (
        <Link
          href="/case/people/ryan-nichols"
          className="mt-6 block overflow-hidden rounded-2xl border-2 border-[var(--color-ink)] bg-[var(--color-surface)] hover:border-[var(--color-navy)] transition group"
        >
          <div className="flex flex-col sm:flex-row">
            {ryanPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={ryanPhoto}
                alt="Ryan Nichols"
                className="h-52 w-full flex-shrink-0 object-cover object-top sm:h-auto sm:w-48"
              />
            ) : null}
            <div className="flex-1 p-5 sm:p-6">
              <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-[var(--color-navy)]">
                The lead case · ✓ verified
              </p>
              <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight font-display">
                United States v. Nichols
              </h2>
              {/* Hard docket identifiers only. The pardon, the days, and the ten
                  facilities are already in the header above this card, so the
                  card carries the case-file facts and the link — not a re-telling. */}
              {/* Docket identifiers come from the database row only. If a
                  field is ever missing the page says so instead of typing
                  a value in — no count or number on this page is hardcoded. */}
              <p className="mt-2 text-xs sm:text-sm font-medium text-[var(--color-muted)]">
                Case No. {ryan.case_number ?? "NEEDS AUTHENTICATION"}
                {" · "}
                {ryan.court ?? "Court: NEEDS AUTHENTICATION"}
                {" · "}
                {ryan.charges?.length
                  ? `${ryan.charges.length} federal charges`
                  : "Charges: NEEDS AUTHENTICATION"}
                {ryan.judge_name ? ` · Judge ${ryan.judge_name}` : ""}
              </p>
              <p className="mt-2 text-sm sm:text-base text-[var(--color-ink-soft)] leading-relaxed">
                The case this whole archive was built on. Every filing, every named
                official, every document — the full record is on my file.
              </p>
              <span className="mt-3 inline-block text-sm font-bold text-[var(--color-navy)] group-hover:underline">
                Read my full case file →
              </span>
            </div>
          </div>
        </Link>
      ) : null}

      {/* PILLAR 2 — the claim CTA for every other defendant. The path
          split above is the door to the archive; this banner carries the
          unclaimed-profile count (public-record count from lib/case.ts). */}
      <div className="mt-6">
        {/* Belt and braces: if the count ever does suspend, it suspends
            inside a real boundary that hydrates cleanly. */}
        <Suspense fallback={null}>
          <J6Banner tone="navy" />
        </Suspense>
      </div>

      {/* The book. /case is by far the highest-traffic page on the site —
          on Aug 22 it took 475 of the 504 visitors X sent, while only 30
          reached /book/preorder, and 8 of those 30 bought. The archive was
          doing its job and then handing the reader nowhere to go. This is
          the same BookCtaBand already used on home, /support, /impact,
          /tools and every post, so the archive keeps its voice and the
          reader gets a door. */}
      <BookCtaBand className="mt-8" tone="case" />

      <p className="mt-3 text-xs text-[var(--color-muted)]">
        How this archive sources, labels, and corrects what it publishes —{" "}
        <Link
          href="/editorial-standards"
          className="font-bold text-[var(--color-navy)] hover:underline"
        >
          editorial standards →
        </Link>
      </p>

      {/* Explore-the-case hub — every tool with its function spelled out,
          so nothing is a mystery and Evidence stays front-and-center. */}
      <section className="mt-8">
        <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] font-bold mb-3">
          Explore this case
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <HubCard
            href="/case/the-salvaged-doj-record"
            title="Evidence the DOJ Tried to Erase"
            sub="The scrubbed federal record — preserved and hash-verified."
            featured
          />
          <HubCard
            href="/the-map-room"
            title="The Map Room — LIVE"
            sub="Who's reading the case right now, on a live world map."
          />
          <HubCard
            href="/case/officials"
            title="Accountability Index"
            sub="Everyone named in the record, grouped by agency."
          />
          <HubCard
            href="/case/nexus"
            title="The Nexus"
            sub="Force-directed graph of the co-defendant network."
          />
          <HubCard
            href="/case/timeline"
            title="The Timeline"
            sub="Every arrest and sentencing, month by month."
          />
          <HubCard
            href="/case/geography"
            title="The Geography"
            sub="Every J6 defendant plotted by home state."
          />
        </div>
      </section>
        </>
      )}
    </header>
  );
}

function BigStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
      <div className="text-3xl sm:text-4xl font-bold tracking-tight leading-none text-[var(--color-navy)]">
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-bold mt-2">
        {label}
      </div>
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-[var(--color-line)] px-2.5 py-1.5 text-[var(--color-ink-soft)]">
      <span className="text-sm font-bold text-[var(--color-ink)] mr-1.5">{value}</span>
      <span className="text-[10px] uppercase tracking-wider">{label}</span>
    </div>
  );
}

function HubCard({
  href,
  title,
  sub,
  featured,
}: {
  href: string;
  title: string;
  sub: string;
  featured?: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "block rounded-2xl border-2 p-4 transition group",
        featured
          ? "border-[var(--color-navy)] bg-[var(--color-blue-soft)]/60"
          : "border-[var(--color-line)] bg-[var(--color-surface)] hover:border-[var(--color-navy)]",
      ].join(" ")}
    >
      <p
        className={[
          "text-sm font-bold tracking-tight",
          featured
            ? "text-[var(--color-navy)]"
            : "text-[var(--color-ink)] group-hover:text-[var(--color-navy)]",
        ].join(" ")}
      >
        {title} <span aria-hidden>→</span>
      </p>
      <p className="mt-1 text-xs leading-snug text-[var(--color-ink-soft)]">{sub}</p>
    </Link>
  );
}
