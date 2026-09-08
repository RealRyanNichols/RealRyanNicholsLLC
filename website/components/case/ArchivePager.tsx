import { PaginationControls } from "@/components/case/PaginationControls";
import type { Tab } from "@/components/case/archive";

// "Showing X–Y of N" plus Previous / Next under the timeline and documents
// views. Renders nothing when the list fits on one page.
export function ArchivePager({
  tab,
  page,
  pageCount,
  showing,
  q,
}: {
  tab: Tab;
  page: number;
  pageCount: number;
  showing: string | null;
  q: string;
}) {
  if (!(tab === "timeline" || tab === "documents") || pageCount <= 1) return null;
  return (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-line)] pt-5">
      <p className="text-sm text-[var(--color-muted)]">
        Showing {showing} {tab === "documents" ? "documents" : "events"}
      </p>
      <PaginationControls
        page={page}
        pageCount={pageCount}
        view={tab}
        q={q}
        label={tab === "documents" ? "Document pages" : "Timeline pages"}
      />
    </div>
  );
}
