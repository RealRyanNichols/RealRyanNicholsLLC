import Link from "next/link";
import { format } from "date-fns";
import type { CaseDocument } from "@/lib/case";

export function EvidenceGrid({ documents }: { documents: CaseDocument[] }) {
  if (documents.length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted)] italic">
        No scans linked to this entry yet. Curating is ongoing — check back.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {documents.map((d) => (
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
  );
}
