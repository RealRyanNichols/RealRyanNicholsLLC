import Link from "next/link";
import type { J6Filter, Tab } from "@/components/case/archive";

// The four-tab strip under the /case archive headers. Two callers, two
// shapes, one TabLink: the people directory (its tabs carry the claim
// filter and no search query) and the archive views (their tabs carry the
// query and, while searching, the hit count per tab). Markup moved out of
// app/case/page.tsx verbatim, class order included.

function TabLink({
  active,
  href,
  children,
}: {
  active: boolean;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={[
        "inline-flex min-h-11 items-center px-4 py-2.5 -mb-px border-b-2 text-sm font-semibold transition sm:min-h-0",
        active
          ? "border-[var(--color-navy)] text-[var(--color-ink)]"
          : "border-transparent text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

function GraphLink() {
  return (
    <Link
      href="/case/nexus"
      className="inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 border-[#1f2f55] bg-[#0a1429] px-3.5 py-1.5 text-xs font-bold text-[#cfd9ea] transition hover:border-[var(--color-gold-bright)] hover:text-[var(--color-gold-bright)] sm:min-h-0"
    >
      <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-gold-bright)]" aria-hidden />
      View as graph
      <span aria-hidden>→</span>
    </Link>
  );
}

export function J6DirectoryTabs({ j6Filter }: { j6Filter: J6Filter }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-3 border-b border-[var(--color-line)]">
      <nav className="flex flex-wrap gap-1" aria-label="Case view">
        <TabLink active={false} href="/case?view=grievances">
          Grievances
        </TabLink>
        <TabLink active={false} href="/case?view=timeline">
          Timeline
        </TabLink>
        <TabLink
          active
          href={
            j6Filter === "all"
              ? "/case?view=people"
              : `/case?view=people&filter=${j6Filter}`
          }
        >
          People
        </TabLink>
        <TabLink active={false} href="/case?view=documents">
          Documents
        </TabLink>
      </nav>
      <div className="mb-1 flex items-center gap-2">
        <GraphLink />
      </div>
    </div>
  );
}

export function ArchiveTabs({
  tab,
  q,
  counts,
}: {
  tab: Tab;
  q: string;
  // Per-tab hit counts, shown beside each tab while a search is active.
  counts: { grievances: number; timeline: number; people: number; documents: number };
}) {
  return (
    <div className="flex items-end justify-between gap-3 flex-wrap border-b border-[var(--color-line)] mb-8">
      <nav
        className="flex flex-wrap gap-1"
        aria-label="Case view"
      >
        <TabLink active={tab === "grievances"} href={`/case?view=grievances${q ? `&q=${encodeURIComponent(q)}` : ""}`}>
          Grievances {q ? `(${counts.grievances})` : ""}
        </TabLink>
        <TabLink active={tab === "timeline"} href={`/case?view=timeline${q ? `&q=${encodeURIComponent(q)}` : ""}`}>
          Timeline {q ? `(${counts.timeline})` : ""}
        </TabLink>
        <TabLink active={tab === "people"} href={`/case?view=people${q ? `&q=${encodeURIComponent(q)}` : ""}`}>
          People {q ? `(${counts.people})` : ""}
        </TabLink>
        <TabLink active={tab === "documents"} href={`/case?view=documents${q ? `&q=${encodeURIComponent(q)}` : ""}`}>
          Documents {q ? `(${counts.documents})` : ""}
        </TabLink>
      </nav>
      <div className="mb-1 flex items-center gap-2">
        <Link
          href="/case/officials"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 border-[var(--color-navy)] bg-[var(--color-blue-soft)]/60 px-3.5 py-1.5 text-xs font-bold text-[var(--color-navy)] hover:bg-[var(--color-navy)] hover:text-[var(--color-paper)] transition sm:min-h-0"
        >
          Who&apos;s named
          <span aria-hidden>→</span>
        </Link>
        <Link
          href="/case/nexus"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 border-[#1f2f55] bg-[#0a1429] px-3.5 py-1.5 text-xs font-bold text-[#cfd9ea] hover:border-[var(--color-gold-bright)] hover:text-[var(--color-gold-bright)] transition sm:min-h-0"
        >
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-gold-bright)] animate-pulse" aria-hidden />
          View as graph
          <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  );
}
