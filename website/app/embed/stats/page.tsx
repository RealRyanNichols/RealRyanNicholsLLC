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
  let totals = { documents: 0, ryanFiledGrievances: 0, daysDetained: 0, people: 0 };
  try {
    const t = await getCaseTotals();
    totals = {
      documents: t.documents ?? 0,
      ryanFiledGrievances: t.ryanFiledGrievances ?? 0,
      daysDetained: t.daysDetained ?? 0,
      people: t.people ?? 0,
    };
  } catch {
    // Fall through with zeros hidden below.
  }

  const stats: [number, string][] = [
    [totals.people, "People indexed"],
    [totals.documents, "Documents on file"],
    [totals.ryanFiledGrievances, "Grievances filed"],
    [totals.daysDetained, "Days detained"],
  ];

  return (
    <a
      href="https://realryannichols.com/case"
      target="_blank"
      rel="noopener noreferrer"
      className="block overflow-hidden rounded-lg border border-[#1f2f55] bg-[#071126] no-underline"
    >
      <div className="flex items-center justify-between gap-3 border-b border-[#e1bd5b]/20 px-4 py-2">
        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#e1bd5b]">
          The J6 Case Archive · live
        </span>
        <span className="text-[10px] font-bold text-[#a9b7d0]">
          realryannichols.com
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-4 py-3 sm:grid-cols-4">
        {stats
          .filter(([n]) => n > 0)
          .map(([n, label]) => (
            <span key={label} className="block">
              <span className="block text-xl font-black tabular-nums leading-none text-[#f4efe4]">
                {n.toLocaleString("en-US")}
              </span>
              <span className="mt-1 block text-[9px] font-bold uppercase tracking-wider text-[#7c8aa6]">
                {label}
              </span>
            </span>
          ))}
      </div>
    </a>
  );
}
