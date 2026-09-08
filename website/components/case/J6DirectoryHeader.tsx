import Link from "next/link";
import type { getJ6ClaimCounts } from "@/lib/case";
import { J6DirectoryHero } from "@/components/case/J6DirectoryHero";
import type { J6Filter } from "@/components/case/archive";

// The top of the J6 people directory (/case?view=people): the hero for the
// active claim bucket, the search form, and the match line. Moved out of
// app/case/page.tsx verbatim.
export function J6DirectoryHeader({
  counts,
  j6Filter,
  q,
  total,
}: {
  counts: Awaited<ReturnType<typeof getJ6ClaimCounts>>;
  j6Filter: J6Filter;
  q: string;
  // Matches in this bucket for the current query.
  total: number;
}) {
  return (
    <header className="mb-10">
      <J6DirectoryHero counts={counts} activeFilter={j6Filter} />

      <form
        method="get"
        action="/case"
        className="mt-6 flex flex-col gap-2 sm:flex-row"
      >
        <input type="hidden" name="view" value="people" />
        {j6Filter !== "all" ? (
          <input type="hidden" name="filter" value={j6Filter} />
        ) : null}
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search name, case number, or role..."
          className="min-h-12 flex-1 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 text-sm"
        />
        <button
          type="submit"
          className="btn-accent min-h-12 rounded-xl px-5 text-sm font-black"
        >
          Search
        </button>
        {q ? (
          <Link
            href={
              j6Filter === "all"
                ? "/case?view=people"
                : `/case?view=people&filter=${j6Filter}`
            }
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 text-sm font-bold text-[var(--color-ink-soft)] hover:border-[var(--color-navy)] hover:text-[var(--color-navy)]"
          >
            Clear
          </Link>
        ) : null}
      </form>
      {q ? (
        <p className="mt-2 text-xs text-[var(--color-muted)]">
          {total.toLocaleString()} match
          {total === 1 ? "" : "es"} for &quot;{q}&quot; in this J6
          profile bucket.
        </p>
      ) : null}
    </header>
  );
}
