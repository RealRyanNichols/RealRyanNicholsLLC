import Link from "next/link";
import type { getCaseTotals } from "@/lib/case";
import { Eyebrow } from "@/components/case/ChapterHeader";

// The last rung of the /case CTA pyramid: one compact grid of links into
// every part of the record. Links, not paragraph cards — the counts beside
// them come from lib/case.ts, never from copy.
type Totals = Pick<
  Awaited<ReturnType<typeof getCaseTotals>>,
  "grievances" | "documents" | "corroborators" | "facilities"
>;

type Entry = { href: string; label: string; meta?: string; file?: boolean };

export function GoDeeper({ totals, className = "" }: { totals: Totals; className?: string }) {
  const entries: Entry[] = [
    { href: "/case", label: "The case hub" },
    { href: "/case?view=timeline", label: "Timeline" },
    { href: "/case?view=grievances", label: "Grievances", meta: totals.grievances.toLocaleString("en-US") },
    { href: "/case?view=documents", label: "Documents", meta: totals.documents.toLocaleString("en-US") },
    { href: "/case?view=people", label: "People of record" },
    { href: "/case/witnesses", label: "Co-detainees & witnesses", meta: totals.corroborators.toLocaleString("en-US") },
    { href: "/case/officials", label: "Officials named" },
    { href: "/case/geography", label: "Geography", meta: `${totals.facilities.toLocaleString("en-US")} facilities` },
    { href: "/case/damages", label: "Damages" },
    { href: "/case/cite", label: "Citation guide" },
    { href: "/llms.txt", label: "llms.txt", file: true },
    { href: "/rss.xml", label: "RSS", file: true },
  ];
  const linkCls =
    "inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[var(--color-navy)] hover:underline";
  return (
    <section id="go-deeper" className={`border-t-2 border-[var(--color-line)] pt-10 ${className}`}>
      <Eyebrow>Go deeper</Eyebrow>
      <h2 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
        Everything is public. Walk it yourself.
      </h2>
      {/* One column on a phone so a label never breaks mid-word beside its
          count; two and three columns as the width allows. */}
      <ul className="mt-4 grid grid-cols-1 gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map((e) => (
          <li key={e.href}>
            {e.file ? (
              <a href={e.href} className={linkCls}>
                {e.label}
                <span aria-hidden>→</span>
              </a>
            ) : (
              <Link href={e.href} className={linkCls}>
                {e.label}
                {e.meta ? (
                  <span className="text-xs font-normal text-[var(--color-muted)]">{e.meta}</span>
                ) : null}
                <span aria-hidden>→</span>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
