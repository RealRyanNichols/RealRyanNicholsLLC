import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { J6Banner } from "@/components/J6Banner";
import {
  getGrievances,
  getPeople,
  getPersonBySlug,
  getEvents,
  getDocuments,
  getCaseTotals,
  getJ6ClaimCounts,
  getJ6PeoplePage,
} from "@/lib/case";
import { getSiteSettings } from "@/lib/site-settings";
import { getOgImage, canonicalPath } from "@/lib/og-images";
import { SITE } from "@/lib/site";

export const revalidate = 300;

const CASE_TITLE = "The J6 Case · United States v. Nichols & every defendant who joins";
const CASE_DESCRIPTION =
  "The master January 6 case archive. Starts with United States v. Nichols — every filed grievance, every named official, every event, every document. Other J6 defendants are joining and stacking their cases in. The full record, in public, free.";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; q?: string; filter?: string }>;
}): Promise<Metadata> {
  const sp = await searchParams;
  // Strip the search query from the canonical OG lookup — q is user input
  // and won't have a configured OG image. View/filter are part of the URL
  // shape that matters for share cards.
  const lookupParams: Record<string, string | undefined> = {};
  if (sp.view) lookupParams.view = sp.view;
  if (sp.filter) lookupParams.filter = sp.filter;
  const canonical = canonicalPath("/case", lookupParams);
  const override = await getOgImage(canonical);

  const settings = await getSiteSettings();
  const fallbackOg = settings.case_og_url ?? `${SITE.url}/og/case-default.png`;
  const ogImageUrl = override?.image_url ?? (settings.case_og_url ? fallbackOg : null);

  const title = override?.title ?? "The J6 Case";
  const description = override?.description ?? CASE_DESCRIPTION;
  const fullTitle = override?.title ?? CASE_TITLE;
  const canonicalUrl = `${SITE.url}${canonical}`;

  return {
    title,
    description,
    openGraph: {
      type: "article",
      title: fullTitle,
      description,
      url: canonicalUrl,
      images: ogImageUrl
        ? [
            {
              url: ogImageUrl,
              width: override?.width ?? 1200,
              height: override?.height ?? 630,
              alt: fullTitle,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: ogImageUrl ? [ogImageUrl] : undefined,
    },
    alternates: { canonical: canonicalUrl },
  };
}

type Tab = "grievances" | "timeline" | "people" | "documents";

function matchesQuery(q: string, ...fields: (string | null | undefined)[]) {
  if (!q) return true;
  const needle = q.toLowerCase();
  return fields.some((f) => (f ?? "").toLowerCase().includes(needle));
}

export default async function CasePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; q?: string; filter?: string; page?: string }>;
}) {
  const { view, q: rawQ, filter: rawFilter, page: rawPage } = await searchParams;
  const q = (rawQ ?? "").trim();
  const page = Math.max(1, Number.parseInt(rawPage ?? "1", 10) || 1);
  const tab: Tab =
    view === "timeline" || view === "people" || view === "documents"
      ? (view as Tab)
      : "grievances";
  const j6Filter: "all" | "unclaimed" | "verified" | "pending" =
    rawFilter === "unclaimed" ||
    rawFilter === "verified" ||
    rawFilter === "pending"
      ? rawFilter
      : "all";
  const isJ6ClaimDirectory = tab === "people" && j6Filter !== "all";

  if (isJ6ClaimDirectory) {
    const [j6Page, j6Counts] = await Promise.all([
      getJ6PeoplePage({ claimStatus: j6Filter, q, page, pageSize: 120 }),
      getJ6ClaimCounts(),
    ]);

    const pageCount = Math.max(1, Math.ceil(j6Page.total / j6Page.pageSize));
    const clampedPage = Math.min(j6Page.page, pageCount);

    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <header className="mb-10">
          <J6ClaimDirectoryHero counts={j6Counts} activeFilter={j6Filter} />

          <form
            method="get"
            action="/case"
            className="mt-6 flex flex-col gap-2 sm:flex-row"
          >
            <input type="hidden" name="view" value="people" />
            <input type="hidden" name="filter" value={j6Filter} />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search name, case number, or role..."
              className="min-h-12 flex-1 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 text-sm"
            />
            <button
              type="submit"
              className="btn-accent min-h-12 rounded-xl px-5 text-sm font-black"
            >
              Search
            </button>
            {q ? (
              <Link
                href={`/case?view=people&filter=${j6Filter}`}
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 text-sm font-bold text-[var(--color-ink-soft)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              >
                Clear
              </Link>
            ) : null}
          </form>
          {q ? (
            <p className="mt-2 text-xs text-[var(--color-muted)]">
              {j6Page.total.toLocaleString()} match
              {j6Page.total === 1 ? "" : "es"} for &quot;{q}&quot; in this J6
              profile bucket.
            </p>
          ) : null}
        </header>

        <div className="mb-8 flex flex-wrap items-end justify-between gap-3 border-b border-[var(--color-line)]">
          <nav className="flex flex-wrap gap-1" aria-label="Case view">
            <TabLink active={false} href="/case?view=grievances">
              Grievances
            </TabLink>
            <TabLink active={false} href="/case?view=timeline">
              Timeline
            </TabLink>
            <TabLink active href={`/case?view=people&filter=${j6Filter}`}>
              People
            </TabLink>
            <TabLink active={false} href="/case?view=documents">
              Documents
            </TabLink>
          </nav>
          <div className="mb-1 flex items-center gap-2">
            <Link
              href="/case/nexus"
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#1f2f55] bg-[#0a1429] px-3.5 py-1.5 text-xs font-bold text-[#cfd9ea] transition hover:border-[#7fe3a9] hover:text-[#7fe3a9]"
            >
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#7fe3a9]" aria-hidden />
              View as graph
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>

        <PeopleView
          people={j6Page.people}
          j6Filter={j6Filter}
          q={q}
          totalCount={j6Page.total}
          page={clampedPage}
          pageSize={j6Page.pageSize}
        />
      </div>
    );
  }

  const [grievances, people, events, documents, totals, siteSettings] = await Promise.all([
    getGrievances(),
    tab === "people" || q ? getPeople() : getPersonBySlug("ryan-nichols").then((p) => (p ? [p] : [])),
    getEvents(),
    getDocuments(),
    getCaseTotals(),
    getSiteSettings(),
  ]);
  const ryan = people.find((p) => p.slug === "ryan-nichols") ?? null;
  const ryanPhoto = siteSettings.avatar_url ?? null;

  const filteredGrievances = q
    ? grievances.filter((g) =>
        matchesQuery(q, g.title, g.summary, g.body, g.category)
      )
    : grievances;
  const filteredPeopleByQ = q
    ? people.filter((p) =>
        matchesQuery(q, p.name, p.role, p.agency, p.description)
      )
    : people;
  const filteredPeople =
    j6Filter === "all"
      ? filteredPeopleByQ
      : filteredPeopleByQ.filter(
          (p) => p.is_j6_defendant && p.claim_status === j6Filter,
        );
  const filteredEvents = q
    ? events.filter((e) =>
        matchesQuery(q, e.title, e.description, e.location)
      )
    : events;
  const filteredDocuments = q
    ? documents.filter((d) =>
        matchesQuery(q, d.title, d.description, d.doc_type, d.source)
      )
    : documents;

  const totalHits = q
    ? filteredGrievances.length +
      filteredPeople.length +
      filteredEvents.length +
      filteredDocuments.length
    : 0;
  const j6People = people.filter((p) => p.is_j6_defendant);
  const j6Counts = {
    total: j6People.length,
    unclaimed: j6People.filter((p) => p.claim_status === "unclaimed").length,
    verified: j6People.filter((p) => p.claim_status === "verified").length,
    pending: j6People.filter((p) => p.claim_status === "pending").length,
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-10">
        {isJ6ClaimDirectory ? (
          <J6ClaimDirectoryHero counts={j6Counts} activeFilter={j6Filter} />
        ) : (
          <>
        <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
          The case · United States v. Nichols
        </p>
        <h1 className="mt-2 text-4xl sm:text-6xl font-bold tracking-tight leading-[1.02]">
          {totals.daysDetained.toLocaleString()} days. Ten facilities. Full presidential pardon. Charges dismissed with prejudice.
        </h1>
        <p className="mt-4 text-base sm:text-lg text-[var(--color-ink-soft)] max-w-3xl leading-relaxed">
          Ryan Nichols — United States Marine Corps veteran, founder of Wholesale Universe, Inc.
          (a multi-million-dollar wholesale/retail company), Texas Search and Rescue specialist,
          father. Convicted under the previous administration. <strong>Pardoned by President Trump
          on January 20, 2025.</strong> Charges <strong>dismissed with prejudice</strong> by U.S.
          Attorney Edward R. Martin Jr. — the case cannot be brought again. This is the documented
          record of what the previous administration did to him in the years between — and what
          it cost him.
        </p>

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl">
          <BigStat label="Days detained" value={totals.daysDetained.toLocaleString()} />
          <BigStat label="Grievances filed" value={String(totals.grievances)} />
          <BigStat label="Documents on file" value={String(totals.documents)} />
          <BigStat label="Co-detainees corroborating" value={String(totals.corroborators)} />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/case/brief"
            className="btn-accent inline-flex items-center rounded-full px-5 py-2.5 text-sm font-bold"
          >
            Read the Compensation Brief →
          </Link>
          <Link
            href="/case/damages"
            className="inline-flex items-center rounded-full border border-[var(--color-accent)] bg-[var(--color-accent-soft)] px-5 py-2.5 text-sm font-bold text-[var(--color-accent)] hover:opacity-90"
          >
            What it cost him — Damages →
          </Link>
          <Link
            href="/case/witnesses"
            className="inline-flex items-center rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-2.5 text-sm font-bold text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            Wall of Corroborators →
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-2xl">
          <SmallStat label="Events" value={q ? filteredEvents.length : events.length} />
          <SmallStat label="People named" value={q ? filteredPeople.length : totals.people} />
          <SmallStat label="Facilities" value={totals.facilities} />
          <SmallStat label="Federal officers on record (IGP broken)" value={2} />
        </div>

        {/* PILLAR 1 — THE LEAD CASE. Ryan's own file is the main story this
            whole archive is built on; surface it as the centerpiece with a
            direct path to his full profile, not a name buried in the list. */}
        {ryan ? (
          <Link
            href="/case/people/ryan-nichols"
            className="mt-6 block overflow-hidden rounded-2xl border-2 border-[var(--color-ink)] bg-[var(--color-surface)] hover:border-[var(--color-accent)] transition group"
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
                <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-[var(--color-accent)]">
                  The lead case · ✓ verified
                </p>
                <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight font-display">
                  United States v. Nichols
                </h2>
                {/* Hard docket identifiers only. The pardon, the days, and the ten
                    facilities are already in the header above this card, so the
                    card carries the case-file facts and the link — not a re-telling. */}
                <p className="mt-2 text-xs sm:text-sm font-medium text-[var(--color-muted)]">
                  Case No. {ryan.case_number ?? "1:21-cr-117"}
                  {" · "}
                  {ryan.court ?? "U.S. District Court for the District of Columbia"}
                  {" · "}
                  {ryan.charges?.length ?? 10} federal charges
                  {ryan.judge_name ? ` · Judge ${ryan.judge_name}` : ""}
                </p>
                <p className="mt-2 text-sm sm:text-base text-[var(--color-ink-soft)] leading-relaxed">
                  The case this whole archive was built on. Every filing, every named
                  official, every document — the full record is on my file.
                </p>
                <span className="mt-3 inline-block text-sm font-bold text-[var(--color-accent)] group-hover:underline">
                  Read my full case file →
                </span>
              </div>
            </div>
          </Link>
        ) : null}

        {/* PILLAR 2 — every other defendant. Front door to the full directory. */}
        <Link
          href="/case?view=people&filter=unclaimed"
          className="mt-6 flex items-center justify-between gap-4 rounded-2xl border-2 border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-5 hover:bg-[var(--color-accent)] transition group"
        >
          <div>
            <p className="text-xs uppercase tracking-wider font-bold text-[var(--color-accent)] group-hover:text-[var(--color-paper)]">
              Every other defendant
            </p>
            <p className="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-ink)] group-hover:text-[var(--color-paper)]">
              Browse all J6 defendants →
            </p>
            <p className="mt-1 text-sm text-[var(--color-ink-soft)] group-hover:text-[var(--color-paper)]">
              {people.filter((p) => p.is_j6_defendant).length.toLocaleString()}{" "}
              defendant profiles on record. Find a name, claim a profile, build a
              case.
            </p>
          </div>
          <span
            aria-hidden
            className="text-3xl font-bold flex-shrink-0 text-[var(--color-accent)] group-hover:text-[var(--color-paper)]"
          >
            →
          </span>
        </Link>

        {/* PILLAR 3 — the overall J6 story, on its own: the collective record
            beyond any single defendant. */}
        <div className="mt-10">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)] font-bold mb-3">
            The overall J6 story
          </p>
          <J6Banner />
        </div>

        {/* Explore-the-case hub — every tool with its function spelled out,
            so nothing is a mystery and Evidence stays front-and-center. */}
        <section className="mt-8">
          <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] font-bold mb-3">
            Explore this case
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <HubCard
              href="/evidence-the-doj-tried-to-erase"
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

        {/* Search */}
        <form
          method="get"
          action="/case"
          className="mt-6 flex flex-col sm:flex-row gap-2 max-w-2xl"
        >
          {tab !== "grievances" ? (
            <input type="hidden" name="view" value={tab} />
          ) : null}
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search grievances, people, events, documents…"
            className="flex-1 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="btn-accent rounded-md px-4 py-2 text-sm font-bold"
          >
            Search
          </button>
          {q ? (
            <Link
              href={`/case${tab === "grievances" ? "" : `?view=${tab}`}`}
              className="inline-flex items-center justify-center rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-ink-soft)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
              Clear
            </Link>
          ) : null}
        </form>
        {q ? (
          <p className="mt-2 text-xs text-[var(--color-muted)]">
            {totalHits} match{totalHits === 1 ? "" : "es"} for &quot;{q}&quot; across all 4 sections.
          </p>
        ) : null}
      </header>

      <div className="flex items-end justify-between gap-3 flex-wrap border-b border-[var(--color-line)] mb-8">
        <nav
          className="flex flex-wrap gap-1"
          aria-label="Case view"
        >
          <TabLink active={tab === "grievances"} href={`/case?view=grievances${q ? `&q=${encodeURIComponent(q)}` : ""}`}>
            Grievances {q ? `(${filteredGrievances.length})` : ""}
          </TabLink>
          <TabLink active={tab === "timeline"} href={`/case?view=timeline${q ? `&q=${encodeURIComponent(q)}` : ""}`}>
            Timeline {q ? `(${filteredEvents.length})` : ""}
          </TabLink>
          <TabLink active={tab === "people"} href={`/case?view=people${q ? `&q=${encodeURIComponent(q)}` : ""}`}>
            People {q ? `(${filteredPeople.length})` : ""}
          </TabLink>
          <TabLink active={tab === "documents"} href={`/case?view=documents${q ? `&q=${encodeURIComponent(q)}` : ""}`}>
            Documents {q ? `(${filteredDocuments.length})` : ""}
          </TabLink>
        </nav>
        <div className="mb-1 flex items-center gap-2">
          <Link
            href="/case/officials"
            className="inline-flex items-center gap-1.5 rounded-full border-2 border-[var(--color-accent)] bg-[var(--color-accent-soft)] px-3.5 py-1.5 text-xs font-bold text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-[var(--color-paper)] transition"
          >
            Who&apos;s named
            <span aria-hidden>→</span>
          </Link>
          <Link
            href="/case/nexus"
            className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#1f2f55] bg-[#0a1429] px-3.5 py-1.5 text-xs font-bold text-[#cfd9ea] hover:border-[#7fe3a9] hover:text-[#7fe3a9] transition"
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#7fe3a9] animate-pulse" aria-hidden />
            View as graph
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>

      {tab === "grievances" && <GrievancesView grievances={filteredGrievances} />}
      {tab === "timeline" && <TimelineView events={filteredEvents} />}
      {tab === "people" && (
        <PeopleView people={filteredPeople} j6Filter={j6Filter} q={q} />
      )}
      {tab === "documents" && <DocumentsView documents={filteredDocuments} />}
    </div>
  );
}

function BigStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
      <div className="text-3xl sm:text-4xl font-bold tracking-tight leading-none text-[var(--color-accent)]">
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

function J6ClaimDirectoryHero({
  counts,
  activeFilter,
}: {
  counts: { total: number; unclaimed: number; verified: number; pending: number };
  activeFilter: "unclaimed" | "verified" | "pending";
}) {
  const isUnclaimed = activeFilter === "unclaimed";
  const kicker =
    activeFilter === "verified"
      ? "Verified defendants"
      : activeFilter === "pending"
        ? "Claims under review"
        : "J6 defendants · get in here";
  const title =
    activeFilter === "verified"
      ? "These J6 defendants are already building their public record."
      : activeFilter === "pending"
        ? "These claims are waiting on verification."
        : "If you have the facts and evidence, build your case here.";
  const lead =
    activeFilter === "verified"
      ? "A verified profile becomes a living case file: testimony, court documents, photos, videos, links, dates, witnesses, and updates in one place."
      : activeFilter === "pending"
        ? "Claims do not go public until Ryan verifies the person against the docket and public record. That protects the defendants and keeps the archive credible."
        : "Every J6 defendant should have a place to organize what happened in plain English. Find your name, claim your profile, and start turning scattered facts into a record people can inspect.";

  return (
    <section className="overflow-hidden rounded-2xl border-2 border-[#1f2f55] bg-[#071123] text-[#fdf8ea] shadow-2xl">
      <div className="grid gap-px bg-white/10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="bg-[#071123] p-5 sm:p-7">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#7fe3a9]">
            {kicker}
          </p>
          <h1 className="mt-3 text-3xl font-black leading-[1.02] tracking-tight text-[#fdf8ea] sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#cfd9ea] sm:text-lg">
            {lead}
          </p>

          {isUnclaimed ? (
            <div className="mt-5 rounded-xl border border-[#7fe3a9]/30 bg-[#7fe3a9]/10 p-4">
              <p className="text-sm font-black uppercase tracking-wider text-[#7fe3a9]">
                What you can add after verification
              </p>
              <div className="mt-3 grid gap-2 text-sm text-[#fdf8ea] sm:grid-cols-2">
                {[
                  "Your timeline",
                  "Court filings",
                  "Photos and videos",
                  "Witness statements",
                  "Jail / medical records",
                  "Missing evidence requests",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#7fe3a9]" aria-hidden />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Link
              href="#j6-profile-list"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#7fe3a9] px-5 py-3 text-sm font-black uppercase tracking-wider text-[#071123] transition hover:bg-[#a7efc4]"
            >
              Find your name
            </Link>
            <Link
              href="/submit?type=j6"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#7fa9e3]/60 bg-[#7fa9e3]/10 px-5 py-3 text-sm font-black uppercase tracking-wider text-[#dce8ff] transition hover:bg-[#7fa9e3] hover:text-[#071123]"
            >
              Send evidence or a lead
            </Link>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-[#9fb0ca]">
            This is not a law firm and not legal advice. It is an evidence-first
            public-record and case-organization system. Private details stay
            private until they are safe and approved to publish.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-px bg-white/10 sm:grid-cols-4 lg:grid-cols-2">
          <J6HeroStat label="Total J6 profiles" value={counts.total} tone="blue" />
          <J6HeroStat label="Ready to claim" value={counts.unclaimed} tone="gold" />
          <J6HeroStat label="Verified" value={counts.verified} tone="green" />
          <J6HeroStat label="Under review" value={counts.pending} tone="blue" />
        </div>
      </div>
    </section>
  );
}

function J6HeroStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "green" | "gold" | "blue";
}) {
  const color =
    tone === "green" ? "text-[#7fe3a9]" : tone === "gold" ? "text-[#e4c66a]" : "text-[#7fa9e3]";
  return (
    <div className="bg-[#0d1a33] p-4 sm:p-5">
      <div className={`font-mono text-3xl font-black leading-none tabular-nums ${color}`}>
        {value.toLocaleString()}
      </div>
      <div className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#cfd9ea]">
        {label}
      </div>
    </div>
  );
}

function TabLink({
  active,
  href,
  children,
}: {
  active: boolean;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={[
        "px-4 py-2.5 -mb-px border-b-2 text-sm font-semibold transition",
        active
          ? "border-[var(--color-accent)] text-[var(--color-ink)]"
          : "border-transparent text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

function SeverityDots({ severity }: { severity: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`Severity ${severity} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={[
            "h-1.5 w-1.5 rounded-full",
            i <= severity
              ? "bg-[var(--color-accent)]"
              : "bg-[var(--color-line)]",
          ].join(" ")}
        />
      ))}
    </span>
  );
}

const NARRATIVE_ACTS: { range: [number, number]; label: string; tag: string; lead: string }[] = [
  {
    range: [1, 7],
    label: "Act I — Five Pillars of Weaponization",
    tag: "Most severe",
    lead: "Constitutional rights, the grievance system used to silence them, denial of mental-health care, solitary, water cut as punishment, officer violence, and chemical agents deployed inside a sealed pod.",
  },
  {
    range: [8, 12],
    label: "Act II — Sixth Amendment / Defense Crippled",
    tag: "Right to counsel & evidence",
    lead: "Brady evidence withheld. Discovery withheld. Legal mail confiscated. Attorney access denied. The constitutional preconditions for any fair trial — denied. The lead grievance: AUSA Brasher's pre-plea denials of Marcus DiPaola's FBI ties, contradicted by Marcus's own public-record self-admission a year and a half after sentencing.",
  },
  {
    range: [13, 20],
    label: "Act III — Cruel and Unusual Conditions",
    tag: "Day-to-day brutality",
    lead: "Rotten food, foreign objects in trays, denied restroom access, denied hygiene, no air conditioning, recreation time cut, untreated injuries, commissary stolen.",
  },
  {
    range: [21, 23],
    label: "Act IV — Healthcare Denial",
    tag: "Pandemic-era neglect",
    lead: "COVID outbreak in the pod, testing denied, vaccine coerced as condition of court access.",
  },
  {
    range: [24, 28],
    label: "Act V — Discrimination and Family Punishment",
    tag: "Targeted, personal",
    lead: "Racial remarks from staff, a discriminatory email from Major Marr, religious services blocked, video visits and family mail denied.",
  },
  {
    range: [29, 32],
    label: "Act VI — The Pattern Across Facilities",
    tag: "Ten different facilities",
    lead: "Ryan was cycled through ten different facilities — Tyler (E.D. Tex.), Oklahoma transit, NW3 quarantine, DC DOC CTF, Rappahannock Regional Jail, Northern Neck Regional Jail, FDC Houston, Florence, Albany Jail, and post-sentence BOP. The same pattern of denied medical care, denied legal access, denied family contact, and a broken grievance system followed him at every stop. The IGP-broken finding has U.S. Marshals and a DC DOC Chief on the record.",
  },
  {
    range: [33, 34],
    label: "Act VII — The Damage Inflicted",
    tag: "What it cost him",
    lead: "Years of pretrial detention, denied family visits, intercepted mail, transfers without notice — the prosecution did not just deprive Ryan of his liberty. It destroyed his marriage, took him out of his children's daily lives, and ended the multi-million-dollar wholesale/retail company he built from the ground up. This is the harm the Anti-Weaponization Fund exists to remedy.",
  },
];

function GrievancesView({ grievances }: { grievances: Awaited<ReturnType<typeof getGrievances>> }) {
  const groups = NARRATIVE_ACTS.map((act) => ({
    ...act,
    items: grievances.filter((g) => g.display_order >= act.range[0] && g.display_order <= act.range[1]),
  }));
  return (
    <div className="space-y-10">
      {groups.map((act) =>
        act.items.length === 0 ? null : (
          <section key={act.label}>
            <div className="border-l-2 border-[var(--color-accent)] pl-4 mb-4">
              <p className="text-[10px] uppercase tracking-wider text-[var(--color-accent)] font-bold">
                {act.tag}
              </p>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight">{act.label}</h2>
              <p className="text-sm text-[var(--color-ink-soft)] mt-1 max-w-2xl leading-relaxed">
                {act.lead}
              </p>
            </div>
            <div className="space-y-3">
              {act.items.map((g) => (
                <Link
                  key={g.id}
                  href={`/case/grievances/${g.slug}`}
                  className="block group rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] hover:border-[var(--color-accent)] transition p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <SeverityDots severity={g.severity} />
                        {g.category ? (
                          <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-semibold">
                            {g.category}
                          </span>
                        ) : null}
                      </div>
                      <h3 className="text-lg font-bold tracking-tight">
                        <span className="text-[var(--color-accent)] mr-2">#{g.display_order}</span>
                        {g.title}
                      </h3>
                      {g.summary ? (
                        <p className="mt-2 text-sm text-[var(--color-ink-soft)] leading-relaxed">
                          {g.summary}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className="text-2xl font-bold leading-none">{g.count}</div>
                      <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mt-1">
                        filings
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ),
      )}
    </div>
  );
}

function TimelineView({ events }: { events: Awaited<ReturnType<typeof getEvents>> }) {
  return (
    <ol className="space-y-0">
      {events.map((e) => (
        <li key={e.id} className="relative pl-8 pb-8 border-l border-[var(--color-line)] last:border-l-0">
          <span
            className="absolute -left-[7px] top-1 h-3.5 w-3.5 rounded-full bg-[var(--color-accent)] ring-4 ring-[var(--color-paper)]"
            aria-hidden
          />
          <Link href={`/case/events/${e.slug}`} className="group block">
            <time className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
              {e.event_date ? format(new Date(e.event_date), "MMMM d, yyyy") : "Date pending verification"}
            </time>
            <h2 className="mt-1 text-lg font-bold tracking-tight group-hover:text-[var(--color-accent)] transition">
              {e.title}
            </h2>
            {e.description ? (
              <p className="mt-2 text-sm text-[var(--color-ink-soft)] leading-relaxed max-w-2xl">
                {e.description}
              </p>
            ) : null}
            {e.location ? (
              <p className="mt-1 text-xs text-[var(--color-muted)]">📍 {e.location}</p>
            ) : null}
          </Link>
        </li>
      ))}
    </ol>
  );
}

const PEOPLE_GROUPS: { label: string; match: (agency: string | null) => boolean; lead: string }[] = [
  {
    label: "Executive",
    match: (a) => !!a && /^executive/i.test(a),
    lead: "The Presidential pardon and the Anti-Weaponization Fund originate here.",
  },
  {
    label: "Judiciary",
    match: (a) => !!a && /district court/i.test(a),
    lead: "Federal judges who presided over the case and were the subject of defense motions.",
  },
  {
    label: "Prosecution",
    match: (a) => !!a && /u\.?s\.? attorney/i.test(a),
    lead: "Federal prosecutors of record in United States v. Nichols.",
  },
  {
    label: "Defense Counsel",
    match: (a) => !!a && /private counsel/i.test(a),
    lead: "Defense attorneys representing Ryan and other January 6 defendants.",
  },
  {
    label: "Capitol Police / MPD (January 6)",
    match: (a) => !!a && /capitol police|mpd/i.test(a),
    lead: "Officers from the events at the U.S. Capitol on January 6, 2021 — named in the bodycam discovery record.",
  },
  {
    label: "DC DOC / Detention Staff",
    match: (a) => !!a && /(dc doc|doc medical|igp)/i.test(a),
    lead: "Detention staff named in the documented grievances.",
  },
  {
    label: "Rappahannock & Northern Neck",
    match: (a) => !!a && /(rappahannock|northern neck)/i.test(a),
    lead: "Staff at the second and third facilities Ryan was moved through after the unannounced September 2022 transfer.",
  },
  {
    label: "U.S. Marshals",
    match: (a) => !!a && /marshals/i.test(a),
    lead: "Federal officers tied to specific incidents inside the facilities — including the witness statement acknowledging the IGP is broken.",
  },
  {
    label: "Co-defendants & Fellow Detainees",
    match: (a) => !!a && /(c-2b|^dc doc$|harkrider|defend|j6 detainee|sibick witness)/i.test(a),
    lead: "Co-defendants on the indictment and detainees who signed witness statements.",
  },
  {
    label: "January 6 Capitol Crowd",
    match: (a) => !!a && /january 6 capitol crowd/i.test(a),
    lead: "Civilian figures from the Capitol events on January 6.",
  },
  {
    label: "Family",
    match: (a) => !!a && /family/i.test(a),
    lead: "Family members directly affected.",
  },
];

function PeopleView({
  people,
  j6Filter,
  q,
  totalCount,
  page,
  pageSize,
}: {
  people: Awaited<ReturnType<typeof getPeople>>;
  j6Filter: "all" | "unclaimed" | "verified" | "pending";
  q: string;
  totalCount?: number;
  page?: number;
  pageSize?: number;
}) {
  // J6 filter mode: flat alphabetical list, all J6 defendants matching the
  // selected claim status. Skips the agency-group treatment entirely.
  if (j6Filter !== "all") {
    return (
      <J6DefendantsView
        people={people}
        j6Filter={j6Filter}
        q={q}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
      />
    );
  }

  const assigned = new Set<string>();
  const groups = PEOPLE_GROUPS.map((g) => {
    const items = people.filter((p) => {
      if (assigned.has(p.id)) return false;
      if (g.match(p.agency)) {
        assigned.add(p.id);
        return true;
      }
      return false;
    });
    return { ...g, items };
  });
  const rest = people.filter((p) => !assigned.has(p.id));
  return (
    <div className="space-y-10">
      {groups.map((group) =>
        group.items.length === 0 ? null : (
          <section key={group.label}>
            <div className="border-l-2 border-[var(--color-accent)] pl-4 mb-4">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight">{group.label}</h2>
              <p className="text-sm text-[var(--color-ink-soft)] mt-1 max-w-2xl leading-relaxed">
                {group.lead}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {group.items.map((p) => (
                <Link
                  key={p.id}
                  href={`/case/people/${p.slug}`}
                  className="block rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 hover:border-[var(--color-accent)] transition"
                >
                  <h3 className="text-lg font-bold tracking-tight">{p.name}</h3>
                  <p className="text-sm text-[var(--color-accent)] font-medium mt-0.5">
                    {p.role}
                    {p.agency ? ` · ${p.agency}` : ""}
                  </p>
                  {p.description ? (
                    <p className="mt-2 text-sm text-[var(--color-ink-soft)] leading-relaxed">
                      {p.description}
                    </p>
                  ) : null}
                </Link>
              ))}
            </div>
          </section>
        ),
      )}
      {rest.length > 0 ? (
        <section>
          <div className="border-l-2 border-[var(--color-line)] pl-4 mb-4">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">Other Named Individuals</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rest.map((p) => (
              <Link
                key={p.id}
                href={`/case/people/${p.slug}`}
                className="block rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 hover:border-[var(--color-accent)] transition"
              >
                <h3 className="text-lg font-bold tracking-tight">{p.name}</h3>
                <p className="text-sm text-[var(--color-accent)] font-medium mt-0.5">
                  {p.role}
                  {p.agency ? ` · ${p.agency}` : ""}
                </p>
                {p.description ? (
                  <p className="mt-2 text-sm text-[var(--color-ink-soft)] leading-relaxed">
                    {p.description}
                  </p>
                ) : null}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function J6DefendantsView({
  people,
  j6Filter,
  q,
  totalCount,
  page = 1,
  pageSize = people.length || 1,
}: {
  people: Awaited<ReturnType<typeof getPeople>>;
  j6Filter: "unclaimed" | "verified" | "pending";
  q: string;
  totalCount?: number;
  page?: number;
  pageSize?: number;
}) {
  const shownTotal = totalCount ?? people.length;
  const pageCount = Math.max(1, Math.ceil(shownTotal / pageSize));
  const first = shownTotal === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(shownTotal, first + people.length - 1);
  const heading =
    j6Filter === "unclaimed"
      ? `${shownTotal.toLocaleString()} J6 defendant profiles waiting to be claimed`
      : j6Filter === "verified"
        ? `${shownTotal.toLocaleString()} J6 defendants verified`
        : `${shownTotal.toLocaleString()} J6 claims pending review`;
  const lead =
    j6Filter === "unclaimed"
      ? "Profiles ready for the defendant to claim and build out. Every claim is checked against the DOJ docket and public record before approval."
      : j6Filter === "verified"
        ? "Defendants who have claimed and verified their profile. Their case archive is theirs."
        : "Claims submitted and awaiting Ryan's review.";
  return (
    <div id="j6-profile-list" className="scroll-mt-24">
      <div className="mb-5 overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]">
        <div className="grid gap-px bg-[var(--color-line)] md:grid-cols-[1fr_0.8fr]">
          <div className="bg-[var(--color-surface)] p-5">
            <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
              Anti-Weaponization Case Builder
            </p>
            <h2 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight">
              {heading}
            </h2>
            <p className="mt-2 text-sm text-[var(--color-ink-soft)] leading-relaxed max-w-2xl">
              {lead}
            </p>
          </div>
          <div className="bg-[var(--color-paper)] p-5">
            <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-black">
              The build path
            </p>
            <ol className="mt-3 grid gap-2 text-sm text-[var(--color-ink-soft)]">
              <li><strong className="text-[var(--color-ink)]">1.</strong> Find your name.</li>
              <li><strong className="text-[var(--color-ink)]">2.</strong> Claim the profile with proof it is you.</li>
              <li><strong className="text-[var(--color-ink)]">3.</strong> Build your page with facts, documents, media, and testimony.</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Sub-filter pills */}
      <nav className="mb-5 flex flex-wrap gap-2">
        {(["unclaimed", "verified", "pending", "all"] as const).map((f) => {
          const active = f === "all" ? false : f === j6Filter;
          const allActive = f === "all";
          const href = `/case?view=people${f !== "all" ? `&filter=${f}` : ""}${q ? `&q=${encodeURIComponent(q)}` : ""}`;
          const label =
            f === "all"
              ? "All people (grouped)"
              : f === "unclaimed"
                ? "Ready to claim"
                : f === "verified"
                  ? "Verified"
                  : "Pending review";
          return (
            <Link
              key={f}
              href={href}
              className={[
                "rounded-full px-3 py-1.5 text-xs font-bold border-2 transition",
                active
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-paper)]"
                  : allActive
                    ? "border-[var(--color-line)] hover:border-[var(--color-accent)]"
                    : "border-[var(--color-line)] hover:border-[var(--color-accent)]",
              ].join(" ")}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
          Showing {first.toLocaleString()}-{last.toLocaleString()} of{" "}
          {shownTotal.toLocaleString()}
        </p>
        <PaginationControls
          page={page}
          pageCount={pageCount}
          j6Filter={j6Filter}
          q={q}
        />
      </div>

      {people.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)] italic py-10 text-center">
          No profiles in this bucket yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {people.map((p) => {
            const badge =
              p.claim_status === "verified"
                ? { label: "Verified", bg: "var(--color-success)" }
                : p.claim_status === "pending"
                  ? { label: "Claim pending", bg: "var(--color-blue)" }
                  : { label: "Ready to claim", bg: "var(--color-support)" };
            const claimHref = `/case/people/${p.slug}/claim`;
            return (
              <article
                key={p.id}
                className="flex min-h-[210px] flex-col rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 transition hover:border-[var(--color-blue)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold tracking-tight leading-tight">
                    {p.name}
                  </h3>
                  <span
                    className="rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap text-[var(--color-paper)]"
                    style={{ background: badge.bg }}
                  >
                    {badge.label}
                  </span>
                </div>
                {p.role ? (
                  <p className="mt-1 text-xs text-[var(--color-muted)] leading-tight">
                    {p.role}
                  </p>
                ) : null}
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-[var(--color-muted)]">
                  <span className="rounded-md border border-[var(--color-line-soft)] bg-[var(--color-paper)] px-2 py-1">
                    {p.case_number ?? "Case # needed"}
                  </span>
                  <span className="rounded-md border border-[var(--color-line-soft)] bg-[var(--color-paper)] px-2 py-1 text-right">
                    {p.views_count.toLocaleString()} views
                  </span>
                </div>
                <div className="mt-auto pt-4">
                  {p.claim_status === "unclaimed" ? (
                    <Link
                      href={claimHref}
                      className="block rounded-lg bg-[var(--color-blue)] px-3 py-2.5 text-center text-sm font-black text-[var(--color-paper)] transition hover:bg-[var(--color-blue-strong)]"
                    >
                      Claim + build case →
                    </Link>
                  ) : p.claim_status === "pending" ? (
                    <Link
                      href={`/case/people/${p.slug}`}
                      className="block rounded-lg bg-[var(--color-blue-soft)] px-3 py-2.5 text-center text-sm font-black text-[var(--color-blue)] transition hover:bg-[var(--color-blue)] hover:text-[var(--color-paper)]"
                    >
                      View pending profile →
                    </Link>
                  ) : (
                    <Link
                      href={`/case/people/${p.slug}`}
                      className="block rounded-lg bg-[var(--color-success)] px-3 py-2.5 text-center text-sm font-black text-[var(--color-paper)] transition hover:opacity-90"
                    >
                      Open verified file →
                    </Link>
                  )}
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Link
                      href={`/case/people/${p.slug}`}
                      className="rounded-lg border border-[var(--color-line)] px-3 py-2 text-center text-xs font-bold text-[var(--color-ink-soft)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                    >
                      Profile
                    </Link>
                    <Link
                      href={`/submit?type=j6&about=${encodeURIComponent(p.name)}`}
                      className="rounded-lg border border-[var(--color-line)] px-3 py-2 text-center text-xs font-bold text-[var(--color-ink-soft)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                    >
                      Tip
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {pageCount > 1 ? (
        <div className="mt-6">
          <PaginationControls
            page={page}
            pageCount={pageCount}
            j6Filter={j6Filter}
            q={q}
          />
        </div>
      ) : null}
    </div>
  );
}

function PaginationControls({
  page,
  pageCount,
  j6Filter,
  q,
}: {
  page: number;
  pageCount: number;
  j6Filter: "unclaimed" | "verified" | "pending";
  q: string;
}) {
  const hrefFor = (nextPage: number) => {
    const params = new URLSearchParams({
      view: "people",
      filter: j6Filter,
      page: String(nextPage),
    });
    if (q) params.set("q", q);
    return `/case?${params.toString()}`;
  };

  return (
    <nav className="flex items-center gap-2" aria-label="J6 profile pages">
      <Link
        href={hrefFor(Math.max(1, page - 1))}
        aria-disabled={page <= 1}
        className={[
          "inline-flex min-h-10 items-center rounded-lg border px-3 text-xs font-black uppercase",
          page <= 1
            ? "pointer-events-none border-[var(--color-line)] text-[var(--color-muted)] opacity-50"
            : "border-[var(--color-line)] bg-[var(--color-paper)] text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
        ].join(" ")}
      >
        Previous
      </Link>
      <span className="font-mono text-xs font-black tabular-nums text-[var(--color-muted)]">
        {page.toLocaleString()} / {pageCount.toLocaleString()}
      </span>
      <Link
        href={hrefFor(Math.min(pageCount, page + 1))}
        aria-disabled={page >= pageCount}
        className={[
          "inline-flex min-h-10 items-center rounded-lg border px-3 text-xs font-black uppercase",
          page >= pageCount
            ? "pointer-events-none border-[var(--color-line)] text-[var(--color-muted)] opacity-50"
            : "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-[var(--color-paper)]",
        ].join(" ")}
      >
        Next
      </Link>
    </nav>
  );
}

function DocumentsView({ documents }: { documents: Awaited<ReturnType<typeof getDocuments>> }) {
  return (
    <div className="space-y-2">
      {documents.map((d) => (
        <Link
          key={d.id}
          href={`/case/documents/${d.slug}`}
          className="block rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] hover:border-[var(--color-accent)] transition p-4"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase tracking-wider font-bold text-[var(--color-accent)]">
                  {d.doc_type}
                </span>
                {d.document_date ? (
                  <span className="text-xs text-[var(--color-muted)]">
                    {format(new Date(d.document_date), "MMM d, yyyy")}
                  </span>
                ) : null}
              </div>
              <h2 className="text-base font-semibold">{d.title}</h2>
              {d.description ? (
                <p className="mt-1 text-sm text-[var(--color-ink-soft)] leading-relaxed">
                  {d.description}
                </p>
              ) : null}
              {d.source ? (
                <p className="mt-1 text-xs text-[var(--color-muted)]">{d.source}</p>
              ) : null}
            </div>
            <span className="text-[var(--color-accent)] text-sm font-semibold whitespace-nowrap">
              Open →
            </span>
          </div>
        </Link>
      ))}
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
          ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]"
          : "border-[var(--color-line)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]",
      ].join(" ")}
    >
      <p
        className={[
          "text-sm font-bold tracking-tight",
          featured
            ? "text-[var(--color-accent)]"
            : "text-[var(--color-ink)] group-hover:text-[var(--color-accent)]",
        ].join(" ")}
      >
        {title} <span aria-hidden>→</span>
      </p>
      <p className="mt-1 text-xs leading-snug text-[var(--color-ink-soft)]">{sub}</p>
    </Link>
  );
}
