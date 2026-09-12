import type { getJ6ClaimCounts } from "@/lib/case";
import { J6DirectoryHero } from "@/components/case/J6DirectoryHero";
import { CaseSearchForm } from "@/components/case/CaseSearchForm";
import type { J6Filter } from "@/components/case/archive";

// The top of the J6 people directory (/case?view=people): the hero for the
// active claim bucket, the record's search box (components/case/
// CaseSearchForm.tsx, the same one every door on /case uses), and the
// match line. The box comes first, in the DOM and on screen, at every
// width: a family member looking for a name types it on the first screen
// of a phone, and what is seen, tabbed, and announced agree everywhere
// (a CSS reorder at one breakpoint moved the mismatch to the other).
// Nothing moves on load.
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
    <header className="mb-10 flex flex-col">
      <div className="mb-6">
        <CaseSearchForm
          q={q}
          view="people"
          j6Filter={j6Filter}
          placeholder="Search name, case number, or role…"
          className="max-w-none"
        />
        {q ? (
          <p className="mt-2 text-xs text-[var(--color-muted)]">
            {total.toLocaleString()} match
            {total === 1 ? "" : "es"} for &quot;{q}&quot; in this J6
            profile bucket.
          </p>
        ) : null}
      </div>

      <J6DirectoryHero counts={counts} activeFilter={j6Filter} />
    </header>
  );
}
