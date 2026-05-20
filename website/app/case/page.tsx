import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import {
  getGrievances,
  getPeople,
  getEvents,
  getDocuments,
} from "@/lib/case";
import { getSiteSettings } from "@/lib/site-settings";
import { SITE } from "@/lib/site";

export const revalidate = 300;

const CASE_TITLE = "The Case · United States v. Nichols";
const CASE_DESCRIPTION =
  "Ryan Nichols' January 6 case archive — every filed grievance, every named official, every event on the timeline, every document. The full record.";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const ogImage = settings.case_og_url ?? `${SITE.url}/og/case-default.png`;
  return {
    title: "The Case",
    description: CASE_DESCRIPTION,
    openGraph: {
      type: "article",
      title: CASE_TITLE,
      description: CASE_DESCRIPTION,
      url: `${SITE.url}/case`,
      images: settings.case_og_url
        ? [{ url: ogImage, width: 1200, height: 630, alt: CASE_TITLE }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: CASE_TITLE,
      description: CASE_DESCRIPTION,
      images: settings.case_og_url ? [ogImage] : undefined,
    },
    alternates: { canonical: `${SITE.url}/case` },
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
  searchParams: Promise<{ view?: string; q?: string }>;
}) {
  const { view, q: rawQ } = await searchParams;
  const q = (rawQ ?? "").trim();
  const tab: Tab =
    view === "timeline" || view === "people" || view === "documents"
      ? (view as Tab)
      : "grievances";

  const [grievances, people, events, documents] = await Promise.all([
    getGrievances(),
    getPeople(),
    getEvents(),
    getDocuments(),
  ]);

  const filteredGrievances = q
    ? grievances.filter((g) =>
        matchesQuery(q, g.title, g.summary, g.body, g.category)
      )
    : grievances;
  const filteredPeople = q
    ? people.filter((p) =>
        matchesQuery(q, p.name, p.role, p.agency, p.description)
      )
    : people;
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
      <header className="mb-8">
        <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
          The case · United States v. Nichols
        </p>
        <h1 className="mt-2 text-4xl sm:text-5xl font-bold tracking-tight leading-[1.05]">
          The full record — grievances, people, timeline, documents.
        </h1>
        <p className="mt-4 text-base text-[var(--color-ink-soft)] max-w-2xl leading-relaxed">
          Every filed grievance, every named official, every event on the
          timeline, every document. Read it from whichever angle you want — they
          all cross-reference each other.
        </p>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl">
          <Stat label="Grievances" value={q ? filteredGrievances.length : grievances.length} />
          <Stat label="Events" value={q ? filteredEvents.length : events.length} />
          <Stat label="People" value={q ? filteredPeople.length : people.length} />
          <Stat label="Documents" value={q ? filteredDocuments.length : documents.length} />
        </div>

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

      <nav
        className="flex flex-wrap gap-1 border-b border-[var(--color-line)] mb-8"
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

      {tab === "grievances" && <GrievancesView grievances={filteredGrievances} />}
      {tab === "timeline" && <TimelineView events={filteredEvents} />}
      {tab === "people" && <PeopleView people={filteredPeople} />}
      {tab === "documents" && <DocumentsView documents={filteredDocuments} />}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2.5">
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mt-0.5">
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

function GrievancesView({ grievances }: { grievances: Awaited<ReturnType<typeof getGrievances>> }) {
  return (
    <div className="space-y-3">
      {grievances.map((g) => (
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
              <h2 className="text-lg font-bold tracking-tight">
                <span className="text-[var(--color-accent)] mr-2">
                  #{g.display_order}
                </span>
                {g.title}
              </h2>
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
  );
}

function TimelineView({ events }: { events: Awaited<ReturnType<typeof getEvents>> }) {
  return (
    <ol className="space-y-0">
      {events.map((e, i) => (
        <li key={e.id} className="relative pl-8 pb-8 border-l border-[var(--color-line)] last:border-l-0">
          <span
            className="absolute -left-[7px] top-1 h-3.5 w-3.5 rounded-full bg-[var(--color-accent)] ring-4 ring-[var(--color-paper)]"
            aria-hidden
          />
          <time className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
            {format(new Date(e.event_date), "MMMM d, yyyy")}
          </time>
          <h2 className="mt-1 text-lg font-bold tracking-tight">{e.title}</h2>
          {e.description ? (
            <p className="mt-2 text-sm text-[var(--color-ink-soft)] leading-relaxed max-w-2xl">
              {e.description}
            </p>
          ) : null}
          {e.location ? (
            <p className="mt-1 text-xs text-[var(--color-muted)]">📍 {e.location}</p>
          ) : null}
          {i === events.length - 1 ? null : null}
        </li>
      ))}
    </ol>
  );
}

function PeopleView({ people }: { people: Awaited<ReturnType<typeof getPeople>> }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {people.map((p) => (
        <Link
          key={p.id}
          href={`/case/people/${p.slug}`}
          className="block rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 hover:border-[var(--color-accent)] transition"
        >
          <h2 className="text-lg font-bold tracking-tight">{p.name}</h2>
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
