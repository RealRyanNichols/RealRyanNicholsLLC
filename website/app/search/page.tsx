import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { SearchBox } from "@/components/SearchBox";
import { getSupabaseStaticClient } from "@/lib/supabase/static";
import { SITE } from "@/lib/site";
import {
  getGrievances,
  getPeople,
  getEvents,
  getDocuments,
  type CaseDocument,
  type CaseEvent,
  type CaseGrievance,
  type CasePerson,
} from "@/lib/case";
import { filterArchive } from "@/components/case/archive";
import { Highlight } from "@/components/case/Highlight";

export const dynamic = "force-dynamic";

type Hit = {
  slug: string;
  type: string;
  title: string | null;
  category: string | null;
  tags: string[] | null;
  excerpt: string | null;
  thumbnail_url: string | null;
  published_at: string | null;
};

// Common entry points so the page is useful before you type anything.
const SUGGESTED = [
  "January 6",
  "Censorship",
  "Harassment",
  "Deadly conduct",
  "Bond",
  "FBI",
  "Wall of Shame",
  "Free speech",
];

function typeLabel(type: string): string {
  return type === "video"
    ? "Video"
    : type === "photo"
      ? "Photo"
      : type === "note"
        ? "Note"
        : "Article";
}

function readQuery(sp: Record<string, string | string[] | undefined>): string {
  const raw = sp.q;
  const v = Array.isArray(raw) ? raw[0] : raw;
  return (v ?? "").trim().slice(0, 120);
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const q = readQuery(await searchParams);
  const title = q ? `Search: ${q}` : "Search the record";
  return {
    title,
    description:
      "Search every article, post, and video on RealRyanNichols.com — by keyword, person, court term, or topic.",
    alternates: { canonical: `${SITE.url}/search` },
    // Internal search-result pages shouldn't be indexed (thin/duplicate); the
    // underlying articles are indexed on their own canonical URLs.
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const q = readQuery(await searchParams);

  // One query, two scopes: the posts index (search_posts) and the case
  // record, filtered exactly the way /case?q= filters it
  // (components/case/archive.ts). A defendant's name or the word
  // "grievance" typed into the header lands in the case files too.
  let results: Hit[] = [];
  let caseHits: CaseHits | null = null;
  if (q.length >= 2) {
    const supabase = getSupabaseStaticClient();
    const [{ data }, grievances, people, events, documents] = await Promise.all([
      supabase.rpc("search_posts", { q, max_results: 50 }),
      getGrievances(),
      getPeople(),
      getEvents(),
      getDocuments(),
    ]);
    results = (data ?? []) as Hit[];
    const found = filterArchive({
      q,
      j6Filter: "all",
      grievances,
      people,
      events,
      documents,
      peopleNamed: 0,
    });
    caseHits = {
      grievances: found.filteredGrievances,
      events: found.filteredEvents,
      people: found.filteredPeople,
      documents: found.filteredDocuments,
      total: found.totalHits,
    };
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-accent)]">
        Search
      </p>
      <h1 className="mt-2 font-display text-3xl font-black tracking-tight sm:text-4xl">
        Find anything in the record.
      </h1>
      <p className="mt-2 max-w-2xl text-[var(--color-ink-soft)]">
        Every article, post, and video, and the case files — searchable by
        keyword, person, court term, or topic. Type a name, a charge, an
        agency, a date.
      </p>

      <div className="mt-5">
        <SearchBox initialQuery={q} autoFocus />
      </div>

      {/* Quick topics */}
      <div className="chip-row mt-4 flex flex-wrap gap-2">
        {SUGGESTED.map((t) => (
          <Link
            key={t}
            href={`/search?q=${encodeURIComponent(t)}`}
            className="rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-bold text-[var(--color-ink-soft)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            {t}
          </Link>
        ))}
      </div>

      {q.length >= 2 ? (
        <div className="mt-8">
          <p className="text-sm text-[var(--color-muted)]">
            {results.length} result{results.length === 1 ? "" : "s"} in articles and
            videos for{" "}
            <span className="font-bold text-[var(--color-ink)]">“{q}”</span>
          </p>

          {results.length > 0 ? (
            <ul className="mt-4 divide-y divide-[var(--color-line)]">
              {results.map((r) => (
                <li key={r.slug} className="py-4">
                  <Link href={`/posts/${r.slug}`} className="group block">
                    <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
                      <span className="rounded-full border border-[var(--color-line)] px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide">
                        {typeLabel(r.type)}
                      </span>
                      {r.category ? (
                        <span className="uppercase tracking-wider">{r.category}</span>
                      ) : null}
                      {r.published_at ? (
                        <>
                          <span aria-hidden>·</span>
                          <time dateTime={r.published_at}>
                            {format(new Date(r.published_at), "MMM d, yyyy")}
                          </time>
                        </>
                      ) : null}
                    </div>
                    <h2 className="mt-1 font-display text-xl font-black leading-snug text-[var(--color-ink)] group-hover:text-[var(--color-accent)]">
                      {r.title ?? r.slug}
                    </h2>
                    {r.excerpt ? (
                      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                        {r.excerpt}
                      </p>
                    ) : null}
                  </Link>
                  {r.tags && r.tags.length > 0 ? (
                    <div className="chip-row mt-2 flex flex-wrap gap-1.5">
                      {r.tags.slice(0, 6).map((tag) => (
                        <Link
                          key={tag}
                          href={`/search?q=${encodeURIComponent(tag)}`}
                          className="rounded-full bg-[var(--color-surface-2)] px-2 py-0.5 text-[11px] font-bold text-[var(--color-ink-soft)] transition hover:text-[var(--color-accent)]"
                        >
                          #{tag}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-6 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 text-center">
              <p className="font-bold text-[var(--color-ink)]">No articles or videos match “{q}.”</p>
              <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
                Try a person&apos;s name, a charge, an agency, or a single
                keyword. Or browse{" "}
                <Link href="/" className="font-bold text-[var(--color-accent)] hover:underline">
                  the feed
                </Link>{" "}
                and{" "}
                <Link href="/case" className="font-bold text-[var(--color-accent)] hover:underline">
                  the case
                </Link>
                .
              </p>
            </div>
          )}

          {caseHits ? <CaseFilesHits hits={caseHits} q={q} /> : null}
        </div>
      ) : (
        <p className="mt-8 text-sm text-[var(--color-muted)]">
          Start typing above, or tap a topic to jump in.
        </p>
      )}
    </div>
  );
}

type CaseHits = {
  grievances: CaseGrievance[];
  events: CaseEvent[];
  people: CasePerson[];
  documents: CaseDocument[];
  total: number;
};

// How many hits each section shows here before handing off to /case?q=,
// where the full list lives with its own paging.
const CASE_SAMPLE = 3;

// A snippet is a pointer, not the record: the full text lives on the hit's
// own page. Clipped before it is marked so a dozen hits stay a few KB.
const SNIPPET = 120;
function clip(text: string | null | undefined): string | null {
  if (!text) return null;
  const t = text.trim();
  return t.length <= SNIPPET ? t : `${t.slice(0, SNIPPET).replace(/\s+\S*$/, "")}…`;
}

// The second scope: what the query found in the case record, a sample per
// section with the matched word marked, each hit linking to its own page,
// and one door to the full results on /case.
function CaseFilesHits({ hits, q }: { hits: CaseHits; q: string }) {
  const encoded = encodeURIComponent(q);
  const sections = [
    {
      key: "grievances",
      label: "Grievances",
      href: `/case?view=grievances&q=${encoded}`,
      items: hits.grievances.map((g) => ({
        slug: g.slug,
        href: `/case/grievances/${g.slug}`,
        title: g.title,
        sub: clip(g.summary),
      })),
    },
    {
      key: "timeline",
      label: "Timeline",
      href: `/case?view=timeline&q=${encoded}`,
      items: hits.events.map((e) => ({
        slug: e.slug,
        href: `/case/events/${e.slug}`,
        title: e.title,
        sub: clip(e.description),
      })),
    },
    {
      key: "people",
      label: "People",
      href: `/case?view=people&q=${encoded}`,
      items: hits.people.map((p) => ({
        slug: p.slug,
        href: `/case/people/${p.slug}`,
        title: p.name,
        sub: p.role,
      })),
    },
    {
      key: "documents",
      label: "Documents",
      href: `/case?view=documents&q=${encoded}`,
      items: hits.documents.map((d) => ({
        slug: d.slug,
        href: `/case/documents/${d.slug}`,
        title: d.title,
        sub: clip(d.description),
      })),
    },
  ];

  return (
    <section className="mt-10" aria-labelledby="case-files-hits">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-navy)]">
        In the case files
      </p>
      <h2
        id="case-files-hits"
        className="mt-1 font-display text-2xl font-black tracking-tight text-[var(--color-ink)]"
      >
        {hits.total.toLocaleString("en-US")} match{hits.total === 1 ? "" : "es"} in the
        record for “{q}”
      </h2>

      {hits.total === 0 ? (
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          Nothing in the grievances, timeline, people, or documents matches that.{" "}
          <Link href="/case" className="font-bold text-[var(--color-navy)] hover:underline">
            Browse the case
          </Link>
          .
        </p>
      ) : (
        <>
          {sections
            .filter((s) => s.items.length > 0)
            .map((s) => (
              <div key={s.key} className="mt-6">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">
                    {s.label}{" "}
                    <span className="text-[var(--color-muted)]">
                      ({s.items.length.toLocaleString("en-US")})
                    </span>
                  </h3>
                  {s.items.length > CASE_SAMPLE ? (
                    <Link
                      href={s.href}
                      className="inline-flex min-h-11 items-center gap-1 text-xs font-bold text-[var(--color-navy)] hover:underline sm:min-h-0"
                    >
                      All {s.items.length.toLocaleString("en-US")}
                      <span aria-hidden>→</span>
                    </Link>
                  ) : null}
                </div>
                <ul className="mt-1 divide-y divide-[var(--color-line)]">
                  {s.items.slice(0, CASE_SAMPLE).map((item) => (
                    <li key={item.slug}>
                      <Link href={item.href} className="group block py-3">
                        <p className="font-bold leading-snug text-[var(--color-ink)] group-hover:text-[var(--color-navy)]">
                          <Highlight text={item.title} q={q} />
                        </p>
                        {item.sub ? (
                          <p className="mt-0.5 line-clamp-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                            <Highlight text={item.sub} q={q} />
                          </p>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          <Link
            href={`/case?q=${encoded}`}
            className="mt-6 inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 border-[var(--color-navy)] bg-[var(--color-blue-soft)]/60 px-5 text-sm font-bold text-[var(--color-navy)] transition hover:bg-[var(--color-navy)] hover:text-[var(--color-paper)]"
          >
            Open all {hits.total.toLocaleString("en-US")} in the case files
            <span aria-hidden>→</span>
          </Link>
        </>
      )}
    </section>
  );
}
