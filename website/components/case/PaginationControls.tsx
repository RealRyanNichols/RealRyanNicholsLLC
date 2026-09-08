import Link from "next/link";
import {
  ARCHIVE_LIST_ID,
  J6_PROFILE_LIST_ID,
  type J6Filter,
  type Tab,
} from "@/components/case/archive";

// Previous / N of M / Next, for every paged list on /case: the people
// directory, the timeline view, the documents view. Keeps the view, the
// claim filter, and the search query in the URL it builds.
export function PaginationControls({
  page,
  pageCount,
  view,
  j6Filter = "all",
  q,
  label = "Pages",
}: {
  page: number;
  pageCount: number;
  view: Tab;
  j6Filter?: J6Filter;
  q: string;
  label?: string;
}) {
  const hrefFor = (nextPage: number) => {
    const params = new URLSearchParams({ view, page: String(nextPage) });
    if (j6Filter !== "all") params.set("filter", j6Filter);
    if (q) params.set("q", q);
    // Land on the list, not the top of the header.
    return `/case?${params.toString()}#${view === "people" ? J6_PROFILE_LIST_ID : ARCHIVE_LIST_ID}`;
  };

  return (
    <nav className="flex items-center gap-2" aria-label={label}>
      <Link
        href={hrefFor(Math.max(1, page - 1))}
        aria-disabled={page <= 1}
        className={[
          "inline-flex min-h-11 items-center rounded-lg border px-3 text-xs font-black uppercase",
          page <= 1
            ? "pointer-events-none border-[var(--color-line)] text-[var(--color-muted)] opacity-50"
            : "border-[var(--color-line)] bg-[var(--color-paper)] text-[var(--color-ink)] hover:border-[var(--color-navy)] hover:text-[var(--color-navy)]",
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
          "inline-flex min-h-11 items-center rounded-lg border px-3 text-xs font-black uppercase",
          page >= pageCount
            ? "pointer-events-none border-[var(--color-line)] text-[var(--color-muted)] opacity-50"
            : "border-[var(--color-navy)] bg-[var(--color-blue-soft)]/60 text-[var(--color-navy)] hover:bg-[var(--color-navy)] hover:text-[var(--color-paper)]",
        ].join(" ")}
      >
        Next
      </Link>
    </nav>
  );
}
