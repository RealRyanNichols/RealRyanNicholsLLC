import type { Metadata } from "next";
import { getEvents } from "@/lib/case";

export const metadata: Metadata = {
  title: "J6 Case Archive — timeline",
  robots: { index: false, follow: false },
};

export const revalidate = 3600;

// Iframe-embeddable case timeline: the most recent dated events from the
// archive, each linking back to its full event page. Compact, scrollable,
// dark-board styling.

export default async function TimelineEmbedPage() {
  let events: Awaited<ReturnType<typeof getEvents>> = [];
  try {
    events = (await getEvents())
      .filter((e) => e.event_date)
      .sort((a, b) => (b.event_date ?? "").localeCompare(a.event_date ?? ""))
      .slice(0, 10);
  } catch {
    events = [];
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[#1f2f55] bg-[#071126]">
      <div className="flex items-center justify-between gap-3 border-b border-[#e1bd5b]/20 px-4 py-2">
        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#e1bd5b]">
          United States v. Nichols · timeline
        </span>
        <a
          href="https://realryannichols.com/case/timeline"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-bold text-[#a9b7d0] no-underline hover:text-[#e1bd5b]"
        >
          Full timeline →
        </a>
      </div>
      <ol className="max-h-72 overflow-y-auto px-4 py-2">
        {events.map((e) => (
          <li key={e.slug} className="border-b border-[#f4efe4]/8 py-2 last:border-0">
            <a
              href={`https://realryannichols.com/case/events/${e.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group block no-underline"
            >
              <span className="block font-mono text-[10px] font-bold text-[#7fa9e3]">
                {e.event_date}
              </span>
              <span className="mt-0.5 block text-sm font-bold leading-snug text-[#f4efe4] group-hover:text-[#e1bd5b]">
                {e.title}
              </span>
            </a>
          </li>
        ))}
        {events.length === 0 ? (
          <li className="py-3 text-sm text-[#a9b7d0]">
            Timeline is loading. See the full record at realryannichols.com/case.
          </li>
        ) : null}
      </ol>
    </div>
  );
}
