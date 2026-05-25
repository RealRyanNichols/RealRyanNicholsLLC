import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { J6Banner } from "@/components/J6Banner";
import {
  getGrievances,
  getPeople,
  getEvents,
  getDocuments,
  getCaseTotals,
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
  searchParams: Promise<{ view?: string; q?: string; filter?: string }>;
}) {
  const { view, q: rawQ, filter: rawFilter } = await searchParams;
  const q = (rawQ ?? "").trim();
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

  const [grievances, people, events, documents, totals] = await Promise.all([
    getGrievances(),
    getPeople(),
    getEvents(),
    getDocuments(),
    getCaseTotals(),
  ]);

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

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-10">
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
          <SmallStat label="People named" value={q ? filteredPeople.length : people.length} />
          <SmallStat label="Facilities" value={totals.facilities} />
          <SmallStat label="Federal officers on record (IGP broken)" value={2} />
        </div>

        {/* Front door to the full defendant directory — the most-requested
            destination, made impossible to miss. */}
        <Link
          href="/case?view=people&filter=unclaimed"
          className="mt-6 flex items-center justify-between gap-4 rounded-2xl border-2 border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-5 hover:bg-[var(--color-accent)] transition group"
        >
          <div>
            <p className="text-xs uppercase tracking-wider font-bold text-[var(--color-accent)] group-hover:text-[var(--color-paper)]">
              The directory
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

        {/* Case Builder banner — anchors the wider J6 work at the top
            of the case page. Was on the homepage; moved here so Ryan's
            feed stays focused on his own posts. */}
        <div className="mt-8">
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
}: {
  people: Awaited<ReturnType<typeof getPeople>>;
  j6Filter: "all" | "unclaimed" | "verified" | "pending";
  q: string;
}) {
  // J6 filter mode: flat alphabetical list, all J6 defendants matching the
  // selected claim status. Skips the agency-group treatment entirely.
  if (j6Filter !== "all") {
    return <J6DefendantsView people={people} j6Filter={j6Filter} q={q} />;
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
}: {
  people: Awaited<ReturnType<typeof getPeople>>;
  j6Filter: "unclaimed" | "verified" | "pending";
  q: string;
}) {
  const heading =
    j6Filter === "unclaimed"
      ? `${people.length.toLocaleString()} J6 defendant profiles waiting to be claimed`
      : j6Filter === "verified"
        ? `${people.length.toLocaleString()} J6 defendants verified`
        : `${people.length.toLocaleString()} J6 claims pending review`;
  const lead =
    j6Filter === "unclaimed"
      ? "Profiles ready for the defendant to claim and build out. Anyone can claim — Ryan personally verifies every one against the DOJ docket before approval."
      : j6Filter === "verified"
        ? "Defendants who have claimed and verified their profile. Their case archive is theirs."
        : "Claims submitted and awaiting Ryan's review.";
  return (
    <div>
      <div className="border-l-2 border-[var(--color-accent)] pl-4 mb-5">
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
                  : { label: "Unclaimed", bg: "var(--color-accent)" };
            return (
              <Link
                key={p.id}
                href={`/case/people/${p.slug}`}
                className="block rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 hover:border-[var(--color-accent)] transition"
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
              </Link>
            );
          })}
        </div>
      )}
    </div>
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
