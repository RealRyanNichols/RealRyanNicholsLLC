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
    <div className="overflow-hidden rounded-lg border border-[var(--color-line-soft)] bg-[var(--color-surface)]">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-gold-bright)]/20 px-4 py-2">
        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-gold-bright)]">
          United States v. Nichols · timeline
        </span>
        <a
          href="https://realryannichols.com/case/timeline"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-bold text-[var(--color-muted)] no-underline hover:text-[var(--color-gold-bright)]"
        >
          Full timeline →
        </a>
      </div>
      <ol className="max-h-72 overflow-y-auto px-4 py-2">
        {events.map((e) => (
          <li key={e.slug} className="border-b border-[var(--color-cream)]/8 py-2 last:border-0">
            <a
              href={`https://realryannichols.com/case/events/${e.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group block no-underline"
            >
              <span className="block font-mono text-[10px] font-bold text-[var(--color-blue-ink)]">
                {e.event_date}
              </span>
              <span className="mt-0.5 block text-sm font-bold leading-snug text-[var(--color-cream)] group-hover:text-[var(--color-gold-bright)]">
                {e.title}
              </span>
            </a>
          </li>
        ))}
        {events.length === 0 ? (
          <li className="py-3 text-sm text-[var(--color-muted)]">
            Timeline is loading. See the full record at realryannichols.com/case.
          </li>
        ) : null}
      </ol>
    </div>
  );
}
