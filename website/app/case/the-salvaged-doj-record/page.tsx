import type { Metadata } from "next";
import Link from "next/link";
import { getSupabaseStaticClient } from "@/lib/supabase/static";
import { ShareRail } from "@/components/ShareRail";
import { SITE } from "@/lib/site";

export const revalidate = 300;

const TITLE =
  "The Salvaged DOJ Record — the only canonical surviving copy of the Biden DOJ's Capitol Breach Cases listing";
const DESCRIPTION =
  "The Biden DOJ scrubbed its master listing of every January 6 defendant from justice.gov after the pardons. realryannichols.com preserves the canonical December 2023 snapshot — 1,092 defendants, 3,230 document links, every case number and case status the federal government published. Verified against the Wayback Machine.";

export const metadata: Metadata = {
  title: "The Salvaged DOJ Record",
  description: DESCRIPTION,
  alternates: { canonical: `${SITE.url}/case/the-salvaged-doj-record` },
  openGraph: {
    type: "article",
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE.url}/case/the-salvaged-doj-record`,
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

type ArchiveRow = {
  id: string;
  doj_slug: string;
  name: string;
  case_number: string | null;
  location: string | null;
  status_text: string | null;
  last_updated_label: string | null;
  doc_urls: string[] | null;
  doc_titles: string[] | null;
  wayback_url: string;
  matched_person_id: string | null;
};

export default async function SalvagedDojRecordPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const needle = (q ?? "").trim().toLowerCase();

  const supabase = getSupabaseStaticClient();

  // Counters
  const [
    { count: total },
    { count: matched },
    { count: sentenced },
  ] = await Promise.all([
    supabase.from("doj_capitol_archive").select("id", { count: "exact", head: true }),
    supabase
      .from("doj_capitol_archive")
      .select("id", { count: "exact", head: true })
      .not("matched_person_id", "is", null),
    supabase
      .from("doj_capitol_archive")
      .select("id", { count: "exact", head: true })
      .ilike("status_text", "%sentenced%"),
  ]);

  // Aggregate doc-link count.
  const { data: docAgg } = await supabase
    .from("doj_capitol_archive")
    .select("doc_urls")
    .not("doc_urls", "is", null)
    .limit(2000);
  const totalDocLinks = (docAgg ?? []).reduce(
    (s: number, r: { doc_urls: string[] | null }) => s + (r.doc_urls?.length ?? 0),
    0,
  );

  // Slice — we don't render all 1,092 by default; show first 60 then
  // surface a search hint. With ?q= we filter.
  let rowsQuery = supabase
    .from("doj_capitol_archive")
    .select(
      "id, doj_slug, name, case_number, location, status_text, last_updated_label, doc_urls, doc_titles, wayback_url, matched_person_id",
    )
    .order("name", { ascending: true });

  if (needle.length >= 2) {
    rowsQuery = rowsQuery.or(
      `name.ilike.%${needle}%,case_number.ilike.%${needle}%,location.ilike.%${needle}%`,
    );
  }
  const { data: rowsRaw } = await rowsQuery.limit(needle ? 200 : 60);
  const rows = (rowsRaw ?? []) as ArchiveRow[];

  // Pull slugs from the matched case_people so we can deep-link.
  const matchedIds = rows
    .map((r) => r.matched_person_id)
    .filter((id): id is string => !!id);
  const { data: peopleRaw } =
    matchedIds.length > 0
      ? await supabase
          .from("case_people")
          .select("id, slug")
          .in("id", matchedIds)
      : { data: [] as Array<{ id: string; slug: string }> };
  const slugById = new Map(
    (peopleRaw ?? []).map((p) => [p.id, p.slug] as const),
  );

  return (
    <article className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-accent)] font-bold">
        Public record · preserved
      </p>
      <h1 className="mt-2 text-3xl sm:text-5xl font-bold tracking-tight leading-[1.05] font-display">
        The Salvaged DOJ Record
      </h1>
      <p className="mt-4 text-base sm:text-lg text-[var(--color-ink-soft)] max-w-3xl leading-relaxed">
        The U.S. Department of Justice scrubbed its master listing of every
        January 6 defendant — <em>Capitol Breach Cases</em> at{" "}
        <span className="font-mono break-all">
          justice.gov/usao-dc/capitol-breach-cases
        </span>{" "}
        — from its live website sometime after the{" "}
        <strong>January 20, 2025 pardons</strong>. The page now returns{" "}
        <strong>Page not found.</strong> This is the canonical surviving copy
        — the December 2023 Wayback Machine snapshot of the page in full,
        parsed defendant-by-defendant, with every case number, every case
        status, and every document link the federal government published.
        Verifiable against archive.org. Free, in public, forever.
      </p>

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <BigStat label="Defendants preserved" value={total ?? 0} />
        <BigStat label="Matched to J6 archive" value={matched ?? 0} />
        <BigStat label="Document links preserved" value={totalDocLinks} />
        <BigStat label="With sentencing data" value={sentenced ?? 0} />
      </div>

      <div className="mt-6">
        <ShareRail
          url={`${SITE.url}/case/the-salvaged-doj-record`}
          title="The only canonical surviving copy of the Biden DOJ's January 6 defendant listing — scrubbed from justice.gov, preserved here. realryannichols.com/case/the-salvaged-doj-record"
        />
      </div>

      <Link
        href="/evidence-the-doj-tried-to-erase"
        className="mt-6 block rounded-2xl border-2 border-[var(--color-blue)] bg-gradient-to-br from-[#0a1429] to-[#1c2a4a] p-5 group hover:from-[#0e1a36] hover:to-[#1c2a4a] transition"
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#e1bd5b] font-bold">
              Start here
            </p>
            <p className="mt-1 text-lg sm:text-xl font-bold tracking-tight font-display text-[var(--color-paper)]">
              This is Exhibit A. Read the whole story →
            </p>
            <p className="mt-1 text-sm text-[#cfd9ea]">
              <span className="font-bold">Evidence the DOJ Tried to Erase</span> — what
              came down, why it&apos;s verifiable, and every way to walk it.
            </p>
          </div>
          <span className="text-[var(--color-paper)] font-bold text-sm flex-shrink-0 group-hover:translate-x-1 transition-transform">
            Open →
          </span>
        </div>
      </Link>

      <section className="mt-8 rounded-2xl border-2 border-[var(--color-blue)] bg-[var(--color-blue-soft)] p-5 sm:p-6">
        <p className="text-xs uppercase tracking-wider font-bold text-[var(--color-blue)]">
          Provenance
        </p>
        <h2 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight font-display">
          Where every entry came from.
        </h2>
        <p className="mt-2 text-sm sm:text-base text-[var(--color-ink-soft)] leading-relaxed max-w-3xl">
          Source: the U.S. Attorney&apos;s Office, District of Columbia,{" "}
          <em>Capitol Breach Cases</em> page, captured by the Internet
          Archive on <strong>December 1, 2023</strong>. The federal
          government&apos;s own master listing as it stood at that moment.
          Each row below carries a direct Wayback link so the underlying
          government record is one click away. The original DOJ URL is
          documented in every entry for the historical record and now
          returns the DOJ&apos;s &ldquo;Page not found&rdquo; placeholder.
        </p>
        <p className="mt-3 text-xs text-[var(--color-muted)]">
          Source URL (now offline):{" "}
          <span className="font-mono break-all">
            https://www.justice.gov/usao-dc/capitol-breach-cases
          </span>
          <br />
          Wayback snapshot:{" "}
          <a
            href="https://web.archive.org/web/20231201000000/https://www.justice.gov/usao-dc/capitol-breach-cases"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-accent)] underline break-all"
          >
            web.archive.org/web/20231201000000/...capitol-breach-cases
          </a>
        </p>
      </section>

      <section className="mt-10">
        <div className="flex items-baseline justify-between gap-3 flex-wrap mb-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight font-display">
            Search the preserved record
          </h2>
          <p className="text-xs text-[var(--color-muted)]">
            {needle
              ? `${rows.length} matching ${rows.length === 1 ? "entry" : "entries"} for "${needle}"`
              : `Showing first ${rows.length} of ${total ?? 0} preserved entries.`}
          </p>
        </div>

        <form
          method="get"
          action="/case/the-salvaged-doj-record"
          className="mb-6 flex flex-col sm:flex-row gap-2"
        >
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search by name, case number, or location… (e.g. Nichols, 1:21-cr-00117, Texas)"
            className="flex-1 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-base focus:outline-none focus:border-[var(--color-accent)]"
          />
          <button
            type="submit"
            className="rounded-lg border-2 border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-paper)] px-5 py-3 font-bold hover:bg-[var(--color-accent-strong)]"
          >
            Search
          </button>
          {q ? (
            <Link
              href="/case/the-salvaged-doj-record"
              className="rounded-lg border-2 border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-3 text-center font-bold text-[var(--color-ink)] hover:border-[var(--color-accent)]"
            >
              Clear
            </Link>
          ) : null}
        </form>

        <div className="space-y-3">
          {rows.length === 0 ? (
            <p className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 text-center text-[var(--color-ink-soft)] italic">
              No matching preserved entries.
            </p>
          ) : (
            rows.map((r) => {
              const matchedSlug = r.matched_person_id
                ? slugById.get(r.matched_person_id)
                : null;
              return (
                <article
                  key={r.id}
                  className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 sm:p-5"
                >
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <h3 className="text-base sm:text-lg font-bold tracking-tight">
                      {matchedSlug ? (
                        <Link
                          href={`/case/people/${matchedSlug}`}
                          className="hover:text-[var(--color-accent)]"
                        >
                          {r.name}
                        </Link>
                      ) : (
                        r.name
                      )}
                    </h3>
                    {r.case_number ? (
                      <span className="font-mono text-xs text-[var(--color-muted)]">
                        {r.case_number}
                      </span>
                    ) : null}
                    {matchedSlug ? (
                      <span className="rounded-full bg-[var(--color-success)] text-[var(--color-paper)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                        ✓ archived
                      </span>
                    ) : null}
                  </div>
                  {r.location ? (
                    <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
                      <strong className="text-[var(--color-muted)] uppercase tracking-wider mr-1">
                        Arrested:
                      </strong>
                      {r.location}
                    </p>
                  ) : null}
                  {r.status_text ? (
                    <p className="mt-2 text-sm text-[var(--color-ink-soft)] whitespace-pre-wrap leading-snug">
                      {r.status_text}
                    </p>
                  ) : null}
                  {r.doc_urls && r.doc_urls.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {r.doc_urls.slice(0, 6).map((u, i) => (
                        <a
                          key={u}
                          href={`https://web.archive.org/web/2023/https://www.justice.gov${u.startsWith("/") ? u : "/" + u}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full border border-[var(--color-line)] hover:border-[var(--color-accent)] px-2.5 py-1 text-[11px] font-bold text-[var(--color-ink)] hover:text-[var(--color-accent)]"
                        >
                          📄 {r.doc_titles?.[i]?.slice(0, 50) ?? "Document"}
                        </a>
                      ))}
                      {r.doc_urls.length > 6 ? (
                        <span className="text-[11px] text-[var(--color-muted)] self-center">
                          + {r.doc_urls.length - 6} more
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                  <p className="mt-3 text-[10px] text-[var(--color-muted)]">
                    Source:{" "}
                    <a
                      href={r.wayback_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono hover:underline"
                    >
                      DOJ Capitol Breach Cases (Wayback, Dec 2023)
                    </a>
                    {r.last_updated_label ? (
                      <> · DOJ entry last updated {r.last_updated_label}</>
                    ) : null}
                  </p>
                </article>
              );
            })
          )}
        </div>
      </section>

      <section className="mt-12 rounded-2xl border-2 border-[var(--color-accent)] bg-[var(--color-surface)] p-5 sm:p-6">
        <p className="text-xs uppercase tracking-wider font-bold text-[var(--color-accent)]">
          Why this matters
        </p>
        <h2 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight font-display">
          A federal government scrubbed the record. A pardoned veteran preserved it.
        </h2>
        <div className="mt-3 prose-body text-sm sm:text-base">
          <p>
            The DOJ&apos;s <em>Capitol Breach Cases</em> page was the
            federal government&apos;s own public ledger of every person it
            prosecuted in connection with January 6. After the pardons of
            January 20, 2025, the page came down. Whatever the reason, the
            effect is the same: the canonical federal listing of every J6
            defendant — what they were charged with, what they were
            sentenced to, what the case status was at every step — no
            longer lives at the URL where it always lived.
          </p>
          <p>
            This page is the surviving copy, in public, free, with full
            provenance. Every entry links back to the Internet
            Archive&apos;s Wayback Machine so the record is verifiable
            against an independent third party. The integrity of the
            public record does not depend on whether the prosecuting
            government chooses to keep it online.
          </p>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/case"
            className="rounded-full border-2 border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-paper)] px-5 py-2.5 text-sm font-bold hover:bg-[var(--color-accent-strong)]"
          >
            The full case archive →
          </Link>
          <Link
            href="/the-map-room"
            className="rounded-full border-2 border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-2.5 text-sm font-bold text-[var(--color-ink)] hover:border-[var(--color-accent)]"
          >
            The Map Room
          </Link>
          <Link
            href="/submit"
            className="rounded-full border-2 border-[var(--color-blue)] bg-[var(--color-blue)] text-[var(--color-paper)] px-5 py-2.5 text-sm font-bold hover:bg-[var(--color-blue-strong)]"
          >
            Send a tip / receipt
          </Link>
        </div>
      </section>
    </article>
  );
}

function BigStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border-2 border-[var(--color-accent)] bg-[var(--color-paper)] p-4">
      <div className="text-3xl sm:text-4xl font-bold tabular-nums tracking-tight leading-none text-[var(--color-accent)]">
        {value.toLocaleString()}
      </div>
      <div className="mt-2 text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-bold">
        {label}
      </div>
    </div>
  );
}
