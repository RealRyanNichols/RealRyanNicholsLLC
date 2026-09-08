import Link from "next/link";
import type { J6Filter, Tab } from "@/components/case/archive";

// The record's search box: one component for every door on /case (the front
// door, the archive views, the people directory). A plain GET form to /case,
// so it works with no JavaScript and lands on the archive with a hit count
// per section. This is the case record's search; the sitewide /search
// covers posts and videos.
export function CaseSearchForm({
  q = "",
  view,
  j6Filter = "all",
  placeholder = "Search grievances, people, events, documents…",
  className,
}: {
  q?: string;
  // The view the results open on. Omitted, the archive's first tab.
  view?: Tab;
  // The people directory's claim bucket, carried through a search there.
  j6Filter?: J6Filter;
  placeholder?: string;
  className?: string;
}) {
  const clearParams = new URLSearchParams();
  if (view) clearParams.set("view", view);
  if (j6Filter !== "all") clearParams.set("filter", j6Filter);
  const clearQs = clearParams.toString();
  const clearHref = clearQs ? `/case?${clearQs}` : "/case";

  return (
    <form
      method="get"
      action="/case"
      role="search"
      aria-label="Search the record"
      className={["flex max-w-2xl flex-col gap-2 sm:flex-row", className ?? ""].join(" ").trim()}
    >
      {view ? <input type="hidden" name="view" value={view} /> : null}
      {j6Filter !== "all" ? <input type="hidden" name="filter" value={j6Filter} /> : null}
      <input
        type="search"
        name="q"
        defaultValue={q}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-h-11 flex-1 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 text-sm text-[var(--color-ink)]"
      />
      {/* On a phone the field takes the row and the buttons share the next
          one; from sm up the three sit in one line. */}
      <div className="flex gap-2">
        <button
          type="submit"
          className="btn-accent min-h-11 flex-1 rounded-xl px-5 text-sm font-bold sm:flex-none"
        >
          Search
        </button>
        {q ? (
          <Link
            href={clearHref}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 text-sm font-bold text-[var(--color-ink-soft)] hover:border-[var(--color-navy)] hover:text-[var(--color-navy)] sm:flex-none"
          >
            Clear
          </Link>
        ) : null}
      </div>
    </form>
  );
}
