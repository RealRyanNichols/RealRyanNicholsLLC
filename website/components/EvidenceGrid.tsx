import Link from "next/link";
import { format } from "date-fns";
import type { CaseAuthorRole, CaseDocument } from "@/lib/case";

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

function groupByAuthor(docs: CaseDocument[]): { role: CaseAuthorRole; docs: CaseDocument[] }[] {
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
    .map((role) => ({ role, docs: docs.filter((d) => d.author_role === role) }))
    .filter((g) => g.docs.length > 0);
}

const SECTION_LEAD: Record<CaseAuthorRole, string> = {
  ryan: "Ryan Nichols' own paperwork — grievances, motions, letters, cell notes.",
  co_detainee: "Corroborating witness statements and letters from fellow January 6 detainees.",
  attorney: "Defense counsel correspondence (Joseph McBride, Jonathan Gross).",
  court: "Court orders, rulings, transcripts, and docket entries.",
  government: "Responses from DC DOC, the U.S. Marshals, and federal agencies.",
  family: "Letters to Ryan from his wife Bonnie and family.",
  media: "Press coverage.",
  evidence: "Photographs and exhibits.",
  other: "Other documents on file.",
};

export function EvidenceGrid({ documents }: { documents: CaseDocument[] }) {
  if (documents.length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted)] italic">
        No scans linked to this entry yet. Curating is ongoing — check back.
      </p>
    );
  }
  const groups = groupByAuthor(documents);
  return (
    <div className="space-y-8">
      {groups.map(({ role, docs }) => (
        <section key={role}>
          <div className="flex items-baseline justify-between gap-3 mb-3 flex-wrap">
            <div>
              <h3 className="text-sm font-bold tracking-tight">
                <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold mr-2 ${ROLE_CLASS[role]}`}>
                  {ROLE_LABEL[role]}
                </span>
                {docs.length} {docs.length === 1 ? "document" : "documents"}
              </h3>
              <p className="text-xs text-[var(--color-muted)] mt-1 max-w-2xl">
                {SECTION_LEAD[role]}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {docs.map((d) => (
              <Link
                key={d.id}
                href={`/case/documents/${d.slug}`}
                className="group block rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] overflow-hidden hover:border-[var(--color-accent)] transition"
              >
                <div className="aspect-[3/4] bg-black overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/case-doc/${d.slug}/image`}
                    alt={d.title}
                    loading="lazy"
                    draggable={false}
                    className="w-full h-full object-cover select-none group-hover:opacity-90 transition"
                  />
                </div>
                <div className="p-3">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--color-accent)] font-bold">
                    {d.doc_type}
                    {d.document_date ? (
                      <>
                        {" · "}
                        {format(new Date(d.document_date), "MMM d, yyyy")}
                      </>
                    ) : null}
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-snug line-clamp-3 text-[var(--color-ink)]">
                    {d.title}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
