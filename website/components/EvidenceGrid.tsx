import Link from "next/link";
import { format } from "date-fns";
import type { CaseAuthorRole, CaseDocument } from "@/lib/case";
import { detectVideo, type VideoEmbed } from "@/lib/video";

const ROLE_LABEL: Record<CaseAuthorRole, string> = {
  ryan: "Ryan",
  co_detainee: "Co-detainee",
  attorney: "Attorney",
  court: "Court",
  government: "Govt response",
  family: "Family",
  media: "News",
  evidence: "Evidence",
  other: "Other",
};

const ROLE_CLASS: Record<CaseAuthorRole, string> = {
  ryan: "bg-[var(--color-accent-soft)] text-[var(--color-accent)] border-[var(--color-accent)]",
  co_detainee: "bg-amber-900/30 text-amber-200 border-amber-700",
  attorney: "bg-blue-900/30 text-blue-200 border-blue-700",
  court: "bg-purple-900/30 text-purple-200 border-purple-700",
  government: "bg-rose-900/30 text-rose-200 border-rose-700",
  family: "bg-emerald-900/30 text-emerald-200 border-emerald-700",
  media: "bg-slate-800 text-slate-300 border-slate-600",
  evidence: "bg-slate-800 text-slate-300 border-slate-600",
  other: "bg-slate-800 text-slate-300 border-slate-600",
};

const SECTION_LEAD: Record<CaseAuthorRole, string> = {
  ryan: "Ryan Nichols' own paperwork — grievances, motions, letters, cell notes.",
  co_detainee: "Corroborating witness statements and letters from fellow January 6 detainees.",
  attorney: "Defense counsel correspondence (Joseph McBride, Jonathan Gross).",
  court: "Court orders, rulings, transcripts, and docket entries.",
  government: "Responses from DC DOC, the U.S. Marshals, and federal agencies.",
  family: "Letters and correspondence with Ryan's family.",
  media: "Press coverage.",
  evidence: "Photographs and exhibits.",
  other: "Other documents on file.",
};

// Group documents that share the same series_lead_slug so multi-page items
// render together. Returns either a list of single docs or a list of series
// (single docs are series of length 1).
type DocSeries = {
  lead: CaseDocument;
  pages: CaseDocument[]; // ordered by series_position; the lead is always page 1
};

function buildSeries(docs: CaseDocument[]): DocSeries[] {
  const byLead = new Map<string, CaseDocument[]>();
  const standalone: CaseDocument[] = [];
  for (const d of docs) {
    if (d.series_lead_slug) {
      const arr = byLead.get(d.series_lead_slug) ?? [];
      arr.push(d);
      byLead.set(d.series_lead_slug, arr);
    } else {
      standalone.push(d);
    }
  }
  const result: DocSeries[] = [];
  for (const d of standalone) {
    result.push({ lead: d, pages: [d] });
  }
  for (const [leadSlug, pages] of byLead) {
    pages.sort((a, b) => a.series_position - b.series_position);
    const lead = pages.find((p) => p.slug === leadSlug) ?? pages[0];
    result.push({ lead, pages });
  }
  return result;
}

function groupByAuthor(series: DocSeries[]): { role: CaseAuthorRole; series: DocSeries[] }[] {
  const order: CaseAuthorRole[] = [
    "ryan",
    "co_detainee",
    "attorney",
    "court",
    "government",
    "evidence",
    "family",
    "media",
    "other",
  ];
  return order
    .map((role) => ({ role, series: series.filter((s) => s.lead.author_role === role) }))
    .filter((g) => g.series.length > 0);
}

export function EvidenceGrid({ documents }: { documents: CaseDocument[] }) {
  if (documents.length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted)] italic">
        No scans linked to this entry yet. Curating is ongoing — check back.
      </p>
    );
  }
  const allSeries = buildSeries(documents);
  const groups = groupByAuthor(allSeries);
  return (
    <div className="space-y-10">
      {groups.map(({ role, series }) => {
        const docCount = series.reduce((n, s) => n + s.pages.length, 0);
        return (
          <section key={role}>
            <div className="mb-4">
              <h3 className="text-sm font-bold tracking-tight flex items-center gap-2 flex-wrap">
                <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold ${ROLE_CLASS[role]}`}>
                  {ROLE_LABEL[role]}
                </span>
                <span>
                  {docCount} {docCount === 1 ? "document" : "documents"}
                  {series.length !== docCount ? ` in ${series.length} ${series.length === 1 ? "item" : "items"}` : ""}
                </span>
              </h3>
              <p className="text-xs text-[var(--color-muted)] mt-1 max-w-2xl">
                {SECTION_LEAD[role]}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {series.map((s) => (
                <SeriesCard key={s.lead.id} series={s} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function SeriesCard({ series }: { series: DocSeries }) {
  const lead = series.lead;
  const multi = series.pages.length > 1;
  const title = multi ? lead.series_title ?? lead.title : lead.title;
  const video = !multi ? detectVideo(lead.external_url) : null;
  const officialOnly = !lead.file_url && !!lead.external_url && !video;

  if (video) {
    return (
      <article className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] overflow-hidden">
        <div className="px-4 pt-3 pb-2 flex items-baseline justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-wider text-[var(--color-accent)] font-bold">
              {video.platformLabel} · video
              {lead.document_date ? (
                <> · {format(new Date(lead.document_date), "MMM d, yyyy")}</>
              ) : null}
            </p>
            <p className="mt-1 text-sm font-semibold leading-snug text-[var(--color-ink)]">
              {title}
            </p>
          </div>
          <Link
            href={`/case/documents/${lead.slug}`}
            className="text-xs font-semibold text-[var(--color-accent)] hover:underline whitespace-nowrap"
          >
            Share & discuss →
          </Link>
        </div>
        <VideoEmbedBlock video={video} title={title} />
      </article>
    );
  }

  // Article-style row: the document's face on the left (first page, or an
  // official-record seal for court filings we serve from the source), the
  // story of it on the right.
  return (
    <article className="overflow-hidden rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] sm:flex sm:items-stretch">
      <Link
        href={`/case/documents/${lead.slug}`}
        className="block shrink-0 sm:w-44"
        aria-label={`Open ${title}`}
      >
        {officialOnly ? (
          <span className="flex h-40 w-full flex-col items-center justify-center gap-1.5 bg-[var(--color-navy)] p-4 text-center sm:h-full">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fdf8ea"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-8 w-8"
              aria-hidden
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
              <path d="M14 2v6h6" />
              <path d="m9 15 2 2 4-4" />
            </svg>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#fdf8ea]">
              Official record
            </span>
            <span className="text-[10px] leading-snug text-[#8194b4]">
              served from the court docket
            </span>
          </span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/case-doc/${lead.slug}/image`}
            alt={title}
            loading="lazy"
            className="h-40 w-full bg-black object-cover object-top sm:h-full"
          />
        )}
      </Link>
      <div className="min-w-0 flex-1 p-4">
        <p className="text-[10px] uppercase tracking-wider text-[var(--color-accent)] font-bold">
          {lead.doc_type}
          {lead.document_date ? (
            <> · {format(new Date(lead.document_date), "MMM d, yyyy")}</>
          ) : null}
          {multi ? (
            <span className="ml-2 text-[var(--color-muted)]">
              {series.pages.length} pages
            </span>
          ) : null}
        </p>
        <Link href={`/case/documents/${lead.slug}`} className="block">
          <p className="mt-1 text-sm font-semibold leading-snug text-[var(--color-ink)] hover:text-[var(--color-navy)] transition">
            {title}
          </p>
        </Link>
        {lead.description ? (
          <p className="mt-1.5 text-xs leading-snug text-[var(--color-ink-soft)] line-clamp-3">
            {lead.description}
          </p>
        ) : null}
        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold">
          <Link
            href={`/case/documents/${lead.slug}`}
            className="text-[var(--color-navy)] hover:underline"
          >
            Read & discuss →
          </Link>
          {lead.external_url ? (
            <a
              href={lead.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-muted)] hover:text-[var(--color-navy)] hover:underline"
            >
              Open at the source →
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function VideoEmbedBlock({ video, title }: { video: VideoEmbed; title: string }) {
  // TikTok needs portrait aspect (9:16). YouTube/X use landscape (16:9).
  const aspect = video.kind === "tiktok" ? "aspect-[9/16]" : "aspect-video";
  return (
    <div className="bg-black">
      <div className={`relative w-full ${aspect}`}>
        <iframe
          src={video.embedUrl}
          title={title}
          loading="lazy"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 w-full h-full border-0"
        />
      </div>
      <div className="px-4 py-2 text-xs text-[var(--color-muted)] flex items-center justify-between gap-3">
        <span>Source: {video.platformLabel}</span>
        <a
          href={video.watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--color-accent)] font-semibold hover:underline"
        >
          Open on {video.platformLabel} →
        </a>
      </div>
    </div>
  );
}
