import type { Metadata } from "next";
import { getCaseTotals } from "@/lib/case";

export const metadata: Metadata = {
  title: "J6 Case Archive — live stats",
  robots: { index: false, follow: false },
};

export const revalidate = 3600;

// Iframe-embeddable live archive counter. Dark investigation-board band with
// the numbers that make the archive real. Framing allowed by the /embed/*
// header set; every number links back to the archive.

export default async function StatsEmbedPage() {
  let totals = { documents: 0, ryanFiledGrievances: 0, daysArrestToPardon: 0, people: 0 };
  try {
    const t = await getCaseTotals();
    totals = {
      documents: t.documents ?? 0,
      ryanFiledGrievances: t.ryanFiledGrievances ?? 0,
      daysArrestToPardon: t.daysArrestToPardon ?? 0,
      people: t.people ?? 0,
    };
  } catch {
    // Fall through with zeros hidden below.
  }

  const stats: [number, string][] = [
    [totals.people, "People indexed"],
    [totals.documents, "Documents on file"],
    [totals.ryanFiledGrievances, "Grievances filed"],
    [totals.daysArrestToPardon, "Days, arrest to pardon"],
  ];

  // This widget is framed by other sites, so it paints the theater floor
  // itself instead of inheriting a host page's background.
  return (
    <div className="bg-[var(--color-paper)]">
      <a
        href="https://realryannichols.com/case"
        target="_blank"
        rel="noopener noreferrer"
        className="block overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] no-underline shadow-[0_20px_50px_rgba(0,0,0,0.4)]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-[var(--color-line)] px-4 py-2">
          <span className="eyebrow">The J6 Case Archive · live</span>
          <span className="text-[10px] font-bold text-[var(--color-muted)]">
            realryannichols.com
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-4 py-3 sm:grid-cols-4">
          {stats
            .filter(([n]) => n > 0)
            .map(([n, label]) => (
              <span key={label} className="block">
                <span
                  data-count={n}
                  className="display block text-2xl tabular-nums text-[var(--color-gold)]"
                >
                  {n.toLocaleString("en-US")}
                </span>
                <span className="mt-1 block text-[9px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                  {label}
                </span>
              </span>
            ))}
        </div>
      </a>
    </div>
  );
}
